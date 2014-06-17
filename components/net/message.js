/**
 * Message class
 */
var Message = (function () {

    const MESSAGE_IN = 501;
    const MESSAGE_OUT = 502;

    function init(t, p) {

        var type = t;
        var payload = p;

        return {
            getPreparedContent: function () {
                var strPayload = payload.toJSON();
                return MessageEncoder.str2ab(strPayload);
            },

            getType: function () {
                return type;
            },

            getPayload: function () {
                return payload;
            },

            log: function () {
                log("type: " + type);
                log("payload: " + payload.toJSON(), payload);
            }
        }
    }

    return{

        CreateFromRawData: function (type, rawMessage) {
            var payload = MessageEncoder.ab2str(rawMessage);
            return init(type, MessagePayload.reconstruct(JSON.parse(payload)));
        },

        Create: function (type, payload) {
            return init(type, payload);
        },

        Types: {
            IN: MESSAGE_IN,
            OUT: MESSAGE_OUT
        }

    }
})();