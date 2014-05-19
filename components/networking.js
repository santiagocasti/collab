function Context() {

    if (arguments.callee._ContextInstance)
        return arguments.callee._ContextInstance;

    arguments.callee._ContextInstance = this;

    this.networkInterfaces = [];
    this.ip = undefined;
    this.otherIp = undefined;
    this.sendSocketId = undefined;
    this.port = 1337;

    this.printMyIps = function () {
        this.networkInterfaces.forEach(function (e) {
            log(e.address);
        });
    };

    this.printIpInfo = function () {
        console.log("Local IP: " + this.ip);
        console.log("Other IP: " + this.otherIp);
    };

    this.fireNetworkInterfaceObtainedEvent = function () {
        console.log("Network interface obtained.");
        this.printIpInfo();
        createListenSocket(this.ip, this.port);
    };

    this.fireListenSocketCreatedEvent = function () {
        createSendSocket();
    };

    this.fireSendSocketCreatedEvent = function () {

        var i = 0;
        var sendData = function () {
            var c = Context.getInstance();
            console.log("Iteration:" + i++);
            var msg = "from[" + (c.ip ? c.ip : "-") + "] to[" + (c.otherIp ? c.otherIp : "-") + "] c[" + i + "]";
            sendMessage(c.otherIp, c.port, msg);
            setTimeout(sendData, 1000);
        }

        sendData();
    };

    return this;
}

Context.getInstance = function () {
    var c = new Context();
    return c;
};


function Socket(id, ip, port, protocol) {
    this.id = id;
    this.ip = ip;
    this.port = port;
    this.protocol = protocol;
}

function NetworkInterface(ip, netmask, name) {
    this.ip = ip;
    this.netmask = netmask;
    this.name = name;
}


