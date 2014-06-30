var Context = (function () {

    var instance;

    const NEW_PEER_EVENT = 'new-peer-event';

    function init() {

        var replicaIdentity;
        var peers = {};
        var callbacks = {};
        callbacks[NEW_PEER_EVENT] = [];

        var wasDirectReplicationPerformed = false;


        function purgePeersSet(){

            // build a map of id to timestamp
            var idMap = {};
            var pi;
            for (var id in peers){

                pi = peers[id];
                if (typeof idMap[pi.getReplicaIdentityString()] == 'undefined'){
                    idMap[pi.getId()] = [];
                }

                idMap[pi.getId()].push(pi.getTimestamp());
            }

            var finalMap = {};
            var ri;
            for (var id in idMap){

                if (idMap[id].length > 0){
                    idMap[id].sort();
                    idMap[id].reverse();
                }

                ri = ReplicaIdentity.new(id, idMap[id][0]);
                pi = peers[ri.toString()];
                finalMap[pi.getReplicaIdentityString()] = pi;
            }

            peers = finalMap;



        }

        function triggerCallbacksFor(event){
            if (callbacks[NEW_PEER_EVENT].length > 0){
                var callback;
                callbacks[NEW_PEER_EVENT].forEach(function(val){
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

            setDirectReplicationFlag: function(value){
                if (value === true || value === false){
                    wasDirectReplicationPerformed = value;
                }
            },

            getDirectReplicationFlag: function(){
                return wasDirectReplicationPerformed;
            },

            addPeer: function (peer) {
                peers[peer.getReplicaIdentityString()] = peer;
                purgePeersSet();
                triggerCallbacksFor(NEW_PEER_EVENT);
            },

            addCallbackForEvent: function(event, callback){
                callbacks[NEW_PEER_EVENT].push(callback);
            },

            getPeer: function (replicaIdentity) {
                if (typeof peers[replicaIdentity] !== "undefined"){
                    return peers[replicaIdentity];
                }

                return false;
            },

            getAllPeers: function(){
                var result = [];
                for (var key in peers){
                    result.push(peers[key]);
                }
                return result;
            },

            printPeerList: function (){
                log("There are "+Object.keys(peers).length+" peers.");
                for (var key in peers){
                    log("["+key+"] IP:"+ peers[key].getIpAddress());
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
