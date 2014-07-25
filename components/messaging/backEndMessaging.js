var BackEndMessaging = (function () {


    function sendMessage(message, onResponse) {
        var msg = MessagePassing.PrepareMessage(message);
        chrome.runtime.sendMessage(msg, onResponse);
    }

    function shouldProcess(message) {
        return message.to == MessagePassing.Destinations.BACK;
    }

    return {

        handleMessage: function (rawMessage, sender, sendResponse) {

            debug("BackEndMessaging handleMessage");

            // make sure we should process this message
            if (!shouldProcess(rawMessage)) {
                debug("We should not process this message:", rawMessage);
                return;
            }

            debug("We should process this message:", rawMessage);

            var message = MessagePassing.ParseMessage(rawMessage);

            /** @var message MessagePassing */
            switch (message.type) {
                case MessagePassing.MessageTypes.OPENED_WINDOW:
                    var appController = ApplicationController.getInstance();
                    appController.appStarted();
                    break;
                case MessagePassing.MessageTypes.CLOSING_WINDOW:
                    debug("Received a message of type CLOSING_WINDOW", message);

                    var appController = ApplicationController.getInstance();
                    appController.appClosed();
                    break;
                case MessagePassing.MessageTypes.PRINT_PEER_LIST:
                    debug("Received a message to print the peer list");
                    var c = Context.getInstance();
                    c.printPeerList();
                    break;
                case MessagePassing.MessageTypes.PERFORM_DIRECT_REPLICATION_REQUEST:
                    debug("Received a message to perform direct replication");
                    var c = Context.getInstance();
                    var peers = c.getAllPeers();
                    if (peers.length > 0) {
                        log("Sending direct replication request to peer ["+peers[0].getReplicaIdentityString()+"] at "+ peers[0].getIpAddress());
                        ReplicationController.SendDirectReplicationRequest(peers[0]);
                    } else {
                        log("NOT Sending direct replication request because we don't have enough peers.");
                    }
                    break;
                case MessagePassing.MessageTypes.NEW_CELL_VALUE:
                        debug("Received a message with a new cell value");
                        var appController = ApplicationController.getInstance();
                        var content = message.content;
                        appController.updateCell(content.row, content.col, content.value);
                    break;
                default:
                    debug("Received message that should not handle [" + message.type + "]: ", message);
            }

        },

        sendMessage: function (message, onResponse) {
            return sendMessage(message, onResponse);
        }

    };
})();
