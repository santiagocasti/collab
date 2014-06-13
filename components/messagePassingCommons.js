function MessagePrototype(from, to, type, content) {
    this.from = from;
    this.to = to;
    this.type = type;
    this.content = content;
}

var MessagePassing = (function () {

    const FRONTEND = "front-end";
    const BACKEND = "back-end";

    const NEW_DATA_CREATED_MESSAGE_TYPE = 1;
    const NEW_DATA_AVAILABLE_MESSAGE_TYPE = 2;
    const REPLICATION_NOTIFICATION_MESSAGE_TYPE = 3;
    const USER_COUNT_UPDATED_MESSAGE_TYPE = 4;
    const CLOSING_WINDOW_MESSAGE_TYPE = 5;
    const OPENED_WINDOW_MESSAGE_TYPE = 6;

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
            NEW_DATA_CREATED: NEW_DATA_CREATED_MESSAGE_TYPE,
            NEW_DATA_AVAILABLE: NEW_DATA_AVAILABLE_MESSAGE_TYPE,
            REPLICATION_NOTIFICATION: REPLICATION_NOTIFICATION_MESSAGE_TYPE,
            USER_COUNT_UPDATED: USER_COUNT_UPDATED_MESSAGE_TYPE,
            CLOSING_WINDOW: CLOSING_WINDOW_MESSAGE_TYPE,
            OPENED_WINDOW: OPENED_WINDOW_MESSAGE_TYPE
        }

    }

})();