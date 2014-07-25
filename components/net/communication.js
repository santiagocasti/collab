var Communication = (function () {

    var instance;

    function init(){

        var peerDiscoveryProtocol;

        var peerReplicationProtocol;
        var peerRecoveryProtocol;

        var serverReplicationProtocol;
        var serverRecoveryProtocol;


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
            },

            getServerRecoveryProtocol: function (){
                return serverRecoveryProtocol;
            },

            setServerRecoveryProtocol: function (protocol){
                serverRecoveryProtocol = protocol;
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