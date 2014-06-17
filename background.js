chrome.app.runtime.onLaunched.addListener(function (launchData) {
    chrome.app.window.create('index.html', function (win) {
        win.contentWindow.launchData = launchData;
    });
});

var n = Network.getInstance();

var promise = new Promise(function (resolve, reject) {
    n.loadNetworkInterfaces(resolve);
});

promise.then(function () {

    /**
     * This callback is used when new data arrives from the replication socket.
     * @param data
     */
    var replicationDataReceived_DxmWj16N13ZH = (function (data) {
        ReplicationController.HandleMulticastReplicationMessage(data);
    });

    debug("Starting the multicast socket creation part....");
    n.createMulticastSocket(MulticastReplicationProtocol.Port, replicationDataReceived_DxmWj16N13ZH);

}).then(function () {
            var replicationDirectRequest_EzgZfgrrft44 = (function (msg, socket) {
                ReplicationController.HandleDirectReplicationMessage(msg, socket);
            })

            debug("Starting the TCP socket creation part");
            n.createTCPServerSockets(replicationDirectRequest_EzgZfgrrft44);

        });

// Add a listener to the internal message passing mechanism of the app
function callback_oAk9bgKDjyjd(message, sender, sendResponse) {
    BackEndMessaging.handleMessage(message, sender, sendResponse);
}
chrome.runtime.onMessage.addListener(callback_oAk9bgKDjyjd);




