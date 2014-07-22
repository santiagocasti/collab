var Context = (function () {

    var instance;

    const NEW_PEER_EVENT = 'new-peer-event';

    function init() {

        var replicaIdentity;
        var peers = {};
        var callbacks = {};
        callbacks[NEW_PEER_EVENT] = [];
        var runningTest = false;
        var test;
        var interval;

        var wasDirectReplicationPerformed = false;


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

        function triggerCallbacksFor(event) {
            if (callbacks[NEW_PEER_EVENT].length > 0) {
                var callback;
                callbacks[NEW_PEER_EVENT].forEach(function (val) {
                    val();
                });
            }
        }

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

                            } else {
                                log("No tests to run");
                            }

                        }
                    }
                    xhr.send();

                };

                interval = setInterval(intervalFunction, 1000);

            },

            getAllPeers: function () {
                var result = [];
                for (var key in peers) {
                    result.push(peers[key]);
                }
                return result;
            },

            printPeerList: function () {
                log("There are " + Object.keys(peers).length + " peers.");
                for (var key in peers) {
                    log("[" + key + "] IP:" + peers[key].getIpAddress());
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
