/**
 * Message Encoder class
 * Performs transformations between string and ArrayBuffer
 */
var MessageEncoder = (function () {

    return {
        ab2str: function (buf) {
            return String.fromCharCode.apply(null, new Uint16Array(buf));
        },

        str2ab: function (str) {
            var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
            var bufView = new Uint16Array(buf);
            for (var i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        }
    };

})();