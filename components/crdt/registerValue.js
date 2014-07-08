function RegisterValue(vectorClock, value) {
    this.value = value;
    this.vectorClock = vectorClock;
}

RegisterValue.prototype.toSimpleObject = function (){
    var array = {};
    array.value = this.value;
    array.vectorClock = this.vectorClock.getInternalVector();
    return array;
}