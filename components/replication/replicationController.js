if (typeof module != 'undefined' && typeof require == 'function') {
    var ApplicationController = require('../applicationController.js');
    var Message = require('../net/message.js');
    var CRDT = require('../crdt/factory.js');
    var Counter = require('../crdt/pncounter.js');
    var MVRegister = require('../crdt/multiValueRegister.js');
    var ServerConstants = require('../serverSide/serverConstants.js');
}

/**
 * ReplicationController class
 * This class is in charge of handling replication of the data created in the current app,
 * as well as integrating changes received through replication from other apps in LAN.
 */
var ReplicationController = (function () {


    function buildDirectReplicationResponsePayload(allCounters, allRegisters) {
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
    }


    return {

        /**
         * Process a CRDT received through replication.
         * @param data
         * @constructor
         */
        NewCRDTsReceived: function (data) {

            if (!(data instanceof Array)) {
                data = [data];
            }

            var counters = [];
            var registers = [];

            data.forEach(function (crdt) {

                if (crdt instanceof Counter) {
                    counters.push(crdt);
                } else if (crdt instanceof MVRegister) {
                    registers.push(crdt);
                } else {
                    log("ERROR: Received CRDT of unrecognized type", crdt);
                }
            });

            log("Counters:", counters);
            log("Registers:", registers);

            var dataStore = DataStore.getInstance();
            dataStore.saveCounters(counters);
            dataStore.saveRegisters(registers);
        },

        /**
         * Replicate a CRDT.
         * @param crdt
         * @constructor
         */
        Replicate: function (crdt) {

            if (!(crdt instanceof Counter) && !(crdt instanceof MVRegister)) {
                log("ERROR: Counter or MVRegister object required.");
                return;
            }

            var com = Communication.getInstance();

            var peerRepProtocol = com.getPeerReplicationProtocol();
            peerRepProtocol.replicate(crdt);

            var serverRepProtocol = com.getServerReplicationProtocol();
            serverRepProtocol.request(crdt);
        },

        /**
         * Share the PeerIdentity of the current peer through multicast IPv4.
         * @constructor
         */
        SharePeerIdentity: function () {
            var comm = Communication.getInstance();
            var peerDiscoveryProt = comm.getPeerDiscoveryProtocol();
            peerDiscoveryProt.shareIdentity();
        },

        /**
         * Start recovery replication by requesting a central repository
         * or a peer in LAN the information they hold.
         * @constructor
         */
        StartRecoveryReplication: function () {
            var c = Context.getInstance();
            var comm = Communication.getInstance();
            // if we haven't done direct replication yet
            if (c.getDirectReplicationFlag() === false) {
                log("We haven't done direct replication, starting it.");

                var onFailureCallback = function () {
                    var peers = c.getAllPeers();

                    if (peers.length > 0) {
                        log("Sending direct replication request to peer:", peers[0]);
                        var i = getRandomInt(0, peers.length - 1);
                        var drProtocol = comm.getPeerRecoveryProtocol();
                        drProtocol.request(peers[i]);
                        c.setDirectReplicationFlag(true);
                    } else {
                        // if there are no peers to whom the application could send a
                        // direct replication request, then set a callback for when
                        // a peer appears and repeat the procedure then
                        var callback_a4GMHVoaATHu = function () {
                            ReplicationController.StartRecoveryReplication();
                        };

                        // when a new peer is added, this callback will be called
                        c.clearCallbacksForNewPeerEvent();
                        c.addCallbackForNewPeerEvent(callback_a4GMHVoaATHu);
                    }
                };

                var servRecoveryProtocol = comm.getServerRecoveryProtocol();
                servRecoveryProtocol.request(onFailureCallback);
            }
        },

        /**
         * Sends to the given peer a request for all the data it has in terms
         * of CRDTs.
         * @param peerIdentity
         * @constructor
         */
        SendDirectReplicationRequest: function (peerIdentity) {
            log("Sending data replication request.");

            var comm = Communication.getInstance();
            var drProtocol = comm.getPeerRecoveryProtocol();
            drProtocol.request(peerIdentity);
        },

        /**
         * Prepare the response for a direct replication request.
         * @param allCounters
         * @param allRegisters
         * @returns {*}
         * @constructor
         */
        BuildDirectReplicationResponseData: function (allCounters, allRegisters) {
            return buildDirectReplicationResponsePayload(allCounters, allRegisters);
        },

        /**
         * Initiate replication.
         * @constructor
         */
        Init: function (){
            ReplicationController.SharePeerIdentity();
            ReplicationController.StartRecoveryReplication();
        }
    };
})();


if (typeof module != 'undefined') {
    module.exports = ReplicationController;
}