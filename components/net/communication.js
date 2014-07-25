var Communication = (function () {

    var instance;

    function init(){

        var peerDiscoveryProtocol;
        var peerReplicationProtocol;
        var serverReplicationProtocol;
        var peerRecoveryProtocol;

        return {
            getPeerReplicationProtocol: function (){
                return peerReplicationProtocol;
            },

            setPeerReplicationProtocol: function (protocol){
                peerReplicationProtocol = protocol;
            },

            getServerReplicationProtocol: function (){
                return serverReplicationProtocol;
            },

            setServerReplicationProtocol: function (protocol){
                serverReplicationProtocol = protocol;
            },

            getPeerRecoveryProtocol: function (){
                return peerRecoveryProtocol;
            },

            setPeerRecoveryProtocol: function (protocol){
                peerRecoveryProtocol = protocol;
            },

            getPeerDiscoveryProtocol: function (){
                return peerDiscoveryProtocol;
            },

            setPeerDiscoveryProtocol: function (protocol){
                peerDiscoveryProtocol = protocol;
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