/**
 * Google Realtime API MessagePayload class
 */
var GoogleRealtimeApiMessagePayload = (function () {

    function init(t, oId, c, hash) {
        var type = t;
        var objectId = oId;
        var content = c;
        var hash = hash;

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

            getHash: function () {
                return hash;
            },

            toJSON: function () {
                var obj = {};
                obj.type = type;
                obj.objectId = objectId;
                obj.content = content;
                obj.hash = hash;
                return JSON.stringify(obj);
            }
        }
    }

    function reconstructFromObject(obj) {

        var type, objectId, content, hash;
        if (obj.type) {
            type = obj.type;
        }
        if (obj.objectId) {
            objectId = obj.objectId;
        }
        if (obj.content) {
            content = obj.content;
        }
        if (obj.hash) {
            hash = obj.hash;
        }

        return init(type, objectId, content, hash);
    }

    return {
        new: function (type, objectId, content, hash) {
            return init(type, objectId, content, hash);
        },
        reconstruct: function (jsonString) {
            return reconstructFromObject(jsonString);
        }
    }

})();