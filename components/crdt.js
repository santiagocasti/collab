var CRDT = (function () {


    function newCounter(initialCounterValues) {

        var count = initialCounterValues;

        return {

            /**
             * Increment the counter for the corresponding replica
             * @param replicaId
             */
            increment: function (replicaId) {
                if (!count[replicaId]) {
                    count[replicaId] = 0;
                }

                count[replicaId] = count[replicaId] + 1;
            },

            /**
             * Returns the total count
             * @returns {number} total count
             */
            getCount: function () {
                var total = 0;

                for (var key in count) {
                    total += count[key];
                }

                return total;
            },

            /**
             * Returns the count tracked for a given replica ID. False if not tracking it.
             * @param repId
             * @returns {*}
             */
            getCountByReplicaId: function (repId) {
                if (count[repId]){
                    return count[repId];
                }

                return false;
            },

            /**
             * Checks if the current counter keeps track of the count of the given replica ID
             * @param repId
             * @returns {boolean}
             */
            tracks: function (repId){
                if (count[repId]){
                    return true;
                }

                return false;
            },

            /**
             * Returns an array of the replica IDs that it is currently tracking
             * @returns {Array}
             */
            getReplicaIds: function(){
                var repIds = [];
                for (var key in count){
                    repIds.push(key);
                }
                return repIds;
            },

            /**
             * Is the current counter bigger than the one given?
             * @param otherCounter
             * @returns {boolean}
             */
            isBigger: function (otherCounter) {

                /**
                 * How to handle cases of undefined?
                 */

                for (var key in count) {
                    if (otherCounter.getCountByReplicaId(key) > count[key]) {
                        return false;
                    }
                }

                return true;
            },

            /**
             * Is the current counter equal to the one passed in?
             * @param otherCounter
             * @returns {boolean}
             */
            isEqual: function (otherCounter) {

                /**
                 * How to handle cases of undefined?
                 */

                for (var key in count) {
                    if (otherCounter.getCountByReplicaId(key) !== count[key]) {
                        return false;
                    }
                }

                return true;
            },

            /**
             * Merge two counters and return the result
             * @param otherCounter
             * @returns {*}
             */
            merge: function (otherCounter) {

                var finalCount = {};
                var keysFound = 0;

                for (var key in count) {

                    // if the other counter has this key
                    if (otherCounter.tracks(key)) {
                        ++keysFound;
                        // compare them
                        if (otherCounter.getCountByReplicaId(key) > count[key]) {
                            //set the other
                            finalCount[key] = otherCounter.getCountByReplicaId(key);
                        } else {
                            //set the current
                            finalCount[key] = count[key];
                        }
                    } else {
                        // set the count of the current counter
                        finalCount[key] = count[key];
                    }
                }

//                // if the two counters have the same replicas
//                if (keysFound === count.length &&
//                        keysFound === otherCounter.count.length) {
//                    return CRDT.newCounter(finalCount);
//                }

                var replicaIds = otherCounter.getReplicaIds();
                // loop through the keys of the other counter
                replicaIds.forEach(function(key) {
                    if (!finalCount[key]) {
                        // if the key is not set in the final count, set it
                        finalCount[key] = otherCounter.getCountByReplicaId(key);
                    }
                });

                return CRDT.newCounter(finalCount);
            },

            /**
             * Return the current counter in JSON format
             * @returns {*}
             */
            toJSON: function () {
                return JSON.stringify(count);
            }
        }
    }

    return {

        /**
         * Create a new counter with the initialCounterValues
         * @param initialCounterValues
         * @returns {*}
         */
        newCounter: function (initialCounterValues) {
            return newCounter(initialCounterValues);
        }

    }


})();



