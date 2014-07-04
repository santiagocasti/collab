var CRDT = (function () {


    return {
        newCounter: function (id, initialIncrement, initialDecrement) {
            return Counter.new(id, initialIncrement, initialDecrement);
        },

        newCounterFromJSON: function (id, jsonBag) {
            return Counter.newFromJSON(id, jsonBag);
        },

        newRegister: function (){

        },

        newRegisterFromJSON: function (){

        }
    }
});