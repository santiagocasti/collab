if (typeof module != 'undefined' && typeof require == 'function'){
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
}

/**
 * Vector Clock Class constructor
 * @param data
 * @constructor
 */
function VectorClock(data) {

    this.private = {};
    this.private.vector = {};

    for (var index in data) {
        this.private.vector[index] = data[index];
    }

}

/**
 * Increment the vector on the id given.
 * @param id
 */
VectorClock.prototype.increment = function (id) {

    if (!this.private.vector.hasOwnProperty(id)) {
        this.private.vector[id] = 0;
    }

    this.private.vector[id] += 1;
};

/**
 * Get count for the id given.
 * @param id
 * @returns {*}
 */
VectorClock.prototype.getCount = function (id) {
    if (this.private.vector.hasOwnProperty(id)) {
        return this.private.vector[id];
    }

    return false;
};

/**
 * Get total count of the vector.
 * @returns {number}
 */
VectorClock.prototype.getTotalCount = function () {
    var result = 0;
    for (var key in this.private.vector) {
        result += this.private.vector[key];
    }

    return result;
};

/**
 * Compare to vector clocks.
 * @param vc
 * @returns {number}
 */
VectorClock.prototype.compare = function (vc) {

    var bigger = 0, equal = 0, smaller = 0;

    for (var index in this.private.vector) {

        if (!vc.tracks(index)) {
            bigger++;
            continue;
        }

        if (this.private.vector[index] > vc.getCount(index)) {
            bigger++;
        } else if (this.private.vector[index] === vc.getCount(index)) {
            equal++;
        } else {
            smaller++;
        }
    }

    var otherKeys = vc.getKeys();

    otherKeys.forEach(function (element) {
        if (!this.tracks(element)) {
            smaller++;
        }
    }, this);

    if ((bigger > 0 && smaller > 0) ||
            (bigger == 0 && smaller == 0)) {
        // the this.private.vectors are simultaneous
        return 0;
    } else if (bigger > 0) {
        // current this.private.vector is bigger
        return 1;
    } else {
        // current this.private.vector is smaller
        return -1;
    }
};

/**
 * Get the keys of the vector clock.
 * @returns {Array}
 */
VectorClock.prototype.getKeys = function () {
    return Object.keys(this.private.vector);
};

/**
 * Get the internal vector clock representation.
 * @returns {{}|*}
 */
VectorClock.prototype.getInternalVector = function () {
    return this.private.vector;
}

/**
 * Return string representation of the vector clock.
 * @returns {*}
 */
VectorClock.prototype.toString = function (){
    var allKeys = [];
    for (var key in this.private.vector){
        var s = key + ":" + this.private.vector[key];
        allKeys.push(s);
    }
    allKeys.sort();
    return JSON.stringify(allKeys);
}

/**
 * Merge the vector clock with the one given and return it in a new object.
 * @param otherVectorClock
 * @returns {VectorClock}
 */
VectorClock.prototype.merge = function (otherVectorClock) {

    var finalCount = {};

    for (var key in this.private.vector) {

        // if the other counter has this key
        // and the count is bigger than the one in the current this.private.vector
        if (otherVectorClock.tracks(key) &&
                otherVectorClock.getCount(key) > this.private.vector[key]) {
            //set the other
            finalCount[key] = otherVectorClock.getCount(key);
        } else {
            // set the count of the current counter
            finalCount[key] = this.private.vector[key];
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

    return new VectorClock(finalCount);
};

/**
 * Is the current vector clock tracking the id given?
 * @param repId
 * @returns {boolean}
 */
VectorClock.prototype.tracks = function (repId) {
    return this.private.vector.hasOwnProperty(repId);
};

/**
 * Force the local counter to track the id given.
 * Basically, assign it to 0.
 * @param repId
 */
VectorClock.prototype.forceTracking = function (repId) {
    this.private.vector[repId] = 0;
};

/**
 * This function is in charge of cleaning the counter arrays.
 * It will look for replica Ids that correspond to the same
 * replica but where produced in different timestamps.
 * It will only conserve the counts of the last timestamp and
 * delete the ones on the previous timestamps.
 */
VectorClock.prototype.purge = function () {

    /**
     * This method assumes that the keys are a string representation
     * of the replica identity. Therefore, the first part identifies
     * uniquely the replica, and the second part identifies the startup
     * time as a timestamp.
     *
     * When we have several values in the this.private.vector for the same replica
     * and we are using to identify online users only the latest is useful
     * and the others can be discarded
     */

    var repIds = Object.keys(this.private.vector);
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
        newVector[val] = this.private.vector[val];
    }, this);

    this.private.vector = newVector;
};

/**
 * @returns {*}
 */
VectorClock.prototype.toJSON = function () {
    return JSON.stringify(this.private.vector);
};

VectorClock.prototype.print = function () {
    log("==============================");
    for (var key in this.private.vector) {
        log("[" + key + "] => [" + this.private.vector[key] + "])");
    }
    log("==============================");
}

/**
 * Return a clone of the VectorClock object.
 * @returns {VectorClock}
 */
VectorClock.prototype.clone = function () {
    var data = {};
    for (var key in this.private.vector) {
        data[key] = this.private.vector[key];
    }
    return new VectorClock(data);
}

if (typeof module != 'undefined') {
    module.exports = VectorClock;
}