/**
 * ReplicationP - Replication Protocol constants
 */
var ReplicationP = (function () {

    const REPLICATION_OUT = 1;
    const REPLICATION_IN = 2;

    const PORT = 1234;
    const MULTICAST_IP = "237.132.123.123";

    return{
        MessageTypes: {
            OUT: REPLICATION_OUT,
            IN: REPLICATION_IN
        },

        Port: PORT,

        MulticastIP: MULTICAST_IP
    }
})();

/**
 * Message class
 */
var Message = (function () {

    function init(t, c) {

        var type = t;
        var content = c;

        return {
            getPreparedContent: function () {
                var strContent = JSON.stringify(content);
                return MessageEncoder.str2ab(strContent);
            },

            getType: function () {
                return type;
            },

            getContent: function () {
                return content;
            },

            log: function () {
                console.log("type: " + type);
                console.log("content: " + content);
            }
        }
    }

    return{

        CreateFromRawData: function (type, rawMessage) {
            var content = MessageEncoder.ab2str(rawMessage);
            return init(type, JSON.parse(content));
        },

        Create: function (type, content) {
            return init(type, content);
        }

    }
})();

/**
 * Receiver class
 * @param ip
 * @param port
 * @constructor
 */
function Receiver(ip, port) {
    this.ip = ip;
    this.port = port;
}

/**
 * Socket class
 * @param id
 * @param port
 * @param protocol
 * @constructor
 */
function Socket(id, port, protocol) {
    this.id = id;
    this.port = port;
    this.protocol = protocol;
}

/**
 * 
 * @param ip
 * @param netmask
 * @param name
 * @constructor
 */
function NetworkInterface(ip, netmask, name) {

    const PEER_REPLICATION_TYPE = 1;
    const SERVER_REPLICATION_TYPE = 2;
    const PEER_DISCOVERY = 3;

    this.ip = ip;
    this.netmask = netmask;
    this.name = name;
    this.sockets = [];

    this.getSocketByPortAndType = function (port, type) {
        var result;
        console.log("We have " + this.sockets.length + " sockets.");
        this.sockets.forEach(function (socket) {
            if (socket.port == port &&
                    socket.protocol == type) {
                console.log("socket.port[" + socket.port + "] == port[" + port + "] && socket.protocol[" + socket.protocol + "] == type[" + type + "]");
                result = socket;
            }
        });
        return result;
    };

    this.getMulticastAddress = function () {
        return ReplicationP.MulticastIP;
    }
}

/**
 * Message Encoder class
 * Performs transformations between string and ArrayBuffer
 */
