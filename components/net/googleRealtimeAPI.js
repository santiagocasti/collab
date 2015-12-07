if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
    var CRDT = require('../crdt/factory.js');
    var Counter = require('../crdt/pncounter.js');
    var MVRegister = require('../crdt/multiValueRegister.js');
}

/**
 * GoogleRealtimeAPI Class
 * In charge of performing replication to the peers in LAN
 * using causal broadcast, based on IPv4 multicast.
 * @param model
 * @constructor
 */
function GoogleRealtimeAPI(model) {
    var port = 80;
    CommunicationProtocol.call(this, port);

    const COUNTER_PAYLOAD = 101;
    const REGISTER_PAYLOAD = 102;

    this.payloadTypes = {
        COUNTER: COUNTER_PAYLOAD,
        REGISTER: REGISTER_PAYLOAD
    };

    this.name = "GoogleRealtimeAPI";
    this.model = model;
}

GoogleRealtimeAPI.prototype = Object.create(CommunicationProtocol.prototype, {});

/**
 * Handle a new incoming message.
 * @param rawMsg
 */
GoogleRealtimeAPI.prototype.handleMessage = function (rawMsg) {
    debug("Replication Controller handle message: ", rawMsg);

    // Create a generic raw message object
    var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg.data, Message.PayloadTypes.REALTIME);
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
};

/**
 * Replicate the given object to the peers in LAN.
 * @param o
 */
GoogleRealtimeAPI.prototype.replicate = function (o) {

    if (!(o instanceof Counter) && !(o instanceof MVRegister)) {
        log("Error: Counter or MVRegister object required.", o);
        return;
    }

    var type;
    if (o instanceof Counter) {
        type = this.payloadTypes.COUNTER;
    } else {
        type = this.payloadTypes.REGISTER;
    }

    // get the js CRDT from the map
    var existing = this.model.getRoot().get(o.getId());

    // merge it with the one that we want to change
    if (existing instanceof Counter ||
            existing instanceof MVRegister) {
        o = o.merge(existing);
    }

    var payload = GoogleRealtimeApiMessagePayload.new(
            type,
            o.getId(),
            o.toJSON(),
            createUniqueHash(n.getVPNIp())
    );

    // replicate it to the realtime API
    this.model.set(o.getId(), payload.toJSON());
};

if (typeof module != 'undefined') {
    module.exports = GoogleRealtimeAPI;
}