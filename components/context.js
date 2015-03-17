/**
 * Context class
 * In charge of holding peer environment knowledge, experiment execution and general application flags.
 */
var Context = (function () {

    var instance;

    const NEW_PEER_EVENT = 'new-peer-event';

    function init() {

        // identity of the local replica
        var replicaIdentity;

        // known peers in LAN
        var peers = {};

        // callbacks for events
        var callbacks = {};
        callbacks[NEW_PEER_EVENT] = [];

        // is the current app running a test?
        var runningTest = false;

        // which test is the current app running?
        var test;

        // what is the interval used for checking for tests?
        var interval;

        // log of created and delivered updates (for experiments)
        var deliveryLog = [];

        // self explanatory
        var wasDirectReplicationPerformed = false;


        /**
         * Remove identities of crashed peers from the list of known peers.
         * We know a peerIdentity belongs to a crashed peer, when we have
         * two identities with same id, but different timestamps.
         */
        function purgePeersSet() {

            // build a map of id to timestamp
            var idMap = {};
            var pi;
            for (var id in peers) {

                pi = peers[id];
                if (typeof idMap[pi.getReplicaIdentityString()] == 'undefined') {
                    idMap[pi.getId()] = [];
                }

                idMap[pi.getId()].push(pi.getTimestamp());
            }

            var finalMap = {};
            var ri;
            for (var id in idMap) {

                if (idMap[id].length > 0) {
                    idMap[id].sort();
                    idMap[id].reverse();
                }

                ri = ReplicaIdentity.new(id, idMap[id][0]);
                pi = peers[ri.toString()];
                finalMap[pi.getReplicaIdentityString()] = pi;
            }

            peers = finalMap;


        }

        /**
         * Trigger the callbacks attached to the given event.
         * @param event
         */
        function triggerCallbacksFor(event) {
            switch (event) {
                case NEW_PEER_EVENT:
                    if (callbacks[NEW_PEER_EVENT].length > 0) {
                        var callback;
                        callbacks[NEW_PEER_EVENT].forEach(function (val) {
                            val();
                        });
                    }
                    break;
                default:
                    error("Unknown event type", event);
            }
        }

        // list of public functions
        return {
            setReplicaIdentity: function (identity) {
                replicaIdentity = identity;
            },

            getReplicaIdentity: function () {
                return replicaIdentity;
            },

            setDirectReplicationFlag: function (value) {
                if (value === true || value === false) {
                    wasDirectReplicationPerformed = value;
                }
            },

            getDirectReplicationFlag: function () {
                return wasDirectReplicationPerformed;
            },

            addPeer: function (peer) {
                peers[peer.getReplicaIdentityString()] = peer;
                purgePeersSet();
                triggerCallbacksFor(NEW_PEER_EVENT);
            },

            clearPeerList: function () {
                peers = {};
            },

            addCallbackForNewPeerEvent: function (callback) {
                callbacks[NEW_PEER_EVENT].push(callback);
            },

            clearCallbacksForNewPeerEvent: function () {
                callbacks[NEW_PEER_EVENT] = [];
            },

            getPeer: function (replicaIdentity) {
                if (typeof peers[replicaIdentity] !== "undefined") {
                    return peers[replicaIdentity];
                }

                return false;
            },

            addRunningTest: function (t) {
                test = t;
                runningTest = true;
            },

            addMsg: function (msg) {
                deliveryLog.push(msg);
            },

            getDeliveryLog: function () {
                return deliveryLog;
            },

            /**
             * Check with the server if there is any experiment to run.
             * If the server replies there is an experiment,
             * communicate the frontend about it and start the execution.
             */
            startTestCheck: function () {

                var intervalFunction = function () {

                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", "http://" + ServerConstants.IP + ":" + ServerConstants.Port + "/test", true);
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            var obj = JSON.parse(xhr.responseText);
                            if (obj.hasOwnProperty("testId")) {
                                log("Got the following test to run.", obj);

                                var c = Context.getInstance();
                                c.addRunningTest(obj);

                                if (obj.testId == "MULTICAST") {
                                    msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.START_TEST, obj);
                                    BackEndMessaging.sendMessage(msg);
                                }

                                window.clearInterval(interval);

                                setTimeout(function(){
                                    console.downloadLogFile();
                                }, 600000);

                            } else {
                                log("No tests to run");
                            }

                        }
                    }
                    xhr.send();

                };

                interval = setInterval(intervalFunction, 500);

            },

            stopTestCheck: function () {
                window.clearInterval(interval);
            },

            getAllPeers: function () {
                var result = [];
                for (var key in peers) {
                    result.push(peers[key]);
                }
                return result;
            },

            printPeerList: function () {
                console.log("There are " + Object.keys(peers).length + " peers.");
                for (var key in peers) {
                    console.log("[" + key + "] IP:" + peers[key].getIpAddress());
                }
            }
        }
    }

    return {

        // Get the Singleton instance if one exists
        // or create one if it doesn't
        getInstance: function () {

            if (!instance) {
                instance = init();
            }

            return instance;
        },

        Event: {
            NEW_PEER: NEW_PEER_EVENT
        }

    };
})();
