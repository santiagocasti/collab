if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var ApplicationController = require('../applicationController.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ServerConstants = require('../serverSide/serverConstants.js');
}

function DirectReplicationProtocol(port) {

    const DIRECT_REQUEST = 201;
    const DIRECT_RESPONSE = 202;

//    const SERVER_IP = ServerConstants.IP;
//    const SERVER_PORT = ServerConstants.Port;

    CommunicationProtocol.call(this, port);

    this.payloadTypes = {
        REQUEST: DIRECT_REQUEST,
        RESPONSE: DIRECT_RESPONSE
    }

//    this.ip = SERVER_IP;

    this.name = "DirectReplicationProtocol";
}

DirectReplicationProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

DirectReplicationProtocol.prototype.buildResponsePayload = function (allCounters, allRegisters) {
    var data = {};

    data.counters = [];
    for (var index in allCounters) {
        data.counters.push(allCounters[index].toJSON());
    }

    data.registers = [];
    for (var index in allRegisters) {
        data.registers.push(allRegisters[index].toJSON());
    }

    return data;
}

DirectReplicationProtocol.prototype.handleRequest = function (message, socketId) {
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
}

DirectReplicationProtocol.prototype.handleResponse = function (msg, socketId) {
    var payload = msg.getPayload();

    var data = payload.getContent();

    var validCRDTs = [];

    log("Received the following data in a DirectReplication RESPONSE:", data);

    if (typeof data.counters !== "undefined") {
        data.counters.forEach(function (counter) {
            //                log("Iterating over counters: "+counter, counter);
            var c = CRDT.newCounterFromJSON(0, counter);
            validCRDTs.push(c);
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
}

/**
 * Handle a new incoming message.
 * @param rawMsg
 * @param socketId
 */
DirectReplicationProtocol.prototype.handleMessage = function (rawMsg, socketId) {

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
            this.handleResponse(repMsg, socketId);
            // release the socket
            var n = Network.getInstance();
            n.releaseSocket(socketId, n.TCP_TYPE);
            break;
        default:
            log("Received a message of a type that cannot be handled type [" + payload.getType() + "].", payload.toJSON());
    }
}

DirectReplicationProtocol.prototype.request = function (peerIdentity) {
    log("Sending data replication request.");

    var n = Network.getInstance();

    var payload = MessagePayload.new(
            this.payloadTypes.REQUEST,
            0,
            "" + new Date().getTime()
    );

    var msg = Message.Create(Message.Types.OUT, payload);

    n.sendMessageThroughNewSocket(peerIdentity.getIpAddress(), this.port, msg);
}

if (typeof module != 'undefined') {
    module.exports = CausalBroadcastProtocol;
}