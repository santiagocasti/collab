/**
 * MessagePayload class
 */
var TreeOverlayMessagePayload = (function () {

    function init(t, oId, c, ip) {
        var type = t;
        var objectId = oId;
        var content = c;
        var fromIp = ip;

        return {
            getType: function () {
                return type;
            },

            getObjectId: function () {
                return objectId;
            },

            getContent: function () {
                return content;
            },

            getSenderIp: function () {
                return fromIp;
            },

            toJSON: function () {
                var obj = {};
                obj.type = type;
                obj.objectId = objectId;
                obj.content = content;
                obj.fromIp = fromIp;
                return JSON.stringify(obj);
            }
        }
    }

    function reconstructFromObject(obj) {

        var type, objectId, content, fromIp;
        if (obj.type) {
            type = obj.type;
        }
        if (obj.objectId) {
            objectId = obj.objectId;
        }
        if (obj.content) {
            content = obj.content;
        }
        if (obj.fromIp) {
            fromIp = obj.fromIp;
        }

        return init(type, objectId, content, fromIp);
    }

    return {
        new: function (type, objectId, content, fromIp) {
            return init(type, objectId, content, fromIp);
        },
        reconstruct: function (jsonString) {
            return reconstructFromObject(jsonString);
        }
    }

})();