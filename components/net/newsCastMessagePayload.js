/**
 * MessagePayload class
 */
var NewsCastMessagePayload = (function () {

    function init(t, ts, c, ip) {
        var type = t;
        var timestamp = ts;
        var content = c;
        var ip = ip;

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
                obj.ts = timestamp;
                obj.ip = ip;
                obj.content = content;
                return JSON.stringify(obj);
            }
        }
    }

    function reconstructFromObject(obj) {

        if (typeof obj == 'string'){
            obj = JSON.parse(obj);
        }

        var type, timestamp, content, ipAddress;
        if (obj.type) {
            type = obj.type;
        }
        if (obj.ts) {
            timestamp = obj.ts;
        }
        if (obj.content) {
            content = obj.content;
        }
        if (obj.ip){
            ipAddress = obj.ip;
        }

        return init(type, timestamp, content, ipAddress);
    }

    return {
        new: function (type, timestamp, content, ipAddress) {
            return init(type, timestamp, content, ipAddress);
        },
        reconstruct: function (jsonString) {
            return reconstructFromObject(jsonString);
        }
    }

})();