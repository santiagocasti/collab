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

            log("JSON BAG on counter building:", jsonBag);

            var increment = {};
            if (jsonBag['increment']) {
                if (typeof jsonBag['increment'] === "string"){
                    jsonBag['increment'] = JSON.parse(jsonBag['increment']);
                }
                increment = new VectorClock(jsonBag['increment']);
            }

            var decrement = {};
            if (jsonBag['decrement']) {
                if (typeof jsonBag['decrement'] === "string"){
                    jsonBag['decrement'] = JSON.parse(jsonBag['decrement']);
                }
                decrement = new VectorClock(jsonBag['decrement']);
            }

            if (id === 0) {
                id = jsonBag['id'];
            }

            return new Counter(id, increment, decrement);
        },

        newRegister: function () {

        },

        newRegisterFromJSON: function () {

        }
    }
})();