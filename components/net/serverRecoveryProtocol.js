if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var CRDT = require('../crdt/factory.js');
    var Counter = require('../crdt/pncounter.js');
    var MVRegister = require('../crdt/multiValueRegister.js');
    var ReplicationController = require('../replication/replicationController.js');
    var ServerConstants = require('../serverSide/serverConstants.js');
}

/**
 * Server Revocery Protocol Prototype
 * @constructor
 */
function ServerRecoveryProtocol() {

    const DIRECT_REQUEST = 201;
    const DIRECT_RESPONSE = 202;

    CommunicationProtocol.call(this, ServerConstants.Port);
    this.ip = ServerConstants.IP;

    this.payloadTypes = {
        REQUEST: DIRECT_REQUEST,
        RESPONSE: DIRECT_RESPONSE
    };


    this.name = "PeerRecoveryProtocol";
}

/**
 * Prototype based on the Communication Protocol prototype
 * @type {CommunicationProtocol.prototype}
 */
ServerRecoveryProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Imports data from a protocol response to the data store.
 * @param data
 */
ServerRecoveryProtocol.prototype.importData = function(data) {

    var dataStore = DataStore.getInstance();

    if (typeof data.counters !== "undefined") {
        var receivedCounters = [];

        data.counters.forEach(function (counter) {
            //                log("Iterating over counters: "+counter, counter);
            var c = CRDT.newCounterFromJSON(0, counter);
            if (c instanceof Counter) {
                //                    log("Received a new user counter that should be handled. Total count: "+c.getCount());
                // merge this counter with our online user counter
                receivedCounters.push(c);
            }
        });

        dataStore.saveCounters(receivedCounters);
    }

    if (typeof data.registers !== 'undefined') {
        var regObj, receivedCells = [];
        data.registers.forEach(function (register) {
            regObj = CRDT.newRegisterFromJSON(0, register);
            if (regObj instanceof MVRegister) {
                receivedCells.push(regObj);
            }
        });

        dataStore.saveRegisters(receivedCells);
    }
};

/**
 * Sends a recovery request to the server.
 * @param onFailureCallback
 */
ServerRecoveryProtocol.prototype.request = function (onFailureCallback) {

    log("Sending request to "+this.ip+":"+this.port);

    // build a HTTP GET request
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://" + this.ip + ":" + this.port + "/basedata", true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // JSON.parse does not evaluate the attacker's scripts.
            log("We got the following: ", xhr.responseText);
            var data = JSON.parse(xhr.responseText);

            log("Got response from server for basedata: ", data);

            this.importData(data);

            var c = Context.getInstance();
            c.setDirectReplicationFlag(true);

        } else {
            log("Something failed and the request could not be performed" +
                    " status[" + xhr.status + "] readystate[" + xhr.readyState + "]");
            onFailureCallback();
        }
    }.bind(this);
    xhr.send();
};

if (typeof module != 'undefined') {
    module.exports = ServerRecoveryProtocol;
}