var MessageEncoder = (function () {

    return {
        ab2str: function (buf) {
            return String.fromCharCode.apply(null, new Uint16Array(buf));
        },

        str2ab: function (str) {
            var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
            var bufView = new Uint16Array(buf);
            for (var i = 0, strLen = str.length; i < strLen; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            return buf;
        }
    };

})();


var Network = (function () {

    // Instance stores a reference to the Singleton
    var instance;

    var TCP_TYPE = 1;
    var UDP_TYPE = 2;

    var multicastSocket;

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

        var pendingMessages = [];
        var pendingMulticastMessages = [];

        var UDP_CREATED = false;

        var UDP_MULTICAST_CREATED = false;

        var networkInterfaces = [];

        /**
         * DEAD CODE
         * @param resolve
         * @param port
         */
        function createTCPSocket(resolve, port) {
            log("Hitting DEAD CODE!");
        }

        /**
         * DEAD CODE
         * @param resolve
         * @param port
         */
        function createMulticastTCPSocket(resolve, port) {
            log("Hitting DEAD CODE!");
        }

        /**
         * Helper function to get the network interface object
         * for a given an IP assigned to the current host.
         * @param ip
         * @returns {*}
         */
        function getNetworkInterfaceForIP(ip) {
            var result;
            networkInterfaces.forEach(function (ni) {
                if (ni.ip == ip) {
                    result = ni;
                }
            });
            return result;
        }

        /**
         * Checks if there is a socket of for the given port and protocol.
         * @param protocol
         * @param port
         * @returns {boolean}
         */
        function hasSocket(protocol, port) {
            var result = false;
            sockets[protocol].forEach(function (socket) {
                if (socket.protocol == protocol &&
                        socket.port == port) {
                    result = true;
                }
            });
            return result;
        }

        /**
         * Sets the flag that indicates that a UDP socket was created.
         * @param value
         */
        function setUDPCreatedFlag(value) {
            debug("Setting up flag for UDP socket creation");
            if (!value) {
                UDP_CREATED = value;
                UDP_MULTICAST_CREATED = value;
                return;
            }

            debug("We have the following messages");
            pendingMessages.forEach(function (msg) {
                log("", msg);
            });

            UDP_CREATED = value;
            UDP_MULTICAST_CREATED = value;

            pendingMessages.forEach(function (msg) {
                sendUDPMessage(msg.ip, msg.port, msg);
            });

            pendingMulticastMessages.foreach(function(msg){
                sendMulticastMessage(msg.ip, msg.port, msg, msg.callback);
            })
        }

        /**
         *
         * @param error
         * @param step
         * @param data
         */
        function handleSocketCreationError(error, step, data) {

            var msg = "Error [" + error + "]: ";

            switch (step) {
                case 1:
                    msg = msg + "Socket could not be created.";
                    break;
                case 2:
                    msg = msg + "Socket Multicast TTL could not be set.";
                    break;
                case 3:
                    msg = msg + "Loopback mode could not be set.";
                    break;
                case 4:
                    msg = msg + "Socket bind could not be performed.";
                    break;
                case 5:
                    msg = msg + "Multicast group could not be joined.";
                    break;
            }

            log(msg);

            if (data) {
                log("Extra data: " + JSON.stringify(data));
            }

        }

        function createMuticastUDPSocket(resolve, port, onReceive) {

            // Create the Socket
            chrome.sockets.udp.create({}, function (socketInfo) {

                if (socketInfo.socketId < 0) {
                    handleSocketCreationError(socketInfo.socketId, 1, socketInfo);
                    return;
                }
                var socketId = socketInfo.socketId;
                var localIp = "0.0.0.0";

                // Set multicast TTL
                chrome.sockets.udp.setMulticastTimeToLive(socketId, 12, function (result) {

                    if (result < 0) {
                        handleSocketCreationError(result, 2);
                        return;
                    }

                    // Set onReceive callback
                    chrome.sockets.udp.onReceive.addListener(onReceive);

                    // Disable loopback on multicast
                    chrome.sockets.udp.setMulticastLoopbackMode(socketId, false, function (result) {

                        if (result < 0) {
                            handleSocketCreationError(result, 3);
                            return;
                        }

                        // Bind the socket to the desired port
                        chrome.sockets.udp.bind(socketId, localIp, port, function (result) {

                            if (result < 0) {
                                handleSocketCreationError(result, 4);
                                return;
                            }

                            var socket = new Socket(socketId, port, UDP_TYPE);
                            sockets[UDP_TYPE].push(socket);
                            multicastSocket = socket;

                            // Join the multicast group where replication occurs
                            chrome.sockets.udp.joinGroup(socketId, multicastIp, function (result) {

                                if (result < 0) {
                                    handleSocketCreationError(result, 5);
                                    return;
                                }

                                resolve(localIp);

                                // Debugging: list the multicast groups joined
                                chrome.sockets.udp.getJoinedGroups(socketId, function (val) {
                                    console.log("[" + socketId + "] joined groups for ip " + multicastIp + " [sockeId:" + socketId + "]");
                                    console.log(val);
                                });

                            });

                        });

                    });
                });
            });
        }

        /**
         *
         * @param resolve
         * @param type
         * @param port
         * @param onReceive
         */
        function createMulticastSocket(resolve, type, port, onReceive) {

            if (type == TCP_TYPE) {
                createMulticastTCPSocket(resolve, port);
            } else if (type == UDP_TYPE) {
                createMuticastUDPSocket(resolve, port, onReceive);
            } else {
                log("Error: Multicast socket type not identified.");
            }

        }

        /**
         * Send simple UDP message to the given ip:port
         * @param ip
         * @param port
         * @param arrayBuffer
         */
        function sendUDPMessage(ip, port, m) {

            var stringMsg = JSON.stringify(m.content);
            var arrayBuffer = MessageEncoder.str2ab(stringMsg);

            /**
             * TODO: add code to select the right socket.
             * For now, everything through the multicast socket.
             * @type {*}
             */
            var socket = multicastSocket;

            chrome.sockets.udp.send(socket.id, arrayBuffer, ip, port, function (sendInfo) {
                debug("Message [" + msg.msg + "] sent to [" + ip + ":" + port + "] through socket with id [" + socket.id + "]");
                debug("Send Info is:" + sendInfo.resultCode);
            });
        }

        /**
         *
         * @param multicastIp
         * @param port
         * @param messageObj Message
         * @param callback
         */
        function sendMulticastMessage(multicastIp, port, messageObj, callback) {

            var arrayBuffer = messageObj.getPreparedContent();

            var cb;
            if (messageObj.callback){
                cb = messageObj.callback;
            }else{
                cb = callback;
            }

            chrome.sockets.udp.send(multicastSocket.id, arrayBuffer, multicastIp, port, cb);
        }


        return {

            TCP_TYPE: TCP_TYPE,
            UDP_TYPE: UDP_TYPE,

            getNetworkInterfaces: function () {
                return networkInterfaces;
            },

            /**
             * Send message to
             * @param ip
             * @param port
             * @param type
             * @param msg
             * @returns {boolean}
             */
            sendUDPMessage: function (ip, port, msg) {

                var m = new Message(type, msg);

                if (UDP_CREATED == false) {
                    debug("Trying to send message, but no UDP socket created. Queueing the message.");
                    m.ip = ip;
                    m.port = port;
                    pendingMessages.push(m);
                    return false;
                }

                debug("Sending inline, not delayed.");

                sendUDPMessage(ip, port, m);

                return true;
            },

            /**
             * Send multicast message over UDP
             *
             * @param multicastIp
             * @param port
             * @param messageObj
             * @param callback
             */
            sendMulticastMessage: function (multicastIp, port, messageObj, callback) {

                if (UDP_CREATED == false) {
                    debug("Trying to send multicast message, but no UDP socket created. Queueing the message.");
                    messageObj.ip = ip;
                    messageObj.port = port;
                    messageObj.callback = callback;
                    pendingMulticastMessages.push(messageObj);
                    return false;
                }

                debug("Sending inline, not delayed.");

                sendMulticastMessage(multicastIp, port, messageObj, callback);

                return true;
            },

            /**
             * Create a multicast socket over the given protocol, port and
             * call the callback onReceive when new data is available.
             * @param type
             * @param port
             * @param onReceive
             */
            createMulticastSocket: function (type, port, onReceive) {

                debug("Creating socket with type[" + type + "] and port[" + port + "]");

                var checkUDPSocketCreation = function (ip) {
                    debug("Created socket for IP: " + ip);

                    var allCreated = true;

                    if (!hasSocket(UDP_TYPE, port)) {
                        allCreated = false;
                    }

                    if (allCreated) {
                        debug("All network interfaces DO have a socket of type[" + type + "]");
                        setUDPMulticastCreatedFlag(true);
                    } else {
                        debug("All network interfaces DO NOT have a socket of type[" + type + "]");
                    }

                }

                createMulticastSocket(checkUDPSocketCreation, type, port, onReceive);
            },

            /**
             * Load network interfaces and call resolve when all loaded.
             * @param resolve
             */
            loadNetworkInterfaces: function (resolve) {

                chrome.system.network.getNetworkInterfaces(function (ni) {
                    debug("We got the network interfaces.");

                    ni.forEach(function (el) {
                        var regEx = new RegExp('^[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*$');
                        if (regEx.test(el.address) == true) {
                            networkInterfaces[networkInterfaces.length] = new NetworkInterface(el.address, el.prefixLength, el.name);
                            debug(networkInterfaces[networkInterfaces.length - 1]);
                        }
                    });

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



