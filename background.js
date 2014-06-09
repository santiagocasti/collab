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
    var replicationDataReceived = (function (data) {
        ReplicationController.HandleMessage(data);
    });

    log("Starting the socket creation part....");
    return n.createSocket(n.UDP_TYPE, 1234, replicationDataReceived);
});


// Add a listener to the internal message passing mechanism of the app
function callback_oAk9bgKDjyjd(message, sender, sendResponse){
    BackEndMessaging.handleMessage(message, sender, sendResponse);
}
chrome.runtime.onMessage.addListener(callback_oAk9bgKDjyjd);




