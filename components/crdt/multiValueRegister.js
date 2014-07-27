if (typeof module != 'undefined' && typeof require == 'function'){
    var VectorClock = require('../crdt/vectorClock.js');
    var RegisterValue = require('../crdt/registerValue.js');
    var ReplicaIdentity = require('../replication/replicaIdentity.js');
}


function MVRegister(id, data) {

    this.private = {};
    this.private.id = id;
    this.private.data = data;

}

MVRegister.prototype.getId = function () {
    return this.private.id;
}

MVRegister.prototype.getValue = function () {
    var result = [];
    this.private.data.forEach(function (pair) {
        result[result.length] = pair.value;
    });
    return result;
}

MVRegister.prototype.getMergedVectorClock = function () {
    // calculate a vector clock that is the merge
    // of all the existing vectors
    var vc = new VectorClock({});
    this.private.data.forEach(function (pair) {
        vc = vc.merge(pair.vectorClock);
    });
    return vc;
}

MVRegister.prototype.setValue = function (repId, value) {

    if (!ReplicaIdentity.IsValidStringIdentity(repId)) {
        return false
    }

    // get the merged vector clock
    var vc = this.getMergedVectorClock();

    // increase it by 1 for the given replica ID
    vc.increment(repId);

    // create the pair, and add it to the data array as unique value
    var pair = new RegisterValue(vc, value);
    this.private.data = [pair];
}

MVRegister.prototype.compare = function (register) {
    var vc1 = this.getMergedVectorClock();
    var vc2 = register.getMergedVectorClock();

    return vc1.compare(vc2);
}


function getHighestFromSetOfPairs(aSetOfPairs) {
    var setA = aSetOfPairs;
    setA.sort(function (a, b) {
        var compResult = a.vectorClock.compare(b.vectorClock);
        return compResult;
    });
    setA.reverse();
    return setA[0].vectorClock;
}

MVRegister.prototype.exactlyEqual = function (otherRegister){

    // compare IDs
    if (this.private.id !== otherRegister.private.id){
        return false;
    }


    // obtain deterministic string format of all the values
    var allValuesThis = [], allValuesOther= [];

    this.private.data.forEach(function(pair){
        allValuesThis.push(pair.toString());
    });

    otherRegister.private.data.forEach(function(pair){
        allValuesOther.push(pair.toString());
    });

    if (allValuesThis.length != allValuesOther.length){
        return false;
    }

    // compare all the values in the two arrays
    for (var i=0; i < allValuesThis.length; ++i){
        if (allValuesThis[i] !== allValuesOther[i]){
            return false;
        }
    }

    return true;

}

MVRegister.prototype.merge = function (otherRegister) {

    if (!(otherRegister instanceof MVRegister)) {
        return null;
    }

    // base case, one of the two registers to merge is empty
    if (this.private.data.length === 0) {
        return new MVRegister(otherRegister.private.id, otherRegister.private.data)
    } else if (otherRegister.private.data.length === 0) {
        return new MVRegister(this.private.id, this.private.data);
    }

    if (this.exactlyEqual(otherRegister)){
        return this;
    }

    var finalSet = [];

    // get the highest pair from the current register
    var highestClockB, highestClockA = getHighestFromSetOfPairs(this.private.data);

    // get the values from the other register that are higher or equal
    var biggerOrEqualValues = otherRegister.getHigherValues(highestClockA);

    if (biggerOrEqualValues.length == 0) {
        // if we don't have any,
        // then we should get the highest of the other register
        // to get the ones that qualify from the current set
        highestClockB = getHighestFromSetOfPairs(otherRegister.private.data);
    } else {
        // add the elements to the final set
        finalSet = finalSet.concat(biggerOrEqualValues);

        // get the highest of them to retrieve later the higher
        // elements of the current set
        highestClockB = getHighestFromSetOfPairs(finalSet);
    }

    // use it to get the elements from the current register
    biggerOrEqualValues = this.getHigherValues(highestClockB);

    // add them to the final set
    finalSet = finalSet.concat(biggerOrEqualValues);

    return new MVRegister(this.private.id, finalSet);
}

MVRegister.prototype.getHigherValues = function (lowestVectorClock) {

    var result = [];

    if (!(lowestVectorClock instanceof VectorClock)) {
        return result;
    }

    this.private.data.forEach(function (pair) {
        if (pair.vectorClock.compare(lowestVectorClock) !== -1) {
            result[result.length] = pair;
        }
    });

    return result;
}

MVRegister.prototype.toObject = function (){
    var bag = {};
    bag['id'] = this.private.id;
    var array = [];
    this.private.data.forEach(function (element) {
        array[array.length] = element.toSimpleObject();
    });
    bag['data'] = array;
    return bag;
}


MVRegister.prototype.toJSON = function () {
    return JSON.stringify(this.toObject());
}

if (typeof module != 'undefined') {
    module.exports = MVRegister;
}


