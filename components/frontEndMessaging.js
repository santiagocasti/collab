var FrontEndMessaging = (function () {

    var instance;
    var NEW_DATA_EVENT = 1;

    function init() {

        var callbacks = [];
        callbacks[NEW_DATA_EVENT] = [];

        function isValidEvent(event) {
            if (event != NEW_DATA_EVENT) {
                return false;
            }

            return true;
        }

        function sendMessage(message, onResponse) {
            var msg = MessagePassing.PrepareMessage(message);
            chrome.runtime.sendMessage(msg, onResponse);
        }

        function processMessage(message, sender) {
            switch (message.type) {
                case MessagePassing.MessageTypes.NEW_DATA_AVAILABLE:
                    debug("Received a message notifying about new data available.");
                    debug("Message: ", message);
                    debug("Sender: ", sender);
                    callbacks[NEW_DATA_EVENT].forEach(function (callback) {
                        callback(message);
                    });
                    break;
                case MessagePassing.MessageTypes.REPLICATION_NOTIFICATION:
                    debug("Received a new replication notification message.");
                    callbacks[NEW_DATA_EVENT].forEach(function (callback) {
                        callback(message);
                    });
                    break;
                default:
                    log("Received a message of an unrecognizable type.");
            }
        }

        return {

            handleMessage: function (rawMessage, sender, sendResponse) {

                debug("FrontEndMessaging handleMessage");

                var message = MessagePassing.ParseMessage(rawMessage);

                /** @var message MessagePassing */
                switch (message.to) {
                    case MessagePassing.Destinations.FRONT:
                        debug("[FrontEndMessaging] Received a message for FRONT: ", message);
                        processMessage(message, sender);
                        break;
                    default:
                        log("[FrontEndMessaging] Received message that should not handle [" + message.type + "]");
                }

            },

            sendMessage: function (message, onResponse) {
                return sendMessage(message, onResponse);
            },

            addCallbackForEvent: function (event, callback) {
                if (!isValidEvent(event)) {
                    return false;
                }

                callbacks[event].push(callback);

                return true;
            }

        }
    }

    return {

        EventType: {
            NEW_DATA: NEW_DATA_EVENT
        },

        getInstance: function () {

            if (!instance) {
                instance = init();
            }

            return instance;
        }
    }
})();
