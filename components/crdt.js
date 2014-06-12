var CRDT = (function () {

    function newCounter(id, initialIncrementValues, initialDecrementValues) {

        var id = id;
        var incrementCount = initialIncrementValues;
        var decrementCount = initialDecrementValues;

        /**
         * Merge the counter array of the current counter with the one of otherCounter.
         * The increment flag indicates if the counters to merge are the increment or decrement.
         * @param otherCounter Counter
         * @param increment boolean
         * @returns {{}}
         */
        function getMergedCounters(otherCounter, increment) {

            var finalCount = {};
            var otherValue;

            function getCounterValue(key, increment){
                if (increment === true){
                    return otherCounter.getIncrementCountByReplicaId(key);
                }else{
                    return otherCounter.getDecrementCountByReplicaId(key);
                }
            }

            var countMap;
            if (increment === true){
                countMap = incrementCount;
            }else{
                countMap = decrementCount;
            }

            for (var key in countMap) {

                // if the other counter has this key
                if (otherCounter.tracks(key)) {
                    otherValue = getCounterValue(key, increment);
                    // compare them
                    if (otherValue > incrementCount[key]) {
                        //set the other
                        finalCount[key] = otherValue;
                    } else {
                        //set the current
                        finalCount[key] = countMap[key];
                    }
                } else {
                    // set the count of the current counter
                    finalCount[key] = countMap[key];
                }
            }

            var replicaIds = otherCounter.getReplicaIds();
            // loop through the keys of the other counter
            replicaIds.forEach(function (key) {
                if (!finalCount[key]) {
                    // if the key is not set in the final count, set it

                    finalCount[key] = getCounterValue(key, increment);
                }
            });

            return finalCount;
        }


        return {

            /**
             * Increment the counter for the corresponding replica
             * @param replicaId
             */
            increment: function (replicaId) {
                if (!incrementCount[replicaId]) {
                    incrementCount[replicaId] = 0;
                }

                if (!decrementCount[replicaId]) {
                    decrementCount[replicaId] = 0;
                }

                incrementCount[replicaId] = incrementCount[replicaId] + 1;
            },

            /**
             * Decrement the counter for the corresponding replica
             * @param replicaId
             */
            decrement: function (replicaId) {
                if (!decrementCount[replicaId]) {
                    decrementCount[replicaId] = 0;
                }

                if (!incrementCount[replicaId]) {
                    incrementCount[replicaId] = 0;
                }

                decrementCount[replicaId] = decrementCount[replicaId] + 1;
            },

            /**
             * Returns the total count
             * @returns {number} total count
             */
            getCount: function () {
                var total = 0;

                for (var key in incrementCount) {
                    total += incrementCount[key] - decrementCount[key];
                }

                return total;
            },

            /**
             * Returns the decrement count tracked for a given replicaID. False if not tracking it.
             * @param repId
             * @returns {*}
             */
            getDecrementCountByReplicaId: function (repId) {
                if (decrementCount[repId]) {
                    var val = decrementCount[repId];
                    if (val < 0) {
                        return 0;
                    } else {
                        return val;
                    }
                }

                return false;
            },

            /**
             * Returns the increment count tracked for a given replica ID. False if not tracking it.
             * @param repId
             * @returns {*}
             */
            getIncrementCountByReplicaId: function (repId) {
                if (incrementCount[repId]) {
                    var val = incrementCount[repId];
                    if (val < 0) {
                        return 0;
                    } else {
                        return val;
                    }
                }

                return false;
            },

            /**
             * Checks if the current counter keeps track of the count of the given replica ID
             * @param repId
             * @returns {boolean}
             */
            tracks: function (repId) {
                if (incrementCount[repId]) {
                    return true;
                }

                return false;
            },

            /**
             * Returns an array of the replica IDs that it is currently tracking
             * @returns {Array}
             */
            getReplicaIds: function () {
                var repIds = [];
                for (var key in incrementCount) {
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
                    if (otherCounter.getCountByReplicaId(key) > (incrementCount[key] - decrementCount[key])) {
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
                    if (otherCounter.getCountByReplicaId(key) !== (incrementCount[key] - decrementCount[key])) {
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

                if (!otherCounter) {
                    return this;
                }

                var incrementMergeCounter = getMergedCounters(otherCounter, true);
                var decrementMergeCounter = getMergedCounters(otherCounter, false);


                // sync the counter keys
                for (var key in incrementMergeCounter){
                    if (!decrementMergeCounter[key]){
                        decrementMergeCounter[key] = 0;
                    }
                }

                for (var key in decrementMergeCounter){
                    if (!incrementMergeCounter[key]){
                        incrementMergeCounter[key] = 0;
                    }
                }

                return CRDT.newCounter(1, incrementMergeCounter, decrementMergeCounter);
            },

            /**
             * Return the current counter in JSON format
             * @returns {*}
             */
            toJSON: function () {
                var bag = {};
                bag['increment'] = incrementCount;
                bag['decrement'] = decrementCount;
                return JSON.stringify(bag);
            },

            /**
             * Returns the ID of the current counter
             * @returns {*}
             */
            getId: function () {
                return id;
            }
        }
    }

    return {

        /**
         * Create a new counter with the initialCounterValues
         * @param id
         * @param initialCounterValues
         * @returns {*}
         */
        newCounter: function (id, initialIncrement, initialDecrement) {
            if (!initialIncrement) initialIncrement = {};
            if (!initialDecrement) initialDecrement = {};
            return newCounter(id, initialIncrement, initialDecrement);
        },

        newCounterFromJSON: function (id, jsonBag) {

            var increment = {};
            if (jsonBag['increment']) {
                increment = jsonBag['increment'];
            }

            var decrement = {};
            if (jsonBag['decrement']) {
                decrement = jsonBag['decrement'];
            }

            return CRDT.newCounter(id, increment, decrement);
        }

    }


})();



