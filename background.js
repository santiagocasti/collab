chrome.app.runtime.onLaunched.addListener(function (launchData) {
    chrome.app.window.create('index.html', function (win) {
        win.contentWindow.launchData = launchData;
    });

    var c = Context.getInstance();
    var counter = c.getOnlineUsersCounter();
    var appController = ApplicationController.getInstance();
    appController.updateOnlineUserCount(counter.getCount());
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
    var replicationDataReceived = (function (data) {
        ReplicationController.HandleMessage(data);
    });

    debug("Starting the socket creation part....");
    n.createMulticastSocket(n.UDP_TYPE, ReplicationProtocol.Port, replicationDataReceived);

}).then(function () {
            debug("Starting the online counter manipulation part");
            var counter = CRDT.newCounter(1, {});
            var c = Context.getInstance();

            counter.increment(c.getHashedReplicaId());

            c.setOnlineUsersCounter(counter);

            var appController = ApplicationController.getInstance();
            appController.updateOnlineUserCount(counter.getCount());

            ReplicationController.ReplicateCounter(counter);

        });

// Add a listener to the internal message passing mechanism of the app
function callback_oAk9bgKDjyjd(message, sender, sendResponse) {
    BackEndMessaging.handleMessage(message, sender, sendResponse);
}
chrome.runtime.onMessage.addListener(callback_oAk9bgKDjyjd);




