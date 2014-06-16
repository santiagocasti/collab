var PeerIdentity = (function (){

    function init(ip, ri){

        var ipAddress = ip;
        var replicaIdentity = ri;

        return {
            getId: function(){
                return replicaIdentity.getId();
            },

            getTimestamp: function (){
                return replicaIdentity.getTimestamp();
            },

            getReplicaIdentityString: function () {
                return ri.toString();
            },

            getIpAddress: function (){
                return ipAddress;
            }
        }
    }

    return{
        new: function (ip, ri){
            return init(ip, ri);
        }
    }

})();