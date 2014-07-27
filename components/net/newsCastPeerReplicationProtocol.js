if (typeof module != 'undefined' && typeof require == 'function') {
    var CommunicationProtocol = require('./communicationProtocol.js');
    var Message = require('./message.js');
    var ReplicationController = require('../crdt/replicationController.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
    var CRDT = require('../crdt/factory.js');
}

function NewsCastPeerReplicationProtocol(port) {
    CommunicationProtocol.call(this, port);

    const CACHE_SIZE = 256;
    const PERIOD_MILISECONDS = 10000;

    const REQUEST = 401;
    const RESPONSE = 402;


    this.numMessagesSent = 0;

//    var n = Network.getInstance();
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

        log("Executing NewsCast Protocol...");

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

        if (this.numMessagesSent == 10) {
            window.clearInterval(this.interval);
            return;
        }

        this.numMessagesSent++;

        // select the peer to exchange cache with
        var peer = allPeers[getRandomInt(0, allPeers.length - 1)];

        this.sendMessage(peer.getIpAddress(), this.payloadTypes.REQUEST);

    }.bind(this);

    // interval the cache exchange to 1 minute
    this.interval = setInterval(intervalFunction, PERIOD_MILISECONDS);


}

NewsCastPeerReplicationProtocol.prototype = Object.create(CommunicationProtocol.prototype, {

});

NewsCastPeerReplicationProtocol.prototype.setSocketId = function (socketId) {
    this.socketId = socketId;
};

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
        log("Sent message of type [" + type + "] to [" + peerIp + "].", payload);
        log("Callback is:", callback);
        if (typeof callback != 'undefined') {
            callback();
        }
    };

    var n = Network.getInstance();
    n.sendUDPMessage(this.socketId, peerIp, this.port, msg, callback_rEZpZbnVT8nA);
};


NewsCastPeerReplicationProtocol.prototype.processData = function (data) {

    log("We should process this data:", data);
    log("Content is: ", data.getContent());
    log("Type of Content is: "+(typeof data));
    var crdt, crdts = [];
    var content = data.getContent();
    content.forEach(function (item) {

        log("ITEM: ", item);

        if (item.type == this.cache.COUNTER_TYPE) {
            crdt = CRDT.newCounterFromJSON(0, item.data);
        } else if (item.type == this.cache.REGISTER_TYPE) {
            crdt = CRDT.newRegisterFromJSON(0, item.data);
        }else{
            crdt = '';
        }

        if (crdt instanceof Counter || crdt instanceof MVRegister){
            crdts.push(crdt);
        }
    }.bind(this));

    ReplicationController.NewCRDTsReceived(crdts);
};

/**
 * Handle a new incoming message.
 * @param rawMsg
 */
NewsCastPeerReplicationProtocol.prototype.handleMessage = function (rawMsg) {
    debug("Replication Controller handle message: ", rawMsg);

    // Create a generic raw message object
    var repMsg = Message.CreateFromRawData(Message.Types.IN, rawMsg.data);
    debug("Replication message received:", repMsg);

    // Get the payload
    var payload = repMsg.getPayload();

    // Depending on the type of the payload we know what kind of message is it
    switch (payload.getType()) {
        case this.payloadTypes.REQUEST:
            log("Received a REQUEST from " + rawMsg.remoteAddress, payload);

            var callback_123jk1hlsj1 = function () {
                this.processData(payload);
            }.bind(this);

            this.sendMessage(rawMsg.remoteAddress, this.payloadTypes.RESPONSE, callback_123jk1hlsj1);

            break;
        case this.payloadTypes.RESPONSE:
            log("Received a RESPONSE from " + rawMsg.remoteAddress, payload);
            this.processData(payload);
            break;
        default:
    }
};

NewsCastPeerReplicationProtocol.prototype.replicate = function (o) {

    if (!(o instanceof Counter) && !(o instanceof MVRegister)) {
        log("Error: Counter or MVRegister object required.", o);
        return;
    }

    this.cache.addItems([o]);
};

if (typeof module != 'undefined') {
    module.exports = CausalBroadcastProtocol;
}