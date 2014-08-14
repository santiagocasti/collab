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

var comm = Communication.getInstance();

var serverRepProtocol = new ServerReplicationProtocol();
comm.setServerReplicationProtocol(serverRepProtocol);

var serverRecoveryProtocol = new ServerRecoveryProtocol();
comm.setServerRecoveryProtocol(serverRecoveryProtocol);

var n = Network.getInstance();

var promise = new Promise(function (resolve, reject) {
    n.loadNetworkInterfaces(resolve);
});

promise.then(function () {

    /**
         * Peer Discovery Protocol
         */
        var pdProtocol = new PeerDiscoveryProtocol(5678);
        comm.setPeerDiscoveryProtocol(pdProtocol);

        var replicationDataReceived_SxqdH6LZHLEb = (function (data) {
            pdProtocol.handleMessage(data);
        });

        debug("Starting the multicast socket creation part on port [" + pdProtocol.port + "]....");
        n.createMulticastSocket(pdProtocol.ip, pdProtocol.port, replicationDataReceived_SxqdH6LZHLEb);

}).then(function () {

    var CausalBroadcast = 1;
    var NewsCast = 2;
    var TreeOverlay = 3;

    var peerReplicationProtocol = NewsCast;

    switch (peerReplicationProtocol) {
        case CausalBroadcast:
            /**
             * Causal Broadcast Protocol
             */
            var cbProtocol = new CausalBroadcastProtocol(5677);
            comm.setPeerReplicationProtocol(cbProtocol);

            var replicationDataReceived_DxmWj16N13ZH = (function (data) {
                cbProtocol.handleMessage(data);
            });

            debug("Starting the multicast socket creation part on port [" + cbProtocol.port + "]....");
            n.createMulticastSocket(cbProtocol.ip, cbProtocol.port, replicationDataReceived_DxmWj16N13ZH);
            break;
        case NewsCast:
            /**
             * NewsCast Protocol
             */
            var cbProtocol = new NewsCastPeerReplicationProtocol(15677);
            comm.setPeerReplicationProtocol(cbProtocol);

            var replicationDataReceived_46GGvw9fdAGD = (function (data, socketId) {
                cbProtocol.handleMessage(data, socketId);
            });

            var socketCreated_uQPdci2UcmV3 = function (socketId) {
                cbProtocol.setSocketId(socketId);
            };

            debug("Starting the multicast socket creation part on port [" + cbProtocol.port + "]....");
            n.createUDPSocket(cbProtocol.socketIp, cbProtocol.port, replicationDataReceived_46GGvw9fdAGD, socketCreated_uQPdci2UcmV3);
            break;
        case TreeOverlay:
            /**
             * Tree Overlay Protocol
             */
            var cbProtocol = new TreeOverlayPeerReplicationProtocol(5677);
            comm.setPeerReplicationProtocol(cbProtocol);

            var replicationDataReceived_fNypv1eAyizP = (function (data) {
                cbProtocol.handleMessage(data);
            });

            var socketCreated_78onzGvUaScD = function (socketId) {
                cbProtocol.setSocketId(socketId);
            };

            debug("Starting the multicast socket creation part on port [" + cbProtocol.port + "]....");
            n.createUDPSocket(cbProtocol.socketIp, cbProtocol.port, replicationDataReceived_fNypv1eAyizP, socketCreated_78onzGvUaScD);
            break;
        default:
            log("ERROR: No peer replication protocol selected.");
    }

}).then(function () {
            /**
             * Direct Replication Protocol
             */
            var drProtocol = new PeerRecoveryProtocol(5679);
            comm.setPeerRecoveryProtocol(drProtocol);

            var replicationDirectRequest_EzgZfgrrft44 = (function (data, socket) {
                drProtocol.handleMessage(data, socket);
            })

            debug("Starting the TCP socket creation part");
            n.createTCPServerSockets(replicationDirectRequest_EzgZfgrrft44);

        });

// Add a listener to the internal message passing mechanism of the app
function callback_oAk9bgKDjyjd(message, sender, sendResponse) {
    BackEndMessaging.handleMessage(message, sender, sendResponse);
}
chrome.runtime.onMessage.addListener(callback_oAk9bgKDjyjd);




