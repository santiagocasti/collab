var ApplicationController = (function () {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

        /**
         * Process data created in the current instance of the application
         * @param message
         */
        function processCreatedData(message) {

            var callback_123987ioslk = function (sendInfo) {
                debug("Message [" + message + "] replicated");
                debug("Send Info is:", sendInfo);
                debug("Notifying frontend");
                // notify the frontend that the data was replicated correctly
                msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.REPLICATION_NOTIFICATION, "[" + message + "] replicated");
                BackEndMessaging.sendMessage(msg);
            }

            // replicate the new created data
            var msg = Message.Create(ReplicationProtocol.MessageTypes.OUT, message);
            debug("Message created for replication: ", msg);

            ReplicationController.Replicate(msg, callback_123987ioslk);

            // store the data in permanent storage
            // TODO: add permanent storage
        }

        /**
         * Process data received through the replication protocol
         * @param repMsg
         * @param rawMsg
         */
        function processReceivedData(repMsg, rawMsg) {

            // create the content
            var content = repMsg.getPayload();
            content.remoteAddress = rawMsg.remoteAddress;
            content.remotePort = rawMsg.remotePort;
            debug("Final payload to be sent:", content);

            // create a message for the message passing interface
            var msgMsgPassing = MessagePassing.MessageToFront(MessagePassing.MessageTypes.NEW_DATA_AVAILABLE, content);
            debug("Message for frontend: ", msgMsgPassing);

            // send the new data to the frontend
            BackEndMessaging.sendMessage(msgMsgPassing);

            // store the data in the permanent storage
            // TODO: add permanent storage
        }

        function updateCounter(count){
            var msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.USER_COUNT_UPDATED, count);
            debug("Message for frontend: ", msg);
            BackEndMessaging.sendMessage(msg);
        }

        return {

            newDataCreated: function (msg) {
                processCreatedData(msg);
            },

            newDataReceived: function (msg, rawMsg) {
                processReceivedData(msg, rawMsg);
            },

            updateOnlineUserCount: function (count){
                updateCounter(count);
            }

        };

    }

    return {

        // Get the Singleton instance if one exists
        // or create one if it doesn't
        getInstance: function () {

            if (!instance) {
                instance = init();
            }

            return instance;
        }

    };

})();
 
