/**
 * MessagePayload class
 */
var TreeOverlayMessagePayload = (function () {

    function init(t, oId, c, ip, h) {
        var type = t;
        var objectId = oId;
        var content = c;
        var fromIp = ip;
        var hash = h;

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

            getHash: function () {
                return hash;
            },

            toJSON: function () {
                var obj = {};
                obj.type = type;
                obj.objectId = objectId;
                obj.content = content;
                obj.fromIp = fromIp;
                obj.hash = hash;
                return JSON.stringify(obj);
            }
        }
    }

    function reconstructFromObject(obj) {

        var type, objectId, content, fromIp, hash;
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
        if (obj.hash) {
            hash = obj.hash;
        }

        return init(type, objectId, content, fromIp, hash);
    }

    return {
        new: function (type, objectId, content, fromIp, hash) {
            return init(type, objectId, content, fromIp, hash);
        },
        reconstruct: function (jsonString) {
            return reconstructFromObject(jsonString);
        }
    }

})();