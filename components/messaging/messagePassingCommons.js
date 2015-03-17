function MessagePrototype(from, to, type, content) {
    this.from = from;
    this.to = to;
    this.type = type;
    this.content = content;
}

/**
 * MessagePassing Class
 * This class is a backbone for the frontend
 * and backend message passing classes.
 */
var MessagePassing = (function () {

    const FRONTEND = "front-end";
    const BACKEND = "back-end";

    const NEW_DATA_AVAILABLE_MESSAGE_TYPE = 2;
    const REPLICATION_NOTIFICATION_MESSAGE_TYPE = 3;
    const USER_COUNT_UPDATED_MESSAGE_TYPE = 4;
    const CLOSING_WINDOW_MESSAGE_TYPE = 5;
    const OPENED_WINDOW_MESSAGE_TYPE = 6;
    const PRINT_PEER_LIST_MESSAGE_TYPE = 7;
    const DIRECT_REPLICATION_REQUEST_MESSAGE_TYPE = 8;
    const NEW_CELL_VALUE_MESSAGE_TYPE= 9;
    const START_TEST_MESSAGE_TYPE = 10;
    const SAVE_LOG_FILE = 11;

    return {

        Message: function (from, to, type, content) {
            return new MessagePrototype(from, to, type, content);
        },

        MessageToBack: function (type, content) {
            return new MessagePrototype(FRONTEND, BACKEND, type, content);
        },

        MessageToFront: function (type, content) {
            return new MessagePrototype(BACKEND, FRONTEND, type, content);
        },

        PrepareMessage: function (msg) {
            msg.content = JSON.stringify(msg.content);
            return msg;
        },

        ParseMessage: function (msg) {
            msg.content = JSON.parse(msg.content);
            return msg;
        },

        Destinations: {
            FRONT: FRONTEND,
            BACK: BACKEND
        },

        MessageTypes: {
            NEW_DATA_AVAILABLE: NEW_DATA_AVAILABLE_MESSAGE_TYPE,
            NEW_CELL_VALUE: NEW_CELL_VALUE_MESSAGE_TYPE,
            REPLICATION_NOTIFICATION: REPLICATION_NOTIFICATION_MESSAGE_TYPE,
            USER_COUNT_UPDATED: USER_COUNT_UPDATED_MESSAGE_TYPE,
            CLOSING_WINDOW: CLOSING_WINDOW_MESSAGE_TYPE,
            OPENED_WINDOW: OPENED_WINDOW_MESSAGE_TYPE,
            PRINT_PEER_LIST: PRINT_PEER_LIST_MESSAGE_TYPE,
            PERFORM_DIRECT_REPLICATION_REQUEST: DIRECT_REPLICATION_REQUEST_MESSAGE_TYPE,
            START_TEST: START_TEST_MESSAGE_TYPE,
            SAVE_LOG_FILE: SAVE_LOG_FILE
        }

    }

})();