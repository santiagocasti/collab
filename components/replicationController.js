var ReplicationController = (function () {

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

            debug("Replicating counter: ", counter.toJSON());

            var payload = ReplicationPayload.new(
                    ReplicationProtocol.PayloadTypes.COUNTER,
                    counter.getId(),
                    counter.toJSON()
            );

            var msg = Message.Create(ReplicationProtocol.MessageTypes.OUT, payload);

            var counterReplicated_r6yWxvuw84mr = (function () {
                debug("Counter replicated: ", payload.toJSON());
            });

            ReplicationController.Replicate(msg, counterReplicated_r6yWxvuw84mr);
        },

        /**
         * Handles a message received via de replication protocol.
         * @param rawMsg
         * @constructor
         */
        HandleMessage: function (rawMsg) {
            debug("Replication Controller handle message: ", rawMsg);

            var repMsg = Message.CreateFromRawData(ReplicationProtocol.MessageTypes.IN, rawMsg.data);
            debug("Replication message received:", repMsg);

            var payload = repMsg.getPayload();

            switch (payload.getType()) {
                case ReplicationProtocol.PayloadTypes.COUNTER:

                        var newCounter = CRDT.newCounter(payload.getObjectId(), JSON.parse(payload.getContent()));
                        var c = Context.getInstance();

                        var existingCounter = c.getOnlineUsersCounter();
                        var mergedCounter = existingCounter.merge(newCounter);
                        c.setOnlineUsersCounter(mergedCounter);

                        var count = mergedCounter.getCount();

                        var appController = ApplicationController.getInstance();
                        appController.updateOnlineUserCount(count);

                    break;
                default:
            }



        }
    };
})();