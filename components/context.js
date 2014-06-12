var Context = (function () {

    var instance;

    function init() {

        var replicaIdentity;
        var timestamp;

        return {
            setReplicaIdentity: function (id) {
                replicaIdentity = id;
                timestamp = new Date().getTime();
            },

            getHashedReplicaId: function () {
                return replicaIdentity.hashCode() + "." + timestamp.toString();
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
