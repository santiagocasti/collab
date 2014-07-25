function CommunicationProtocol(port) {
    this.private = {};
    this.name = "CommunicationProtocol";
    this.port = port;
}

CommunicationProtocol.prototype.handleMessage = function (rawMsg, socketId) {
    console.log("ERROR: Method handleMessage(rawMsg, socketId) is not defined.");
};

CommunicationProtocol.prototype.getName = function () {
    return this.name;
};


if (typeof module != 'undefined') {
    module.exports = CommunicationProtocol;
}

