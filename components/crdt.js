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

        function getReplicaIds(){
            var repIds = [];
            for (var key in incrementCount) {
                repIds.push(key);
            }
            return repIds;
        }

        /**
         * This function is in charge of cleaning the counter arrays.
         * It will look for replica Ids that correspond to the same
         * replica but where produced in different timestamps.
         * It will only conserve the counts of the last timestamp and
         * delete the ones on the previous timestamps.
         */
        function purgeCounterValues(){

            var repIds = getReplicaIds();
            var idMap = {};
            var repIdObj;

            // build a map of replica ids pointing at a bag of timestamps
            repIds.forEach(function(val){
                repIdObj = ReplicaIdentity.newFromString(val);
                if (!idMap[repIdObj.getId()]){
                    idMap[repIdObj.getId()] = [];
                }

                idMap[repIdObj.getId()].push(repIdObj.getTimestamp());
            });

            var newRepId;
            var finalIds = [];

            for (var id in idMap){

                // if for a given id we have more than one timestamp
                if (idMap[id].length > 1){
                    // use the most recent and discard the others
                    idMap[id].sort();
                    idMap[id].reverse();
                }

                newRepId = ReplicaIdentity.new(id, idMap[id][0]);
                finalIds.push(newRepId.toString());
            }

            var newIncrement = {}, newDecrement = {};
            // copy the final Ids values only to the new counter arrays
            finalIds.forEach(function (val){
                newIncrement[val] = incrementCount[val];
                newDecrement[val] = decrementCount[val];
            });

            incrementCount = newIncrement;
            decrementCount = newDecrement;

        }

        function encodeToJSON(){
            var bag = {};
            bag['increment'] = incrementCount;
            bag['decrement'] = decrementCount;
            return JSON.stringify(bag);
        }


        return {

            /**
             * Increment the counter for the corresponding replica
             * @param replicaId
             * @return boolean
             */
            increment: function (replicaId) {

                if (!ReplicaIdentity.IsValidStringIdentity(replicaId)){
                    return false
                }

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
             * @return boolean
             */
            decrement: function (replicaId) {

                if (!ReplicaIdentity.IsValidStringIdentity(replicaId)){
                    return false
                }

                if (typeof decrementCount[replicaId] === 'undefined') {
                    decrementCount[replicaId] = 0;
                }

                if (typeof incrementCount[replicaId] === 'undefined') {
                    incrementCount[replicaId] = 0;
                }

                decrementCount[replicaId] = decrementCount[replicaId] + 1;

                return true;
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
                return typeof incrementCount[repId] !== 'undefined';
            },

            /**
             * Returns an array of the replica IDs that it is currently tracking
             * @returns {Array}
             */
            getReplicaIds: function () {
                return getReplicaIds();
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
                    log("Just passing one counter!");
                    return this;
                }

                if (id != otherCounter.getId()){
                    log("counterIds don't match!");
                    return false;
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

                incrementCount = incrementMergeCounter;
                decrementCount = decrementMergeCounter;

                purgeCounterValues();
            },

            /**
             * Return the current counter in JSON format
             * @returns {*}
             */
            toJSON: function () {
                return encodeToJSON();
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

            if (!initialIncrement){
                initialIncrement = {};
            }else{
                for (var key in initialIncrement){
                    if (!ReplicaIdentity.IsValidStringIdentity(key)){
                        return false;
                    }
                }
            }

            if (!initialDecrement){
                initialDecrement = {};
            }else{
                for (var key in initialDecrement){
                    if (!ReplicaIdentity.IsValidStringIdentity(key)){
                        return false;
                    }
                }
            }

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



