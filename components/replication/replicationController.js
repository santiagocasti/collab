var ReplicationController = (function () {


    function buildDirectReplicationResponsePayload(allCounters, allRegisters) {
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

    function importRegistersAndCounters(data) {

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
    }

    function attemptDirectReplicationToServer(onFailureCallback) {

        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://" + ServerConstants.IP + ":" + ServerConstants.Port + "/basedata", true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // JSON.parse does not evaluate the attacker's scripts.
                log("We got the following: ", xhr.responseText);
                var data = JSON.parse(xhr.responseText);

                importRegistersAndCounters(data);


                var c = Context.getInstance();
                c.setDirectReplicationFlag(true);


            } else {
                log("Something failed and the request could not be performed" +
                        " status[" + xhr.status + "] readystate[" + xhr.readyState + "]");
                onFailureCallback();
            }
        }
        xhr.send();

    }

    function replicateCrdtToServer(crdt) {

        if (!(crdt instanceof Counter) && !(crdt instanceof MVRegister)) {
            log("crdt provided is not a proper object", crdt);
            return;
        } else {
            var crdtName;
            if (crdt instanceof Counter) {
                crdtName = 'counter';
            } else {
                crdtName = 'register';
            }
        }

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://" + ServerConstants.IP + ":" + ServerConstants.Port + "/" + crdtName + "/" + crdt.getId(), true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                log("Replicated " + crdtName + "[" + crdt.getId() + "] to the server");
            } else {
                log("Something failed and the request to replicate " + crdtName + "[" + crdt.getId() + "] " +
                        "could not be performed  status[" + xhr.status + "] readystate[" + xhr.readyState + "]");
            }
        }
        xhr.send(crdt.toJSON());

    }

    return {

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

        Replicate: function (crdt) {

            if (!(crdt instanceof Counter) && !(crdt instanceof MVRegister)) {
                log("ERROR: Counter or MVRegister object required.");
                return;
            }

            var com = Communication.getInstance();

            var peerRepProtocol = com.getPeerReplicationProtocol();
//            log("peerRepProtocol:", peerRepProtocol);
            peerRepProtocol.replicate(crdt);

            // TODO: implement this protocol
//            var serverRepProtocol = com.getServerReplicationProtocol();
////            log("serverRepProtocol:", serverRepProtocol);
//            serverRepProtocol.replicate(crdt);

//            replicateCrdtToServer(counter);
        },

        SharePeerIdentity: function () {
            var comm = Communication.getInstance();
            var peerDiscoveryProt = comm.getPeerDiscoveryProtocol();
            peerDiscoveryProt.shareIdentity();
        },

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
                        }

                        // when a new peer is added, this callback will be called
                        c.clearCallbacksForNewPeerEvent();
                        c.addCallbackForNewPeerEvent(callback_a4GMHVoaATHu);
                    }
                };

                attemptDirectReplicationToServer(onFailureCallback);
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


        BuildDirectReplicationResponseData: function (allCounters, allRegisters) {
            return buildDirectReplicationResponsePayload(allCounters, allRegisters);
        },

        Init: function (){
            ReplicationController.SharePeerIdentity();
            ReplicationController.StartRecoveryReplication();
        }
    };
})();


if (typeof module != 'undefined') {
    module.exports = ReplicationController;
}