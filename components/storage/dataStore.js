var DataStore = (function () {

    var instance;

    function init() {

        const NEW_REGISTERS = "NEW_REGISTERS";
        const NEW_COUNTERS = "NEW_COUNTERS";

        var registers = {};
        var counters = {};
        var callbacks = {
            NEW_REGISTERS: [],
            NEW_COUNTERS: []
        };

        var callbacksById = {
            NEW_REGISTERS: {},
            NEW_COUNTERS: {}
        };

        function getCounter(id) {
            if (typeof counters[id] == 'undefined') {
                counters[id] = CRDT.newCounter(id);
            }

            return counters[id];
        }

        function getRegister(id) {
            if (typeof registers[id] == 'undefined') {
                registers[id] = CRDT.newRegister(id);
            }

            return registers[id];
        }

        function notifySubscribers(type, newObjects) {

            debug("Notifying for type["+type+"]:", newObjects);

            // trigger the callbacks for each subscriber to any object
            callbacks[type].forEach(function (callback) {
                debug("Calling callback: "+callback, callback);
                callback(newObjects);
            });

            // trigger the callbacks for each subscriber to an individual object identifier
            newObjects.forEach(function (o) {
                if ((o instanceof Counter || o instanceof MVRegister) &&
                        typeof callbacksById[type][o.getId()] != 'undefined') {
                    callbacksById[type][o.getId()].forEach(function (callback){
                        debug("Calling callback: "+callback, callback);
                        callback(o);
                    });
                }
            });
        }

        return {

            getCounters: function (){
                return counters;
            },

            saveCounters: function (counters) {

                if (!(counters instanceof Array)) {
                    counters = [counters];
                }

                var newCounters = [];

                counters.forEach(function (c) {
                    if (c instanceof Counter) {
                        var existing = getCounter(c.getId());
                        existing = existing.merge(c);
                        counters[existing.getId()] = existing;
                        newCounters[existing.getId()] = existing;
                    }
                });

                if (newCounters.length > 0) {
                    notifySubscribers(NEW_COUNTERS, newCounters);
                }
            },

            getRegisters: function (){
                return registers;
            },

            saveRegisters: function (regs) {

                if (!(regs instanceof Array)) {
                    regs = [regs];
                }

                var newRegisters = [];

                regs.forEach(function (r) {
                    if (r instanceof MVRegister) {
                        var existing = getRegister(r.getId());
                        existing = existing.merge(r);
                        registers[existing.getId()] = existing;
                        newRegisters.push(existing);
                    }
                });

                if (newRegisters.length > 0) {
                    notifySubscribers(NEW_REGISTERS, newRegisters);
                }
            },

            saveCell: function (id, value) {

                var c = Context.getInstance();
                var register = getRegister(id);

                register.setValue(c.getReplicaIdentity().toString(), value);

                ReplicationController.Replicate(register);
            },

            incrementCounter: function (id) {
                var c = Context.getInstance();
                var counter = getCounter(id);

                counter.increment(c.getReplicaIdentity().toString());

                ReplicationController.Replicate(counter);
            },

            decrementCounter: function (id) {
                var c = Context.getInstance();
                var counter = getCounter(id);

                counter.decrement(c.getReplicaIdentity().toString());

                ReplicationController.Replicate(counter);
            },

            getCounterValue: function (id) {
                var c = getCounter(id);
                return c.getCount();
            },

            subscribeToNewCounter: function (callback, id) {
                if (typeof id == 'undefined') {
                    callbacks[NEW_COUNTERS].push(callback);
                } else {
                    log("callbacksById id["+id+"]: ", callbacksById);
                    if (!callbacksById[NEW_COUNTERS].hasOwnProperty(id)){
                        callbacksById[NEW_COUNTERS][id] = [];
                    }
                    callbacksById[NEW_COUNTERS][id].push(callback);
                }
            },

            subscribeToNewRegister: function (callback, id) {
                if (typeof id == 'undefined') {
                    callbacks[NEW_REGISTERS].push(callback);
                } else {
                    if (typeof callbacksById[NEW_REGISTERS][id] == 'undefined'){
                        callbacksById[NEW_REGISTERS][id] = [];
                    }
                    callbacksById[NEW_REGISTERS][id].push(callback);
                }
            }


        }
    }

    return {

        // Get the Singleton instance if one exists
        // or create one if it doesn't
        getInstance: function () {

            if (!instance) {
                instance = init();
            }

            return instance;
        }

    };

})();