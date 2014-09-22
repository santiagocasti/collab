if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var ApplicationController = require('../applicationController.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ServerConstants = require('../serverSide/serverConstants.js');
    var CRDT = require('../crdt/factory.js');
    var Counter = require('../crdt/pncounter.js');
    var MVRegister = require('../crdt/multiValueRegister.js');
}

/**
 * Peer Recovery Protocol Prototype
 * @param port
 * @constructor
 */
function PeerRecoveryProtocol(port) {

    const DIRECT_REQUEST = 201;
    const DIRECT_RESPONSE = 202;

    CommunicationProtocol.call(this, port);

    this.payloadTypes = {
        REQUEST: DIRECT_REQUEST,
        RESPONSE: DIRECT_RESPONSE
    };

    this.name = "PeerRecoveryProtocol";
}

PeerRecoveryProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Given a set of counters and registers, builds a response payload.
 * @param allCounters
 * @param allRegisters
 * @returns {{}}
 */
PeerRecoveryProtocol.prototype.buildResponsePayload = function (allCounters, allRegisters) {
    var data = {};

    data.counters = [];
    for (var index in allCounters) {
        data.counters.push(allCounters[index].toJSON());
    }

    data.registers = [];
    for (index in allRegisters) {
        data.registers.push(allRegisters[index].toJSON());
    }

    return data;
};

/**
 * Handles a request through the given socket ID, and replies through the same socket.
 * @param message
 * @param socketId
 */
PeerRecoveryProtocol.prototype.handleRequest = function (message, socketId) {
    log("Handling a direct replication request.");
    var dataStore = DataStore.getInstance();

    var data = this.buildResponsePayload(
            dataStore.getCounters(),
            dataStore.getRegisters()
    );

    var payload = MessagePayload.new(
            this.payloadTypes.RESPONSE,
            0,
            data
    );

    var msg = Message.Create(Message.Types.OUT, payload);

    n.sendMessageThroughExistingSocket(socketId, msg);
};

/**
 * Processes a response to this protocol and
 * notifies the replication controller of the new data available.
 * @param msg
 */
PeerRecoveryProtocol.prototype.handleResponse = function (msg) {
    var payload = msg.getPayload();

    var data = payload.getContent();

    var validCRDTs = [];

    log("Received the following data in a DirectReplication RESPONSE:", data);

    if (typeof data.counters !== "undefined") {
        data.counters.forEach(function (counter) {
            //                log("Iterating over counters: "+counter, counter);
            var c = CRDT.newCounterFromJSON(0, counter);
            if (c instanceof Counter){
                validCRDTs.push(c);
            }
        });
    }

    if (typeof data.registers !== 'undefined') {
        data.registers.forEach(function (register) {
            var r = CRDT.newRegisterFromJSON(0, register);
            if (r instanceof MVRegister) {
                validCRDTs.push(r);
            }
        });
    }

    ReplicationController.NewCRDTsReceived(validCRDTs);
};

/**
 * Handle a new incoming message. Depending on the type of message,
 * delegates to other methods for specific processing.
 * @param rawMsg
 * @param socketId
 */
PeerRecoveryProtocol.prototype.handleMessage = function (rawMsg, socketId) {

    log("Received: "+rawMsg, rawMsg);

    var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg);

    var payload = repMsg.getPayload();

    switch (payload.getType()) {
        case this.payloadTypes.REQUEST:
            log("Received direct replication REQUEST.");
            this.handleRequest(repMsg, socketId);
            break;
        case this.payloadTypes.RESPONSE:
            // handle the response
            this.handleResponse(repMsg);
            // release the socket
            var n = Network.getInstance();
            n.releaseSocket(socketId, n.TCP_TYPE);
            break;
        default:
            log("Received a message of a type that cannot be handled type [" + payload.getType() + "].", payload.toJSON());
    }
};

/**
 * Sends a recovery request to the peer provided.
 * @param peerIdentity
 */
PeerRecoveryProtocol.prototype.request = function (peerIdentity) {
    log("Sending data replication request.");

    var n = Network.getInstance();

    var payload = MessagePayload.new(
            this.payloadTypes.REQUEST,
            0,
            "" + new Date().getTime()
    );

    var msg = Message.Create(Message.Types.OUT, payload);

    n.sendMessageThroughNewSocket(peerIdentity.getIpAddress(), this.port, msg);
};

if (typeof module != 'undefined') {
    module.exports = PeerRecoveryProtocol;
}