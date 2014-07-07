var VectorClock = (function () {

    function init(data) {

        var vector = {};

        for (var index in data) {
            vector[index] = data[index];
        }

        return {

            increment: function (id) {
                if (!vector.hasOwnProperty(id)) {
                    vector[id] = 0;
                }

                vector[id] += 1;
            },

            getCount: function (id) {
                if (vector.hasOwnProperty(id)) {
                    return vector[id];
                }

                return false;
            },

            getTotalCount: function () {
                var result = 0;
                for (var key in vector){
                    result += vector[key];
                }

                return result;
            },

            compare: function (vc) {

                var bigger = 0, equal = 0, smaller = 0;

                for (var index in vector) {
                    if (vc.getCount(index) != false &&
                            vector[index] > vc.getCount(index)) {
                        bigger++;
                    } else if (vc.getCount(index) != false &&
                            vector[index] === vc.getCount(index)) {
                        equal++;
                    } else {
                        smaller++;
                    }
                }

                if (bigger > 0 && smaller > 0) {
                    // the vectors are simultaneous
                    return 0;
                } else if (bigger > 0) {
                    // current vector is bigger
                    return 1;
                } else {
                    // current vector is smaller
                    return -1;
                }
            },

            getKeys: function () {
                return Object.keys(vector);
            },

            merge: function (otherVectorClock) {

                var finalCount = {};

                for (var key in vector) {

                    // if the other counter has this key
                    // and the count is bigger than the one in the current vector
                    if (otherVectorClock.tracks(key) &&
                            otherVectorClock.getCount(key) > vector[key]) {
                        //set the other
                        finalCount[key] = otherVectorClock.getCount(key);
                    } else {
                        // set the count of the current counter
                        finalCount[key] = vector[key];
                    }
                }

                var keys = otherVectorClock.getKeys();

                // loop through the keys of the other counter
                keys.forEach(function (key) {
                    if (!finalCount.hasOwnProperty(key)) {
                        // if the key is not set in the final count, set it
                        finalCount[key] = otherVectorClock.getCount(key);
                    }
                });

                return VectorClock.new(finalCount);
            },

            tracks: function (repId) {
                return vector.hasOwnProperty(repId);
            },

            purge: function () {

                /**
                 * This method assumes that the keys are a string representation
                 * of the replica identity. Therefore, the first part identifies
                 * uniquely the replica, and the second part identifies the startup
                 * time as a timestamp.
                 *
                 * When we have several values in the vector for the same replica
                 * and we are using to identify online users only the latest is useful
                 * and the others can be discarded
                 */

                var repIds = Object.keys(vector);
                var idMap = {};
                var repIdObj;

                // build a map of replica ids pointing at a bag of timestamps
                repIds.forEach(function (val) {
                    repIdObj = ReplicaIdentity.newFromString(val);
                    if (!idMap.hasOwnProperty(repIdObj.getId())) {
                        idMap[repIdObj.getId()] = [];
                    }

                    idMap[repIdObj.getId()].push(repIdObj.getTimestamp());
                });

                var newRepId;
                var finalIds = [];

                for (var id in idMap) {

                    // if for a given id we have more than one timestamp
                    if (idMap[id].length > 1) {
                        // use the most recent and discard the others
                        idMap[id].sort();
                        idMap[id].reverse();
                    }

                    // create the new identity from the biggest of the timestamps
                    newRepId = ReplicaIdentity.new(id, idMap[id][0]);
                    // push it into the array of final identities
                    finalIds.push(newRepId.toString());
                }

                var newVector = {};
                // copy only the final identity values to the new counter array
                finalIds.forEach(function (val) {
                    newVector[val] = vector[val];
                });

                vector = newVector;
            },

            toJSON: function (){
                return JSON.stringify(vector);
            }
        }
    }


    return {
        new: function (data) {
            return init(data);
        }
    }

})();