var Context = (function () {

    var instance;

    function init() {

        var replicaIdentity;

        return {
            setReplicaIdentity: function (identity) {
                replicaIdentity = identity;
            },

            getReplicaIdentity: function () {
                return replicaIdentity;
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
