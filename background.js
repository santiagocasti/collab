chrome.app.runtime.onLaunched.addListener(function (launchData) {
    chrome.app.window.create('index.html', {'bounds': {
        'width': 800,
        'height': 600
    }, 'maxWidth': 800,
        'maxHeight': 600}, function (win) {
        win.contentWindow.launchData = launchData;
        win.onClosed.addListener(function () {
            var appController = ApplicationController.getInstance();
            appController.appClosed();
        });
    });
});

var n = Network.getInstance();

var promise = new Promise(function (resolve, reject) {
    n.loadNetworkInterfaces(resolve);
});

promise.then(function () {

    /**
     * This callback is used when new data is received on the multicast replication socket.
     * @param data
     */
    var replicationDataReceived_DxmWj16N13ZH = (function (data) {
        ReplicationController.HandleMulticastReplicationMessage(data);
    });

    debug("Starting the multicast socket creation part....");
    n.createMulticastSocket(MulticastReplicationProtocol.Port, replicationDataReceived_DxmWj16N13ZH);

}).then(function () {
            /**
             * This callback is used when new data is received on any TCP socket.
             * Only the direct replication protocol works over TCP, the other protocol
             * works over UDP.
             * @type {Function}
             */
            var replicationDirectRequest_EzgZfgrrft44 = (function (data, socket) {
                ReplicationController.HandleDirectReplicationMessage(data, socket);
            })

            debug("Starting the TCP socket creation part");
            n.createTCPServerSockets(replicationDirectRequest_EzgZfgrrft44);

        });

// Add a listener to the internal message passing mechanism of the app
function callback_oAk9bgKDjyjd(message, sender, sendResponse) {
    BackEndMessaging.handleMessage(message, sender, sendResponse);
}
chrome.runtime.onMessage.addListener(callback_oAk9bgKDjyjd);




