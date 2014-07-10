if (typeof module != 'undefined' && typeof require == 'function') {
    var VectorClock = require('../crdt/vectorClock.js');
    var RegisterValue = require('../crdt/registerValue.js');
    var MVRegister = require('../crdt/multiValueRegister.js');
    var Counter = require('../crdt/pncounter.js');
}


var CRDT = (function () {

    return {
        newCounter: function (id) {

            var initialIncrement = new VectorClock({});
            var initialDecrement = new VectorClock({});

            return new Counter(id, initialIncrement, initialDecrement);
        },

        newCounterFromJSON: function (id, jsonBag) {
            if (typeof jsonBag === "string") {
                jsonBag = JSON.parse(jsonBag);
            }

            var increment = {};
            if (jsonBag['increment']) {
                if (typeof jsonBag['increment'] === "string") {
                    jsonBag['increment'] = JSON.parse(jsonBag['increment']);
                }
                increment = new VectorClock(jsonBag['increment']);
            } else {
                increment = new VectorClock({});
            }

            var decrement = {};
            if (jsonBag['decrement']) {
                if (typeof jsonBag['decrement'] === "string") {
                    jsonBag['decrement'] = JSON.parse(jsonBag['decrement']);
                }
                decrement = new VectorClock(jsonBag['decrement']);
            } else {
                decrement = new VectorClock({});
            }

            if (id === 0) {
                id = jsonBag['id'];
            }

            return new Counter(id, increment, decrement);
        },

        newRegister: function (id) {
            return new MVRegister(id, []);
        },

        newRegisterFromJSON: function (id, jsonBag) {
            if (typeof jsonBag === "string") {
                jsonBag = JSON.parse(jsonBag);
            }

            var data = [];
            if (typeof jsonBag['data'] != 'undefined') {
                jsonBag['data'].forEach(function (element) {
                    data[data.length] = CRDT.newRegisterValueFromSimpleObject(element);
                });
            }

            if (id === 0) {
                id = jsonBag['id'];
            }

            return new MVRegister(id, data);
        },

        newRegisterValueFromSimpleObject: function (data) {
            if (!data.hasOwnProperty('value') || !data['vectorClock']) {
                log("A register value cannot be created without a value and a vectorClock!!");
                return false;
            }
            return new RegisterValue(new VectorClock(data['vectorClock']), data['value']);
        },

        newFromJSON: function (id, data, crdtType) {
            switch (crdtType) {
                case "Counter":
                    return CRDT.newCounterFromJSON(id, data);
                    break;
                case "MVRegister":
                    return CRDT.newRegisterFromJSON(id, data);
                    break;
                default:
                    return null;
            }
        }
    }
})();

if (typeof module != 'undefined') {
    module.exports = CRDT;
}