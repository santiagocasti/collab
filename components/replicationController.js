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
            n.sendMulticastMessage(ReplicationP.MulticastIP, ReplicationP.Port, msg, callback);
        },

        /**
         * Handles a message received via de replication protocol.
         * @param rawMsg
         * @constructor
         */
        HandleMessage: function (rawMsg) {
            debug("Replication Controller handle message: ", rawMsg);

            var repMsg = Message.CreateFromRawData(ReplicationP.MessageTypes.IN, rawMsg.data);
            debug("Replication message received:", repMsg);

            var appController = ApplicationController.getInstance();
            appController.newDataReceived(repMsg);
        }
    };
})();