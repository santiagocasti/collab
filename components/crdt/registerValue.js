function RegisterValue(vectorClock, value) {
    this.value = value;
    this.vectorClock = vectorClock;
}

RegisterValue.prototype.toSimpleObject = function (){
    var array = {};
    array.value = this.value;
    array.vectorClock = this.vectorClock.getInternalVector();
    return array;
};

RegisterValue.prototype.toString = function (){
    return this.vectorClock.toString() + ":" + this.value;
};

if (typeof module != 'undefined') {
    module.exports = RegisterValue;
}