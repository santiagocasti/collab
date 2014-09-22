/**
 * FronendMessaging class
 */
var FrontEndMessaging = (function () {

    var instance;
    var NEW_DATA_EVENT = 1;
    var UPDATED_USER_COUNT = 2;
    var NEW_CELL_VALUE = 3;
    var START_TEST = 4;


    function init() {

        var callbacks = [];
        callbacks[NEW_DATA_EVENT] = [];
        callbacks[UPDATED_USER_COUNT] = [];
        callbacks[NEW_CELL_VALUE] = [];
        callbacks[START_TEST] = [];

        function isValidEvent(event) {
            if (event != NEW_DATA_EVENT &&
                event != UPDATED_USER_COUNT &&
                event != NEW_CELL_VALUE &&
                event != START_TEST) {
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
                case MessagePassing.MessageTypes.START_TEST:
                    debug("Received a message for starting a new test");
                    callbacks[START_TEST].forEach(function (callback) {
                        callback(message.content);
                    });
                    break;
                default:
                    log("Received a message of an unrecognizable type.");
            }
        }

        return {

            /**
             * Handle an incoming message.
             * @param rawMessage
             * @param sender
             * @param sendResponse
             */
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

            /**
             * Send a new message.
             * @param message
             * @param onResponse
             * @returns {*}
             */
            sendMessage: function (message, onResponse) {
                return sendMessage(message, onResponse);
            },

            /**
             * Add a callback that will be executed when certain event occurs.
             * @param event
             * @param callback
             * @returns {boolean}
             */
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

        /**
         * External classes can subscribe callbacks for these events
         * to get notified when they occur.
         */
        EventType: {
            NEW_DATA: NEW_DATA_EVENT,
            UPDATED_USER_COUNT: UPDATED_USER_COUNT,
            NEW_CELL_VALUE: NEW_CELL_VALUE,
            START_TEST: START_TEST
        },

        getInstance: function () {

            if (!instance) {
                instance = init();
            }

            return instance;
        }
    }
})();
