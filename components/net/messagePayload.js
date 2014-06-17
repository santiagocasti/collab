/**
 * MessagePayload class
 */
var MessagePayload = (function () {

    function init(t, oId, c) {
        var type = t;
        var objectId = oId;
        var content = c;

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

            toJSON: function () {
                var obj = {};
                obj.type = type;
                obj.objectId = objectId;
                obj.content = content;
                return JSON.stringify(obj);
            }
        }
    }

    function reconstructFromObject(obj) {

        var type, objectId, content;
        if (obj.type) {
            type = obj.type;
        }
        if (obj.objectId) {
            objectId = obj.objectId;
        }
        if (obj.content) {
            content = obj.content;
        }

        return init(type, objectId, content);
    }

    return {
        new: function (type, objectId, content) {
            return init(type, objectId, content);
        },
        reconstruct: function (jsonString) {
            return reconstructFromObject(jsonString);
        }
    }

})();