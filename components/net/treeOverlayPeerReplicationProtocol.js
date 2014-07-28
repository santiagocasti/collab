if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
    var CRDT = require('../crdt/factory.js');
}

/**
 * TreeOverlay Peer Replication Protocol
 */
function TreeOverlayPeerReplicationProtocol(port) {
    CommunicationProtocol.call(this, port);

    const COUNTER = 601;
    const REGISTER = 602;

//    var n = Network.getInstance();
    this.ip = n.getVPNIp();
    this.socketIp = "0.0.0.0";


    this.payloadTypes = {
        COUNTER: COUNTER,
        REGISTER: REGISTER
    };

    this.name = "TreeOverlayPeerReplicationProtocol";
}

TreeOverlayPeerReplicationProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Simple function to set the socket id.
 * This is necessary because this protocol interacts only through a simple socket.
 * @param socketId
 */
TreeOverlayPeerReplicationProtocol.prototype.setSocketId = function (socketId) {
    this.socketId = socketId;
};

/**
 * Given the IP of the sender of the message, calculates the peers that need to be notified
 * following the Tree Overlay structure based on the complete list of peers.
 * @param senderIp
 * @returns {Array}
 */
TreeOverlayPeerReplicationProtocol.prototype.getPeerIps = function (senderIp) {

    var c = Context.getInstance();
    var allPeers = c.getAllPeers();
    var allIps = [];
    allPeers.forEach(function (peer) {
        if (peer.getIpAddress() != senderIp) {
            allIps.push(peer.getIpAddress());
        }
    });

    if (this.ip != senderIp){
        allIps.push(this.ip);
    }

    allIps.sort();

    allIps.unshift(senderIp);

    log("All IPs are:", allIps);

    var positionOfCurrentPeer = allIps.indexOf(this.ip);
    var indexPeerA = positionOfCurrentPeer * 2 + 1;
    var indexPeerB = positionOfCurrentPeer * 2 + 2;
    var ips = [];

    if (typeof allIps[indexPeerA] != 'undefined') {
        ips.push(allIps[indexPeerA]);
    }

    if (typeof allIps[indexPeerB] != 'undefined') {
        ips.push(allIps[indexPeerB]);
    }

    log("CurrentIndex[" + positionOfCurrentPeer + "] indexPeerA[" + indexPeerA + "] indexPeerB[" + indexPeerB + "]");

    return ips;
};

/**
 * Sends a message with the object o, marked as coming from senderIp.
 * @param senderIp
 * @param o
 */
TreeOverlayPeerReplicationProtocol.prototype.sendMessage = function (senderIp, o) {

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

    var n = Network.getInstance();
    var hash = createUniqueHash(n.getVPNIp());
    log_created(hash);

    var payload = TreeOverlayMessagePayload.new(
            type,
            o.getId(),
            o.toJSON(),
            senderIp,
            hash
    );

    var msg = Message.Create(Message.Types.OUT, payload);

    var callback_rEZpZbnVT8nA = function () {
        log("Object with ID[" + o.getId() + "] replicated.");
    };

    var n = Network.getInstance();
    //socketId, ip, port, msg, callback
    var peerIps = this.getPeerIps(senderIp);
    peerIps.forEach(function (peerIp) {
        if (peerIp != senderIp) {
            n.sendUDPMessage(this.socketId, peerIp, this.port, msg, callback_rEZpZbnVT8nA);
        }
    }.bind(this));


};

TreeOverlayPeerReplicationProtocol.prototype.forwardMessage = function (payload) {

    var msg = Message.Create(Message.Types.OUT, payload);

    var callback_rEZpZbnVT8nA = function () {
        log("Object with ID[" + payload.getObjectId() + "] replicated.");
    };

    var senderIp = payload.getSenderIp();

    var n = Network.getInstance();
    //socketId, ip, port, msg, callback
    var peerIps = this.getPeerIps(senderIp);
    peerIps.forEach(function (peerIp) {
        if (peerIp != senderIp) {
            n.sendUDPMessage(this.socketId, peerIp, this.port, msg, callback_rEZpZbnVT8nA);
        }
    }.bind(this));
};

/**
 * Handle a new incoming message.
 * @param rawMsg
 */
TreeOverlayPeerReplicationProtocol.prototype.handleMessage = function (rawMsg) {
    debug("Replication Controller handle message: ", rawMsg);

    // Create a generic raw message object
    var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg.data, Message.PayloadTypes.TREE_OVERLAY);
    debug("Replication message received:", repMsg);

    // Get the payload
    var payload = repMsg.getPayload();

    log_delivered(payload.getHash());

    // Depending on the type of the payload we know what kind of message is it
    switch (payload.getType()) {
        case this.payloadTypes.COUNTER:
            var counter = CRDT.newCounterFromJSON(payload.getObjectId(), JSON.parse(payload.getContent()));
            ReplicationController.NewCRDTsReceived([counter]);
            // continue to replicate the crdt to further peers
            this.forwardMessage(payload);
            break;
        case this.payloadTypes.REGISTER:
            var register = CRDT.newRegisterFromJSON(payload.getObjectId(), JSON.parse(payload.getContent()));
            log("Payload: ", payload);
            this.forwardMessage(payload);
            // continue to replicate the crdt to further peers
            ReplicationController.NewCRDTsReceived([register]);
            break;
        default:
    }
};

/**
 * Simple function to trigger the crdt replication.
 * @param o
 */
TreeOverlayPeerReplicationProtocol.prototype.replicate = function (o) {

    if (!(o instanceof Counter) && !(o instanceof MVRegister)) {
        log("Error: Counter or MVRegister object required.", o);
        return;
    }

    this.sendMessage(this.ip, o);
};

if (typeof module != 'undefined') {
    module.exports = CausalBroadcastProtocol;
}