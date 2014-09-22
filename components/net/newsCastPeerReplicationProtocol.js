if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
    var CRDT = require('../crdt/factory.js');
}

/**
 * NewsCastPeerReplicationProtocol Class
 * This class represents the gossip-based NewsCast peer replication protocol.
 * It is composed of a NewsCastCache for tracking the items to exchange
 * during the gossip.
 * @param port
 * @constructor
 */
function NewsCastPeerReplicationProtocol(port) {
    CommunicationProtocol.call(this, port);

    const CACHE_SIZE = 60;
    const PERIOD_MILISECONDS = 1500;

    const REQUEST = 401;
    const RESPONSE = 402;


    var n = Network.getInstance();
    this.ip = n.getVPNIp();
    this.socketIp = "0.0.0.0";


    this.payloadTypes = {
        REQUEST: REQUEST,
        RESPONSE: RESPONSE
    };

    this.cache = new NewsCastCache(CACHE_SIZE, this.ip);

    this.name = "NewsCastPeerReplicationProtocol";

    /**
     * Function in charge of sending periodic requests to a randomly chosen peer.
     */
    var intervalFunction = function () {

		debug("Executing NewsCast Protocol...");

        var c = Context.getInstance();
        var allPeers = c.getAllPeers();
        if (allPeers.length <= 0) {
          	log("Can't execute NewsCast Protocol because there are no peers.");
            return;
        }

        if (typeof this.socketId == 'undefined') {
            log("Can't execute NewsCast Protocol because the socket has not been created yet.");
            return;
        }


        // select the peer to exchange cache with
        var peer = allPeers[getRandomInt(0, allPeers.length - 1)];

        this.sendMessage(peer.getIpAddress(), this.payloadTypes.REQUEST);

    }.bind(this);

    // interval the cache exchange to 1 minute
    this.interval = setInterval(intervalFunction, PERIOD_MILISECONDS);


}

NewsCastPeerReplicationProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

/**
 * Set the socket to be used during gossip.
 * @param socketId
 */
NewsCastPeerReplicationProtocol.prototype.setSocketId = function (socketId) {
    this.socketId = socketId;
};

/**
 * Send a 'type' message to 'peerIP' and call 'callback' on success.
 * @param peerIp
 * @param type
 * @param callback
 */
NewsCastPeerReplicationProtocol.prototype.sendMessage = function (peerIp, type, callback) {
    // create the payload
    var payload = NewsCastMessagePayload.new(
            type,
            new Date().getTime(),
            this.cache.items,
            this.ip
    );

    var msg = Message.Create(Message.Types.OUT, payload);

    var callback_rEZpZbnVT8nA = function () {

        if (typeof callback != 'undefined') {
            callback();
        }
    };

    var n = Network.getInstance();
    n.sendUDPMessage(this.socketId, peerIp, this.port, msg, callback_rEZpZbnVT8nA);
};

/**
 * Process the data received from another peer.
 * @param data
 * @param deltaT
 */
NewsCastPeerReplicationProtocol.prototype.processData = function (data, deltaT) {

    var crdt, crdts = [], validItems = [];
    var content = data.getContent();

    content.forEach(function (item) {

        if (item.type == this.cache.COUNTER_TYPE) {
            crdt = CRDT.newCounterFromJSON(0, item.data);
        } else if (item.type == this.cache.REGISTER_TYPE) {
            crdt = CRDT.newRegisterFromJSON(0, item.data);
        } else {
            return;
        }

        if (typeof item.hash != 'undefined' &&
            !this.cache.everDelivered(item.hash.toString())) {
            log_delivered(item.hash);

            item.crdt = crdt;
            validItems.push(item);

            if (crdt instanceof Counter || crdt instanceof MVRegister) {
                crdts.push(crdt);
            }
        }

    }.bind(this));

    // add the new items and truncate the size of the cache
    this.cache.mergeItems(validItems, deltaT);

    ReplicationController.NewCRDTsReceived(crdts);
};

/**
 * Handle a new incoming message.
 * @param rawMsg
 */
NewsCastPeerReplicationProtocol.prototype.handleMessage = function (rawMsg) {

    var tsOnReceive = new Date().getTime();

    // Create a generic raw message object
    var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg.data, Message.PayloadTypes.NEWS_CAST);

    // Get the payload
    var payload = repMsg.getPayload();

    // Depending on the type of the payload we know what kind of message is it
    switch (payload.getType()) {
        case this.payloadTypes.REQUEST:
            var callback_123jk1hlsj1 = function () {
                // difference in time in between the clocks of the current peer
                // and the one that sent the data
                var deltaT = parseInt(payload.getTimestamp()) - tsOnReceive;
                this.processData(payload, deltaT);
            }.bind(this);

            this.sendMessage(rawMsg.remoteAddress, this.payloadTypes.RESPONSE, callback_123jk1hlsj1);

            break;
        case this.payloadTypes.RESPONSE:
            // difference in time in between the clocks of the current peer
            // and the one that sent the data
            var deltaT = parseInt(payload.getTimestamp()) - tsOnReceive;
            this.processData(payload, deltaT);
            break;
        default:
    }
};

/**
 * Replicate the given object to the peers in LAN.
 * @param o
 */
NewsCastPeerReplicationProtocol.prototype.replicate = function (o) {

    if (!(o instanceof Counter || o instanceof MVRegister)) {
        log("Error: Counter or MVRegister object required.", o);
        return;
    }

    this.cache.addItems([o]);
};

if (typeof module != 'undefined') {
    module.exports = NewsCastPeerReplicationProtocol;
}