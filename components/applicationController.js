var ApplicationController = (function () {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

        var onlineUserCounterId = 1;

        // create a new data store instance
        var dataStore = DataStore.getInstance();

        // create and assign callback for the online user counter
        var callback_ToFP4tA9ZdRg = function (counter) {
            notifyFrontEndAboutOnlineUserCounter(counter.getCount());
        }
        dataStore.subscribeToNewCounter(callback_ToFP4tA9ZdRg, onlineUserCounterId);

        // create and assign a callback for new cells
        var callback_QyRg1nwivb0n = function (cells) {
            notifyFronEndAboutNewCells(cells);
        }
        dataStore.subscribeToNewRegister(callback_QyRg1nwivb0n);

        /**
         * Send a message to the front end to update the online user counter
         */
        function notifyFrontEndAboutOnlineUserCounter(count) {
            var msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.USER_COUNT_UPDATED, count);
            BackEndMessaging.sendMessage(msg);
        }

        /**
         * Send a message to the front end to update a set of cells
         */
        function notifyFronEndAboutNewCells(cells) {

            var arrayOfCells = [];
            if (!(cells instanceof Array)){
                for(var key in cells) {
                    arrayOfCells.push(cells[key]);
                }
            }else{
                arrayOfCells = cells;
            }

            if (arrayOfCells.length == 0) {
                return;
            }

            var cellToSend, res, allNewCells = [];
            arrayOfCells.forEach(function (cell) {

                // set the cell in the app controller
                cells[cell.getId()] = cell;

                // split the id
                res = cell.getId().split('-');

                // create the object to send to the front end
                cellToSend = {};
                cellToSend.row = res[0];
                cellToSend.col = res[1];
                cellToSend.value = cell.getValue();

                allNewCells.push(cellToSend);
            });


            var msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.NEW_CELL_VALUE, allNewCells);
            BackEndMessaging.sendMessage(msg);
        }

        return {

            updateCell: function (row, column, value) {
                var id = row + "-" + column;
                dataStore.saveCell(id, value);
            },

            appStarted: function () {
                debug("App started code");

                var c = Context.getInstance();
                var ri = c.getReplicaIdentity();
                ri.updateTimestamp();
                c.setReplicaIdentity(ri);

                dataStore.incrementCounter(onlineUserCounterId);

                notifyFrontEndAboutOnlineUserCounter(dataStore.getCounterValue(onlineUserCounterId));

                ReplicationController.Init();

                var c = Context.getInstance();
                c.startTestCheck();
            },

            appClosed: function () {
                debug("App closing");

                // decrement the counter of online users
                var c = Context.getInstance();
                c.setDirectReplicationFlag(false);
                c.stopTestCheck();
                c.clearPeerList();

                dataStore.decrementCounter(onlineUserCounterId);
            }

        };

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
 
