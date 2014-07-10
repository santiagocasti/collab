if (typeof module != 'undefined' && typeof require == 'function'){
    var VectorClock = require('../crdt/vectorClock.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
}

function Counter(id, initialIncrementValues, initialDecrementValues) {

    this.private = {};
    this.private.id = id;
    this.private.incrementClock = initialIncrementValues;
    this.private.decrementClock = initialDecrementValues;

}

/**
 * Increment the counter for the corresponding replica
 * @param replicaId
 * @return boolean
 */
Counter.prototype.increment = function (replicaId) {

    if (!ReplicaIdentity.IsValidStringIdentity(replicaId)) {
        return false
    }

    if (!this.private.incrementClock.tracks(replicaId)) {
        this.private.incrementClock.forceTracking(replicaId);
    }

    if (!this.private.decrementClock.tracks(replicaId)) {
        this.private.decrementClock.forceTracking(replicaId);
    }

    this.private.incrementClock.increment(replicaId);

    return true;
};


/**
 * Decrement the counter for the corresponding replica
 * @param replicaId
 * @return boolean
 */
Counter.prototype.decrement = function (replicaId) {

    if (!ReplicaIdentity.IsValidStringIdentity(replicaId)) {
        return false
    }

    if (!this.private.decrementClock.tracks(replicaId)) {
        this.private.decrementClock.forceTracking(replicaId);
    }

    if (!this.private.incrementClock.tracks(replicaId)) {
        this.private.incrementClock.forceTracking(replicaId);
    }

    this.private.decrementClock.increment(replicaId);

    return true;
};

/**
 * Returns the total count
 * @returns {number} total count
 */
Counter.prototype.getCount = function () {

    var total = 0;

    var keys = this.private.incrementClock.getKeys();

    keys.forEach(function (element){
        total += this.private.incrementClock.getCount(element);
        total -= this.private.decrementClock.getCount(element);
    }, this);

    return total;
};

/**
 * Returns the decrement count tracked for a given replicaID. False if not tracking it.
 * @param repId
 * @returns {*}
 */
Counter.prototype.getDecrementCountByReplicaId = function (repId) {
    if (this.private.decrementClock.tracks(repId)) {
        var val = this.private.decrementClock.getCount(repId);
        if (val < 0) {
            return 0;
        } else {
            return val;
        }
    }

    return false;
};

/**
 * Returns the increment count tracked for a given replica ID. False if not tracking it.
 * @param repId
 * @returns {*}
 */
Counter.prototype.getIncrementCountByReplicaId = function (repId) {
    if (this.private.incrementClock.tracks(repId)) {
        var val = this.private.incrementClock.getCount(repId);
        if (val < 0) {
            return 0;
        } else {
            return val;
        }
    }

    return false;
};

/**
 * Checks if the current counter keeps track of the count of the given replica ID
 * @param repId
 * @returns {boolean}
 */
Counter.prototype.tracks = function (repId) {
    return this.private.incrementClock.tracks(repId);
};

/**
 * Returns an array of the replica IDs that it is currently tracking
 * @returns {Array}
 */
Counter.prototype.getReplicaIds = function () {
    return this.private.incrementClock.getKeys();
};

/**
 * Returns the increment vector clock
 * @returns {*}
 */
Counter.prototype.getIncrementClock = function () {
    return this.private.incrementClock;
};

/**
 * Returns the decrement vector clock
 * @returns {*}
 */
Counter.prototype.getDecrementClock = function () {
    return this.private.decrementClock;
};

/**
 * Merge two counters and return the result
 * @param otherCounter
 * @returns {*}
 */
Counter.prototype.merge = function (otherCounter) {

    if (!otherCounter) {
        log("We need two counters in order to merge!");
        return this;
    }

    if (this.private.id != otherCounter.getId()) {
        log("counterIds don't match!");
        return false;
    }

    var incClock = this.private.incrementClock.merge(otherCounter.getIncrementClock());
    var decClock = this.private.decrementClock.merge(otherCounter.getDecrementClock());

    incClock.purge();
    decClock.purge();

    return new Counter(this.private.id, incClock, decClock);
};

/**
 * Return the current counter in JSON format
 * @returns {*}
 */
Counter.prototype.toJSON = function () {
    var bag = {};
    bag['id'] = this.private.id;
    bag['increment'] = this.private.incrementClock.getInternalVector();
    bag['decrement'] = this.private.decrementClock.getInternalVector();
    return JSON.stringify(bag);
};

/**
 * Returns the ID of the current counter
 * @returns {*}
 */
Counter.prototype.getId = function () {
    return this.private.id;
};

if (typeof module != 'undefined') {
    module.exports = Counter;
}


