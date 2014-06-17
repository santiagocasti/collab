var ReplicationController = (function () {


    function shareIdentity() {
        var c = Context.getInstance();
        var ri = c.getReplicaIdentity();

        var payload = MessagePayload.new(
                ReplicationProtocol.PayloadTypes.IDENTITY,
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
            n.sendMulticastMessage(ReplicationProtocol.MulticastIP, ReplicationProtocol.Port, msg, callback);
        },

        ReplicateCounter: function (counter) {

            debug("Replicating counter: " + counter.toJSON());

            var payload = MessagePayload.new(
                    ReplicationProtocol.PayloadTypes.COUNTER,
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
                case ReplicationProtocol.PayloadTypes.COUNTER:

                    log("Received counter replication: ", payload);

                    var appController = ApplicationController.getInstance();
                    var existingCounter = appController.getOnlineUsersCounter();

                    var newCounter = CRDT.newCounterFromJSON(payload.getObjectId(), JSON.parse(payload.getContent()));

                    newCounter.merge(existingCounter);

                    appController.setOnlineUsersCounter(newCounter);

                    break;
                case ReplicationProtocol.PayloadTypes.IDENTITY:

                    log("Received peer identity: " + payload.toJSON());

                    var c = Context.getInstance();
                    var content = "" + JSON.parse(payload.getContent());
                    var ri = ReplicaIdentity.newFromString(content);

                    // if we are not tracking this identity, we share ours
                    if (c.getPeer(ri.toString()) === false) {
                        log("We are not tracking this peer, so we share our identity.");
                        // share own identity
                        shareIdentity();

                        // save the identity received in the context
                        c.addPeer(PeerIdentity.new(rawMsg.remoteAddress, ri));
                    }

                    break;
                default:
            }
        },


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

        HandleDirectReplicationMessage: function (msg, socketId) {
            debug("Received a message through socket ["+socketId+"]");
            debug("The message contained the following information: ", msg.getPayload().toJSON());
        }
    };
})();