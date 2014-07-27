if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
}

function CausalBroadcastProtocol(port) {
    CommunicationProtocol.call(this, port);

    const COUNTER_PAYLOAD = 101;
    const REGISTER_PAYLOAD = 102;
    const IDENTITY_PAYLOAD = 103;
    const MULTICAST_IP = "237.132.123.123";

    this.payloadTypes = {
        COUNTER: COUNTER_PAYLOAD,
        REGISTER: REGISTER_PAYLOAD,
        IDENTITY: IDENTITY_PAYLOAD
    }

    this.ip = MULTICAST_IP;

    this.name = "CausalBroadcastProtocol";
}

CausalBroadcastProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Handle a new incoming message.
 * @param rawMsg
 * @param socketId
 */
CausalBroadcastProtocol.prototype.handleMessage = function (rawMsg, socketId) {
    debug("Replication Controller handle message: ", rawMsg);

    // Create a generic raw message object
    var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg.data, Message.PayloadTypes.CAUSAL);
    debug("Replication message received:", repMsg);

    // Get the payload
    var payload = repMsg.getPayload();

    log_delivered(payload.getHash());

    // Depending on the type of the payload we know what kind of message is it
    switch (payload.getType()) {
        case this.payloadTypes.COUNTER:
            var counter = CRDT.newCounterFromJSON(payload.getObjectId(), JSON.parse(payload.getContent()));
            ReplicationController.NewCRDTsReceived([counter]);
            break;
        case this.payloadTypes.REGISTER:
            var register = CRDT.newRegisterFromJSON(payload.getObjectId(), JSON.parse(payload.getContent()));
            ReplicationController.NewCRDTsReceived([register]);
            break;
        default:
    }
}

CausalBroadcastProtocol.prototype.replicate = function (o) {

    if (!(o instanceof Counter) &&
        !(o instanceof MVRegister)) {
        log("Error: Counter or MVRegister object required.", o);
        return;
    }

    var type;
    if (o instanceof Counter){
        type = this.payloadTypes.COUNTER;
    }else{
        type = this.payloadTypes.REGISTER;
    }

    var n = Network.getInstance();

    var payload = CausalBroadcastMessagePayload.new(
            type,
            o.getId(),
            o.toJSON(),
            createUniqueHash(n.getVPNIp())
    );

    var msg = Message.Create(Message.Types.OUT, payload);

    var callback_rEZpZbnVT8nA = function (){
        log("Object with ID["+ o.getId()+"] replicated.");
        log_created(payload.getHash());
    };

    var n = Network.getInstance();
    n.sendMulticastMessage(this.ip, this.port, msg, callback_rEZpZbnVT8nA);
}

if (typeof module != 'undefined') {
    module.exports = CausalBroadcastProtocol;
}