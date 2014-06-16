var Context = (function () {

    var instance;

    function init() {

        var replicaIdentity;
        var peers = {};


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

        return {
            setReplicaIdentity: function (identity) {
                replicaIdentity = identity;
            },

            getReplicaIdentity: function () {
                return replicaIdentity;
            },

            addPeer: function (peer) {
                peers[peer.getReplicaIdentityString()] = peer;
                purgePeersSet();
            },

            getPeer: function (replicaIdentity) {
                if (typeof peers[replicaIdentity] !== 'undefined'){
                    return peers[replicaIdentity];
                }

                return false;
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
        }

    };
})();
