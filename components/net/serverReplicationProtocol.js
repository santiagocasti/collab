if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var Counter = require('../crdt/pncounter.js');
    var MVRegister = require('../crdt/multiValueRegister.js');
    var ServerConstants = require('../serverSide/serverConstants.js');
}

/**
 * Server Replication Protocol
 * @constructor
 */
function ServerReplicationProtocol() {

    const DIRECT_REQUEST = 201;
    const DIRECT_RESPONSE = 202;

    CommunicationProtocol.call(this, ServerConstants.Port);
    this.ip = ServerConstants.IP;

    this.payloadTypes = {
        REQUEST: DIRECT_REQUEST,
        RESPONSE: DIRECT_RESPONSE
    };

    this.name = "serverReplicationProtocol";
}

ServerReplicationProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Method for replicating a given CRDT to the server.
 * @param crdt
 */
ServerReplicationProtocol.prototype.request = function (crdt) {

    if (!(crdt instanceof Counter) && !(crdt instanceof MVRegister)) {
        log("crdt provided is not a proper object", crdt);
        return;
    } else {
        var crdtName;
        if (crdt instanceof Counter) {
            crdtName = 'counter';
        } else {
            crdtName = 'register';
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://" + this.ip + ":" + this.port + "/" + crdtName + "/" + crdt.getId(), true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            log("Replicated " + crdtName + "[" + crdt.getId() + "] to the server");
        } else {
            log("Something failed and the request to replicate " + crdtName + "[" + crdt.getId() + "] " +
                    "could not be performed  status[" + xhr.status + "] readystate[" + xhr.readyState + "]");
        }
    };
    xhr.send(crdt.toJSON());
};

if (typeof module != 'undefined') {
    module.exports = ServerReplicationProtocol;
}