if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var ServerConstants = require('../serverSide/serverConstants.js');
}

/**
 * Time server protocol
 * @constructor
 */
function TimeServerProtocol() {

    CommunicationProtocol.call(this, ServerConstants.Port);
    this.ip = ServerConstants.IP;

    this.name = "timeServerProtocol";
}

TimeServerProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Method for requesting the time from the server
 * @param callback callback
 */
TimeServerProtocol.prototype.request = function (callback) {

    var xhr = new XMLHttpRequest();
    var sentAt = new Date().getTime();
    xhr.open("GET", "http://" + this.ip + ":" + this.port + "/time" , true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr.responseText, sentAt);
        }
    };
    xhr.send();
};

if (typeof module != 'undefined') {
    module.exports = TimeServerProtocol;
}