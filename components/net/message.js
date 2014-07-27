/**
 * Message class
 */
var Message = (function () {

    const MESSAGE_IN = 501;
    const MESSAGE_OUT = 502;

    const TREE_OVERLAY_PAYLOAD = 705;
    const NEWS_CAST_PAYLOAD = 704;
    const CAUSAL_PAYLOAD = 703;

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

        CreateFromRawData: function (type, rawMessage, payloadType) {
            var payload = MessageEncoder.ab2str(rawMessage);

            switch(payloadType){
                case TREE_OVERLAY_PAYLOAD:
                    return init(type, TreeOverlayMessagePayload.reconstruct(JSON.parse(payload)));
                    break;
                case NEWS_CAST_PAYLOAD:
                    return init(type, NewsCastMessagePayload.reconstruct(JSON.parse(payload)));
                    break;
                case CAUSAL_PAYLOAD:
                    return init(type, CausalBroadcastMessagePayload.reconstruct(JSON.parse(payload)));
                    break;
                default:
                    return init(type, MessagePayload.reconstruct(JSON.parse(payload)));
            }
        },

        Create: function (type, payload) {
            return init(type, payload);
        },

        Types: {
            IN: MESSAGE_IN,
            OUT: MESSAGE_OUT
        },

        PayloadTypes: {
            TREE_OVERLAY: TREE_OVERLAY_PAYLOAD,
            NEWS_CAST: NEWS_CAST_PAYLOAD,
            CAUSAL: CAUSAL_PAYLOAD
        }

    }
})();