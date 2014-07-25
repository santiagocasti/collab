if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
}

function PeerDiscoveryProtocol(port) {
    CommunicationProtocol.call(this, port);

    const IDENTITY_PAYLOAD = 103;
    const MULTICAST_IP = "237.132.123.123";

    this.payloadTypes = {
        IDENTITY: IDENTITY_PAYLOAD
    }

    this.ip = MULTICAST_IP;

    this.name = "PeerDiscoveryProtocol";
}

PeerDiscoveryProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Handle a new incoming message.
 * @param rawMsg
 * @param socketId
 */
PeerDiscoveryProtocol.prototype.handleMessage = function (rawMsg, socketId) {

    // Create a generic raw message object
    var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg.data);

    // Get the payload
    var payload = repMsg.getPayload();

    if (payload.getType() != this.payloadTypes.IDENTITY) {
        return;
    }

    // notify the replication controller that a new identity was received
    var content = payload.getContent();
    var ri = ReplicaIdentity.newFromString(content);
    var c = Context.getInstance();

    if (c.getPeer(ri.toString()) === false) {
        log("We are not tracking this peer, so we should share our identity.");

        // save the identity received in the context
        c.addPeer(new PeerIdentity(rawMsg.remoteAddress, ri));

        // share own identity
        this.shareIdentity(c.getReplicaIdentity());

    } else {
        log("Not returning peer identity because we are tracking [" + ri.toString() + "]");
    }

}

PeerDiscoveryProtocol.prototype.shareIdentity = function (ri) {

    if (typeof ri == 'undefined') {
        var c = Context.getInstance();
        ri = c.getReplicaIdentity();
    }

    var payload = MessagePayload.new(
            this.payloadTypes.IDENTITY,
            1,
            ri.toString()
    );

    var msg = Message.Create(Message.Types.OUT, payload);

    log("Sharing identity as:", msg);

    var identityShared_VNDW8mEr1SXu = (function () {
        debug("Identity shared: ", payload.toJSON());
    });

    var n = Network.getInstance();
    n.sendMulticastMessage(this.ip, this.port, msg, identityShared_VNDW8mEr1SXu);
}

if (typeof module != 'undefined') {
    module.exports = CausalBroadcastProtocol;
}