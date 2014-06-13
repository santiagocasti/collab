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

            debug("We should process this message:");
            debug(rawMessage);

            var message = MessagePassing.ParseMessage(rawMessage);

            /** @var message MessagePassing */
            switch (message.type) {
                case MessagePassing.MessageTypes.NEW_DATA_CREATED:
                    debug("Received a message of type NEW_DATA_CREATED: ", message);

                    var appController = ApplicationController.getInstance();
                    appController.newDataCreated(message.content);

                    break;
                case MessagePassing.MessageTypes.OPENED_WINDOW:
                    var appController = ApplicationController.getInstance();
                    appController.appStarted();
                    break;
                case MessagePassing.MessageTypes.CLOSING_WINDOW:
                    debug("Received a message of type CLOSING_WINDOW", message);

                    var appController = ApplicationController.getInstance();
                    appController.appClosed();
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
