var ApplicationController = (function () {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

        var onlineUserCounter;
        var cells = {};

        /**
         * Process data created in the current instance of the application
         * @param message
         */
        function processCreatedData(message) {

            var callback_123987ioslk = function (sendInfo) {
                debug("Message [" + message + "] replicated");
                debug("Send Info is:", sendInfo);
                debug("Notifying frontend");
                // notify the frontend that the data was replicated correctly
                msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.REPLICATION_NOTIFICATION, "[" + message + "] replicated");
                BackEndMessaging.sendMessage(msg);
            }

            // replicate the new created data
            var msg = Message.Create(Message.Types.OUT, message);
            debug("Message created for replication: ", msg);

            ReplicationController.Replicate(msg, callback_123987ioslk);

            // store the data in permanent storage
            // TODO: add permanent storage
        }

        /**
         * Process data received through the replication protocol
         * @param repMsg
         * @param rawMsg
         */
        function processReceivedData(repMsg, rawMsg) {

            // create the content
            var content = repMsg.getPayload();
            content.remoteAddress = rawMsg.remoteAddress;
            content.remotePort = rawMsg.remotePort;
            debug("Final payload to be sent:", content);

            // create a message for the message passing interface
            var msgMsgPassing = MessagePassing.MessageToFront(MessagePassing.MessageTypes.NEW_DATA_AVAILABLE, content);
            debug("Message for frontend: ", msgMsgPassing);

            // send the new data to the frontend
            BackEndMessaging.sendMessage(msgMsgPassing);

            // store the data in the permanent storage
            // TODO: add permanent storage
        }

        function notifyFrontEndAboutOnlineUserCounter() {
            log("Sending message to front-end with new online user count: " + onlineUserCounter.getCount());
            var msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.USER_COUNT_UPDATED, onlineUserCounter.getCount());
            BackEndMessaging.sendMessage(msg);
        }

        function setCounter(counter) {
            onlineUserCounter = counter;
        }

        function mergeOnlineUserCounter(counter) {
            if (counter.getId() != 1) {
                return;
            }

            onlineUserCounter.merge(counter);
        }

        return {

            newDataCreated: function (msg) {
                processCreatedData(msg);
            },

            newDataReceived: function (msg, rawMsg) {
                processReceivedData(msg, rawMsg);
            },

            setOnlineUsersCounter: function (counter) {
                setCounter(counter);
                notifyFrontEndAboutOnlineUserCounter();
            },

            newCounterReceived: function (counter) {
                if (counter.getId() == 1) {
                    mergeOnlineUserCounter(counter);
                    notifyFrontEndAboutOnlineUserCounter();
                }
            },

            updatedCellValue: function (row, column, value) {
                var id = row + "-" + column;

                // if we are not tracking this cell, then create the object
                if (!cells.hasOwnProperty(id) || !(cells[id] instanceof MVRegister)) {
                    cells[id] = CRDT.newRegister(id);
                }

                var c = Context.getInstance();

                cells[id].setValue(c.getReplicaIdentity().toString(), value);

                ReplicationController.ReplicateRegister(cells[id]);
            },

            getCell: function (id) {
                if (!cells.hasOwnProperty(id)) {
                    cells[id] = CRDT.newRegister(id);
                }

                return cells[id];
            },

            setCell: function (id, cell) {
                cells[id] = cell;

                var cellToSend = {};
                var res = id.split('-');

                cellToSend.row = res[0];
                cellToSend.col = res[1];
                cellToSend.value = cell.getValue();

                var msg = MessagePassing.MessageToFront(MessagePassing.MessageTypes.NEW_CELL_VALUE, cellToSend);
                BackEndMessaging.sendMessage(msg);
            },

            getOnlineUsersCounter: function () {
                return onlineUserCounter;
            },

            getAllCells: function () {
                return cells;
            },

            appStarted: function () {
                debug("App started code");

                var c = Context.getInstance();
                var ri = c.getReplicaIdentity();

                // create a counter and increment it
                var counter = CRDT.newCounter(1);
                counter.increment(ri.toString());

                // set the counter to the app controller
                setCounter(counter);
                notifyFrontEndAboutOnlineUserCounter();

                ReplicationController.ReplicateCounter(onlineUserCounter);

                ReplicationController.SharePeerIdentity();

                // callback to send a direct replication request
                var callback_a4GMHVoaATHu = function () {
                    ReplicationController.StartDirectReplication();
                }

                // when a new peer is added, this callback will be called
                c.addCallbackForEvent(Context.Event.NEW_PEER, callback_a4GMHVoaATHu);
            },

            appClosed: function () {
                debug("App closing");

                // decrement the counter of online users
                var c = Context.getInstance();
                var ri = c.getReplicaIdentity();

                onlineUserCounter.decrement(ri.toString());

                // replicate it
                ReplicationController.ReplicateCounter(onlineUserCounter);
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
 
