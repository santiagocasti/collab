var Context = (function () {

    var instance;

    function init() {

        var replicaIdentity;


        return {
            setReplicaIdentity: function (id) {
                replicaIdentity = id;
            },

            getHashedReplicadId: function () {
                return replicaIdentity.hashCode();
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
