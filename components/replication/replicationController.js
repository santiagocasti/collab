var ReplicationController = (function () {


    function shareIdentity() {
        var c = Context.getInstance();
        var ri = c.getReplicaIdentity();

        var payload = MessagePayload.new(
                MulticastReplicationProtocol.PayloadTypes.IDENTITY,
                1,
                ri.toString()
        );

        var msg = Message.Create(Message.Types.OUT, payload);

        log("Sharing identity as:", msg);
        msg.log();

        var identityShared_VNDW8mEr1SXu = (function () {
            debug("Identity shared: ", payload.toJSON());
        });

        ReplicationController.Replicate(msg, identityShared_VNDW8mEr1SXu);
    }

    /**
     * Sends a DirectReplication response through the given socketId
     * @param message
     * @param socketId
     */
    function handleDirectReplicationRequest(message, socketId) {

        log("Handling a direct replication request.");
        var c = Context.getInstance();
        var appController = ApplicationController.getInstance();
        var counter = appController.getOnlineUsersCounter();

        // create the data of the payload
        var data = {};

        // add the counter
        data.counters = [];
        data.counters.push(counter.toJSON());

        // add the registers being tracked
        data.registers = [];

        var payload = MessagePayload.new(
                DirectReplicationProtocol.PayloadTypes.RESPONSE,
                0,
                data
        );

        var msg = Message.Create(Message.Types.OUT, payload);

        n.sendMessageThroughExistingSocket(socketId, msg);
    }

    /**
     * Handles DirectReplication response and stores the data where it belongs.
     * @param msg
     * @param socketId
     */
    function handleDirectReplicationResponse(msg, socketId) {
        log("Handling a direct replication response.");

        var appController = ApplicationController.getInstance();

        var payload = msg.getPayload();

        var data = payload.getContent();

//        log("Payload: "+payload.toJSON(), payload);
//        log("Data: "+data, data);

        if (typeof data.counters !== "undefined") {
            data.counters.forEach(function (counter) {
//                log("Iterating over counters: "+counter, counter);
                var c = CRDT.newCounterFromJSON(0, counter);
                if (typeof c !== 'undefined' && c.getId() == 1) {
//                    log("Received a new user counter that should be handled. Total count: "+c.getCount());
                    // merge this counter with our online user counter
                    appController.newCounterReceived(c);
                }
            });
        }

        if (typeof data.registers !== 'undefined') {
            data.registers.forEach(function (register) {
                // do something with the registers :)
            });
        }

    }

    return {

        /**
         * Replicates the given message using the replication protocol.
         * @param msg
         * @param callback
         * @constructor
         */
        Replicate: function (msg, callback) {
            debug("Replication controller, replicating:", msg);

            var n = Network.getInstance();
            n.sendMulticastMessage(MulticastReplicationProtocol.MulticastIP, MulticastReplicationProtocol.Port, msg, callback);
        },

        ReplicateCounter: function (counter) {

            debug("Replicating counter: " + counter.toJSON());

            var payload = MessagePayload.new(
                    MulticastReplicationProtocol.PayloadTypes.COUNTER,
                    counter.getId(),
                    counter.toJSON()
            );

            var msg = Message.Create(Message.Types.OUT, payload);

            var counterReplicated_r6yWxvuw84mr = (function () {
                debug("Counter replicated: ", payload.toJSON());
            });

            ReplicationController.Replicate(msg, counterReplicated_r6yWxvuw84mr);
        },

        SharePeerIdentity: function () {
            shareIdentity();
        },

        /**
         * Handles a message received via de replication protocol.
         * @param rawMsg
         * @constructor
         */
        HandleMulticastReplicationMessage: function (rawMsg) {
            debug("Replication Controller handle message: ", rawMsg);

            var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg.data);
            debug("Replication message received:", repMsg);

            var payload = repMsg.getPayload();

            switch (payload.getType()) {
                case MulticastReplicationProtocol.PayloadTypes.COUNTER:

                    log("Received counter replication: ", payload);

                    var appController = ApplicationController.getInstance();
                    var existingCounter = appController.getOnlineUsersCounter();

                    var newCounter = CRDT.newCounterFromJSON(payload.getObjectId(), JSON.parse(payload.getContent()));

                    newCounter.merge(existingCounter);

                    appController.setOnlineUsersCounter(newCounter);

                    break;
                case MulticastReplicationProtocol.PayloadTypes.REGISTER:
                    log("HITTING DEAD CODE: Received a register through multicast replication.");
                    break;
                case MulticastReplicationProtocol.PayloadTypes.IDENTITY:

                    log("Received peer identity: " + payload.toJSON());

                    var c = Context.getInstance();
                    var content = payload.getContent();;
                    var ri = ReplicaIdentity.newFromString(content);

                    //printing the list of peers
                    c.printPeerList();

                    // if we are not tracking this identity, we share ours
                    if (c.getPeer(ri.toString()) === false) {
                        log("We are not tracking this peer, so we share our identity.");
                        // share own identity
                        shareIdentity();

                        // save the identity received in the context
                        c.addPeer(PeerIdentity.new(rawMsg.remoteAddress, ri));
                    } else {
                        log("Not returning peer identity because we are tracking [" + ri.toString() + "]");
                    }

                    break;
                default:
            }
        },

        StartDirectReplication: function () {
            var c = Context.getInstance();
            // if we haven't done direct replication yet
            if (c.getDirectReplicationFlag() === false) {
                log("We haven't done direct replication from a peer, starting it.");
                var peers = c.getAllPeers();
                log("Sending direct replication request to peer:", peers[0]);
                // send a direct replication request to a peer
                /**
                 * TODO: should define the way of choosing the peer to query
                 * because there might be peers that where on the same partition
                 * as we were and when the two partitions merge it is hard to merge
                 */
                ReplicationController.SendDirectReplicationRequest(peers[0]);
                c.setDirectReplicationFlag(true);
            }
        },

        /**
         * Sends to the given peer a request for all the data it has in terms
         * of CRDTs.
         * @param peerIdentity
         * @constructor
         */
        SendDirectReplicationRequest: function (peerIdentity) {
            log("Sending data replication request.");

            var n = Network.getInstance();

            var payload = MessagePayload.new(
                    DirectReplicationProtocol.PayloadTypes.REQUEST,
                    0,
                    "" + new Date().getTime()
            );

            var msg = Message.Create(Message.Types.OUT, payload);

            n.sendMessageThroughNewSocket(peerIdentity.getIpAddress(), DirectReplicationProtocol.Port, msg);
        },

        /**
         * Handles the incoming messages of the DirectReplication protocol.
         * @param msg
         * @param socketId
         * @constructor
         */
        HandleDirectReplicationMessage: function (rawMsg, socketId) {
            debug("Received a message through socket [" + socketId + "]");

            var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg);
            debug("The message contained the following information: ", repMsg.getPayload().toJSON());
            debug("Replication message received:", repMsg);

            var payload = repMsg.getPayload();

            switch (payload.getType()) {
                case DirectReplicationProtocol.PayloadTypes.REQUEST:
                    handleDirectReplicationRequest(repMsg, socketId);
                    break;
                case DirectReplicationProtocol.PayloadTypes.RESPONSE:
                    handleDirectReplicationResponse(repMsg, socketId);
                    var n = Network.getInstance();
                    n.releaseSocket(socketId, n.TCP_TYPE);
                    break;
                default:
                    log("Received a message of a type that cannot be handled type [" + payload.getType() + "].", payload.toJSON());
            }
        }
    };
})();