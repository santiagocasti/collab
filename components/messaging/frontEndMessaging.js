var FrontEndMessaging = (function () {

    var instance;
    var NEW_DATA_EVENT = 1;
    var UPDATED_USER_COUNT = 2;
    var NEW_CELL_VALUE = 3;

    function init() {

        var callbacks = [];
        callbacks[NEW_DATA_EVENT] = [];
        callbacks[UPDATED_USER_COUNT] = [];
        callbacks[NEW_CELL_VALUE] = [];

        function isValidEvent(event) {
            if (event != NEW_DATA_EVENT &&
                event != UPDATED_USER_COUNT &&
                event != NEW_CELL_VALUE) {
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
                case MessagePassing.MessageTypes.USER_COUNT_UPDATED:
                    debug("Received a message updating the user count");
                    callbacks[UPDATED_USER_COUNT].forEach(function (callback) {
                        callback(message);
                    });
                    break;
                case MessagePassing.MessageTypes.NEW_CELL_VALUE:
                    debug("Received a message for setting new cell value.");
                    callbacks[NEW_CELL_VALUE].forEach(function (callback) {
                        callback(message.content);
                    });
                    break;
                default:
                    log("Received a message of an unrecognizable type.");
            }
        }

        return {

            handleMessage: function (rawMessage, sender, sendResponse) {

                var message = MessagePassing.ParseMessage(rawMessage);

                /** @var message MessagePassing */
                switch (message.to) {
                    case MessagePassing.Destinations.FRONT:
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
            NEW_DATA: NEW_DATA_EVENT,
            UPDATED_USER_COUNT: UPDATED_USER_COUNT,
            NEW_CELL_VALUE: NEW_CELL_VALUE
        },

        getInstance: function () {

            if (!instance) {
                instance = init();
            }

            return instance;
        }
    }
})();