var Network = (function () {


    // Instance stores a reference to the Singleton
    var instance;

    var TCP_TYPE = 1;
    var UDP_TYPE = 2;

    function init() {

        // Singleton

        // Private methods and variables
        function privateMethod() {
            console.log("I am private");
        }

        var privateVariable = "Im also private";


        // initialize sockets array
        var sockets = [];
        sockets[TCP_TYPE] = [];
        sockets[UDP_TYPE] = [];

        var networkInterfaces = [];


        function createTCPSocket(resolve, port) {

        }

        function createUDPSocket(resolve, ip, port, onReceive) {
            // Create the Socket
            chrome.sockets.udp.create({}, function (socketInfo) {
                socketId = socketInfo.socketId;
                // Setup event handler and bind socket.
                console.log("Listen socket created: socketInfo ->");
                console.log(socketInfo);

                chrome.sockets.udp.onReceive.addListener(onReceive);

                chrome.sockets.udp.bind(socketId,
                        ip, port, function (result) {
//                            var c = Context.getInstance();
                            if (result < 0) {
                                console.log("Error binding socket.");
                                return;
                            } else {
                                console.log("Listen socket bind correctly");
                                sockets[UDP_TYPE][sockets.length] = new Socket(socketId, ip, port, UDP_TYPE);
                                console.log(sockets[UDP_TYPE][sockets.length]);
                                resolve();
                            }
                        });
            });
        }

        function createAndBindSocket(resolve, type, ip, port, onReceive) {
            if (type == TCP_TYPE) {
                createTCPSocket(resolve, port);
            } else if (type == UDP_TYPE) {
                createUDPSocket(resolve, ip, port, onReceive);
            } else {
                console.log("Create socket of unspecified type.");
            }

        }


        return {

            TCP_TYPE: TCP_TYPE,

            UDP_TYPE: UDP_TYPE,

            createSocket: function (type, ip, port, onReceive, resolve) {

                if (typeof networkInterfaces == undefined ||
                        networkInterfaces.length == 0) {
                    console.log("Trying to create socket without having network interfaces.");
                    return false;
                }

                console.log("Creating socket with type[" + type + "] and port[" + port + "]");


                networkInterfaces.forEach(function (ni) {
                    var promise = new Promise(function (res, rej) {
                        createAndBindSocket(resolve, type, ip, port, onReceive);
                    });

                    promise.then(resolve());
                });
            },

            loadNetworkInterfaces: function (resolve) {

                chrome.system.network.getNetworkInterfaces(function (ni) {
                    console.log("We got the network interfaces.");
                    console.log(ni);

                    ni.forEach(function (el) {
                        var regEx = new RegExp('^[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*$');
                        if (regEx.test(el.address) == true) {
                            console.log("test was true for: " + el.address);
                            networkInterfaces[networkInterfaces.length] = new NetworkInterface(el.address, el.prefixLength, el.name);
                            console.log(networkInterfaces[networkInterfaces.length - 1]);
                        }
                    });

                    console.log("About to call resolve");
                    resolve();
                });


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


//var Network = (function () {
//
//    /**
//     * if we use var, then they are private
//     * if we use this., then they are public
//     */
//    var instance;
//
//    var TCP_TYPE = 1;
//    var UDP_TYPE = 2;
//
//    // initialize sockets array
//    var sockets = [];
//    sockets[TCP_TYPE] = [];
//    sockets[UDP_TYPE_TYPE] = [];
//
//    var networkInterfaces = [];
//
//    this.createSocket = function (type, port) {
//
//        var promise = new Promise(function (resolve, reject) {
//            chrome.system.network.getNetworkInterfaces(function (networkInterfaces) {
//                console.log("We got the network interfaces.");
//                console.log(networkInterfaces);
//                root.network.setNetworkInterfaces(networkInterfaces);
//                console.log("About to call resolve");
//                resolve();
//            });
//        });
//
//        var success = function () {
//            console.log("Successful!")
//        };
//
//        var failure = function () {
//            console.log("Failure!")
//        };
//
//        promise.then(success, failure);
//
//    }
//
//
//    this.setNetworkInterfaces = function (ni) {
//
//        this.networkInterfaces = ni;
//
//        this.networkInterfaces.forEach(function (el) {
//            var regEx = new RegExp("(192\.168\.90\.[0-9]*)");
//            if (regEx.test(el.address)) {
//                c.ip = el.address;
//                if (c.ip == "192.168.90.129") {
//                    c.otherIp = '192.168.90.1';
//                } else {
//                    c.otherIp = '192.168.90.129';
//                }
//            }
//        });
//    };
//
//})();

//    chrome.system.network.getNetworkInterfaces(function (networkInterfaces) {
//        var c = Context.getInstance();
//        c.networkInterfaces = networkInterfaces;
//
//        c.networkInterfaces.forEach(function (el) {
//            var regEx = new RegExp("(192\.168\.90\.[0-9]*)");
//            if (regEx.test(el.address)) {
//                c.ip = el.address;
//                if (c.ip == "192.168.90.129") {
//                    c.otherIp = '192.168.90.1';
//                } else {
//                    c.otherIp = '192.168.90.129';
//                }
//            }
//        });
//
//        c.fireNetworkInterfaceObtainedEvent();
//    });
//
//
//    function log(m) {
//        var c = Context.getInstance();
//        console.log("[" + c.ip + "]: " + m);
//    }
//
//    function logSent(from, to, length) {
//        log("Sent from[" + from + "] to[" + to + "] bytesSent[" + length + "]");
//    }
//
//    function createSendSocket() {
//        // Create the Socket
//        chrome.sockets.udp.create({}, function (socketInfo) {
//            // The socket is created, now we can send some data
//            var c = Context.getInstance();
//            c.sendSocketId = socketInfo.socketId;
//            log("Send socket created: socketInfo ->");
//            console.log(socketInfo);
//
//
//            chrome.sockets.udp.bind(c.sendSocketId,
//                    "0.0.0.0", 0, function (result) {
//                        log("Send socket bind correctly.");
//                        c.fireSendSocketCreatedEvent();
//                    });
//        });
//    }
//
//    function sendMessage(ip, port, msg) {
//        var c = Context.getInstance();
//        var arrayBuffer = str2ab(msg);
//        chrome.sockets.udp.send(c.sendSocketId, arrayBuffer, ip, port, function (sendInfo) {
//            logSent(c.ip, c.otherIp, sendInfo.bytesSent);
//        });
//    }
//
//    function createListenSocket(ip, port) {
//
//        var socketId;
//
//        // Handle the "onReceive" event.
//        var onReceive = function (info) {
////        if (info.socketId !== socketId)
////            return;
////        log(" We just received: " + ab2str(info.data));
////        console.log(info);
//            log("Received[" + info.socketId + "]: from[" + info.remoteAddress + ":" + info.remotePort + "] data[" + ab2str(info.data) + "]");
//        };
//
//        // Create the Socket
//        chrome.sockets.udp.create({}, function (socketInfo) {
//            socketId = socketInfo.socketId;
//            // Setup event handler and bind socket.
//            log("Listen socket created: socketInfo ->");
//            console.log(socketInfo);
//            chrome.sockets.udp.onReceive.addListener(onReceive);
//            chrome.sockets.udp.bind(socketId,
//                    ip, port, function (result) {
//                        var c = Context.getInstance();
//                        if (result < 0) {
//                            log("Error binding socket.");
//                            return;
//                        } else {
//                            log("Listen socket bind correctly");
//                            c.fireListenSocketCreatedEvent();
//                        }
//                    });
//        });
//
//    }
//
//
////chrome.app.runtime.onLaunched.addListener(function () {
////    // Tell your app what to launch and how.
////    chrome.app.window.create('homepage.html', {
////        "width": 800,
////        "height": 600
////    });
////});
//
//
////Convert to and From ArrayBuffer
//    function ab2str(buf) {
//        return String.fromCharCode.apply(null, new Uint16Array(buf));
//    }
//
//    function str2ab(str) {
//        var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
//        var bufView = new Uint16Array(buf);
//        for (var i = 0, strLen = str.length; i < strLen; i++) {
//            bufView[i] = str.charCodeAt(i);
//        }
//        return buf;
//    }


