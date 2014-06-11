var Context = (function () {

    var instance;

    function init() {

        var replicaIdentity;
        var onlineUsersCounter;

        return {
            setReplicaIdentity: function (id) {
                replicaIdentity = id;
            },

            getHashedReplicaId: function () {
                return replicaIdentity.hashCode();
            },

            setOnlineUsersCounter: function (counter) {
                onlineUsersCounter = counter;
            },

            getOnlineUsersCounter: function () {
                return onlineUsersCounter;
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
