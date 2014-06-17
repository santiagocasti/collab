var DirectReplicationProtocol = (function () {
    const PORT = 2345;

    const DIRECT_REQUEST = 201;
    const DIRECT_RESPONSE = 202;

    return {
        Port: PORT,
        PayloadTypes: {
            REQUEST: DIRECT_REQUEST,
            RESPONSE: DIRECT_RESPONSE
        },

        IsValidPayloadType: function (pt) {
            switch (parseInt(pt)) {
                case DIRECT_REQUEST:
                case DIRECT_RESPONSE:
                    return true;
                    break;
                default:
                    return false;
            }
        }
    }
})();

/**
 * ReplicationP - Replication Protocol constants
 */
var ReplicationProtocol = (function () {

    const COUNTER_PAYLOAD = 101;
    const IDENTITY_PAYLOAD = 102;

    const PORT = 1234;
    const MULTICAST_IP = "237.132.123.123";

    return{
        Port: PORT,

        MulticastIP: MULTICAST_IP,

        PayloadTypes: {
            COUNTER: COUNTER_PAYLOAD,
            IDENTITY: IDENTITY_PAYLOAD
        },

        IsValidPayloadType: function (pt) {
            switch (parseInt(pt)) {
                case COUNTER_PAYLOAD:
                case IDENTITY_PAYLOAD:
                    return true;
                    break;
                default:
                    return false;
            }
        }
    }
})();

var MessagePayload = (function () {

    function init(t, oId, c) {
        var type = t;
        var objectId = oId;
        var content = c;

        return {
            getType: function () {
                return type;
            },

            getObjectId: function () {
                return objectId;
            },

            getContent: function () {
                return content;
            },

            toJSON: function () {
                var obj = {};
                obj.type = type;
                obj.objectId = objectId;
                obj.content = content;
                return JSON.stringify(obj);
            }
        }
    }

    function reconstructFromObject(obj) {

        var type, objectId, content;
        if (obj.type) {
            type = obj.type;
        }
        if (obj.objectId) {
            objectId = obj.objectId;
        }
        if (obj.content) {
            content = obj.content;
        }

        return init(type, objectId, content);
    }

    return {
        new: function (type, objectId, content) {
            return init(type, objectId, content);
        },
        reconstruct: function (jsonString) {
            return reconstructFromObject(jsonString);
        }
    }

})();

/**
 * Message class
 */
var Message = (function () {

    const MESSAGE_IN = 501;
    const MESSAGE_OUT = 502;

    function init(t, p) {

        var type = t;
        var payload = p;

        return {
            getPreparedContent: function () {
                var strPayload = payload.toJSON();
                return MessageEncoder.str2ab(strPayload);
            },

            getType: function () {
                return type;
            },

            getPayload: function () {
                return payload;
            },

            log: function () {
                log("type: " + type);
                log("payload: " + payload.toJSON(), payload);
            }
        }
    }

    return{

        CreateFromRawData: function (type, rawMessage) {
            var payload = MessageEncoder.ab2str(rawMessage);
            return init(type, MessagePayload.reconstruct(JSON.parse(payload)));
        },

        Create: function (type, payload) {
            return init(type, payload);
        },

        Types: {
            IN: MESSAGE_IN,
            OUT: MESSAGE_OUT
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
        return ReplicationProtocol.MulticastIP;
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

    function init() {

        var multicastSocket;
        var tcpServerSockets = [];
        var replicationRequestTCPSockets = [];

        // initialize sockets array
//        var sockets = [];
//        sockets[TCP_TYPE] = [];
//        sockets[UDP_TYPE] = [];

        var pendingMessages = [];
        var pendingMulticastMessages = [];

//        var UDP_CREATED = false;

        var UDP_MULTICAST_CREATED = false;

        var networkInterfaces = [];

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
         *
         * @param protocol
         * @param port
         * @returns {boolean}
         */
        function hasMulticastSocket(protocol, port) {

            if (protocol !== UDP_TYPE &&
                    port !== ReplicationProtocol.Port) {
                log("Multicast socket not created");
                return false;
            } else if (typeof multicastSocket !== 'undefined') {
                log("Multicast socket was created");
                log("Typeof multicasSocket ", multicastSocket);
                return true;
            }
        }


        /**
         * Sets the flag that indicates that a UDP socket was created.
         * @param value
         */
        function setMulticastUDPCreatedFlag(value) {
            debug("Setting up flag for UDP socket creation");
            if (!value) {
                UDP_MULTICAST_CREATED = value;
                return;
            }

            pendingMulticastMessages.forEach(function (msg) {
                log("Multicast message", msg);
                log(msg.toString());
            });

            UDP_MULTICAST_CREATED = value;

            pendingMulticastMessages.forEach(function (msg) {
                sendMulticastMessage(msg.ip, msg.port, msg, msg.callback);
            });

            pendingMulticastMessages = [];
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
                case 6:
                    msg = msg + "No delay could not be set.";
                    break;
                case 7:
                    msg = msg + "Could not set paused.";
                    break;
                case 8:
                    msg = msg + "Could not connect socket.";
                    break;
            }

            log(msg);

            if (data) {
                log("Extra data: " + JSON.stringify(data));
            }

        }


        function sendMessageThroughNewSocket(peerIp, peerPort, messageObj) {


            chrome.sockets.tcp.create({}, function (socketInfo) {

                var socketId = socketInfo.socketId;

                replicationRequestTCPSockets.push(socketId);

                if (socketId < 0) {
                    handleSocketCreationError(socketId, 1, socketInfo);
                    return;
                }

//                chrome.sockets.tcp.setNoDelay(socketId, false, function (result) {

//                    if (result < 0) {
//                        handleSocketCreationError(result, 6, socketInfo);
//                        return;
//                    }

                    chrome.sockets.tcp.setPaused(socketId, false, function (result) {

                        if (result < 0) {
                            handleSocketCreationError(result, 7, socketInfo);
                            return;
                        }

                        chrome.sockets.tcp.connect(socketId, peerIp, peerPort, function () {

                            if (result < 0) {
                                handleSocketCreationError(result, 8, socketInfo);
                                return;
                            }

                            var arrayBuffer = messageObj.getPreparedContent();

                            chrome.sockets.tcp.send(socketId, arrayBuffer, function (sendInfo) {
                                debug("Message sent through TCP socket: " + messageObj.getPayload().toJSON(), messageObj);
                            });

                        });


                    });
//
//
//                });

            });
        }

        /**
         * @param port
         * @param onReceive
         */
        function createTCPServerSocket(resolve, ip, port) {

            log("Creating TCP Socket on [" + ip + ":" + port + "] ");

            chrome.sockets.tcpServer.create({}, function (socketInfo) {

                var socketId = socketInfo.socketId;

                if (socketId < 0) {
                    handleSocketCreationError(socketId, 1, socketInfo);
                    return;
                }

                chrome.sockets.tcpServer.listen(socketId, ip, port, function (result) {

                    if (result < 0) {
                        handleSocketCreationError(result, 6, socketInfo);
                        return;
                    }

                    debug("TCP Server socket listening on " + ip + ":" + port + "...");

                    resolve();

                });
            });


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

//                            var socket = new Socket(socketId, port, UDP_TYPE);
//                            sockets[UDP_TYPE].push(socket);
                            multicastSocket = new Socket(socketId, port, UDP_TYPE);

                            // Join the multicast group where replication occurs
                            chrome.sockets.udp.joinGroup(socketId, ReplicationProtocol.MulticastIP, function (result) {

                                if (result < 0) {
                                    handleSocketCreationError(result, 5);
                                    return;
                                }

                                resolve(localIp);

                                // Debugging: list the multicast groups joined
                                chrome.sockets.udp.getJoinedGroups(socketId, function (val) {
                                    debug("[" + socketId + "] joined groups for ip " + ReplicationProtocol.MulticastIP + " [sockeId:" + socketId + "]");
                                    debug(val);
                                });

                            });

                        });

                    });
                });
            });
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
            if (messageObj.callback) {
                cb = messageObj.callback;
            } else {
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
//            sendUDPMessage: function (ip, port, msg) {
//
//                var m = new Message(type, msg);
//
//                if (UDP_CREATED == false) {
//                    debug("Trying to send message, but no UDP socket created. Queueing the message.");
//                    m.ip = ip;
//                    m.port = port;
//                    pendingMessages.push(m);
//                    return false;
//                }
//
//                debug("Sending inline, not delayed.");
//
//                sendUDPMessage(ip, port, m);
//
//                return true;
//            },

            /**
             * Send multicast message over UDP
             *
             * @param multicastIp
             * @param port
             * @param messageObj
             * @param callback
             */
            sendMulticastMessage: function (multicastIp, port, messageObj, callback) {

                if (!hasMulticastSocket(UDP_TYPE, port)) {
                    debug("Trying to send multicast message, but no multicast UDP socket created. Queueing the message.");
                    messageObj.ip = multicastIp;
                    messageObj.port = port;
                    messageObj.callback = callback;
                    debug("Pushed this message to pending messages:", JSON.stringify(messageObj));
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
            createMulticastSocket: function (port, onReceive) {

                debug("Creating UDP Multicast socket on port[" + port + "]");

                var checkUDPSocketCreation = function () {
                    debug("Created multicast UDP socket on [" + port + "].");
                    setMulticastUDPCreatedFlag(true);
                }

                createMuticastUDPSocket(checkUDPSocketCreation, port, onReceive);
            },


//            createSocket: function (type, port, onReceive) {
//                debug("Creating socket with type[" + type + "] and port[" + port + "]");
//
//                createTCPSocket(port, onReceive);
//            },


            createTCPServerSockets: function (onReceive) {

                var onAccept = function (info) {
                    var socketId = info.socketId;
                    var clientSocketId = info.clientSocketId;

                    debug("Connection on socket [" + socketId + "] accepted. Should reply through socket [" + clientSocketId + "]", info);

                    // should unpause the socket
                    chrome.sockets.tcp.setPaused(clientSocketId, false, function () {
                        debug("Socket unpaused.");
                    });
                };

                chrome.sockets.tcpServer.onAccept.addListener(onAccept);

                var onReceive_tpZ9u193HAY9 = function (data){

                    var socketId = data.socketId;
                    var msg = Message.CreateFromRawData(Message.Types.IN, data.data);



                    onReceive(msg, socketId);
                };

                chrome.sockets.tcp.onReceive.addListener(onReceive_tpZ9u193HAY9);

                var tcpServerSocketCreated = function () {
                    if (networkInterfaces.length == tcpServerSockets.length) {
                        debug("All TCP server sockets created.");
                    }
                };

                networkInterfaces.forEach(function (ni) {
                    createTCPServerSocket(tcpServerSocketCreated, ni.ip, DirectReplicationProtocol.Port);
                });

            },


            sendMessageThroughNewSocket: function (peerIp, peerPort, msg) {
                sendMessageThroughNewSocket(peerIp, peerPort, msg);
            },

            /**
             * Load network interfaces and call resolve when all loaded.
             * @param resolve
             */
            loadNetworkInterfaces: function (resolve) {

                chrome.system.network.getNetworkInterfaces(function (ni) {
                    debug("We got the network interfaces.");

                    var identityString = "";

                    ni.forEach(function (el) {
                        var regEx = new RegExp('^[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*$');
                        if (regEx.test(el.address) == true) {
                            networkInterfaces[networkInterfaces.length] = new NetworkInterface(el.address, el.prefixLength, el.name);
                            identityString += "|" + el.address;
                        }
                    });

                    log("IdentityString: " + identityString);

                    var identity = ReplicaIdentity.new(identityString.hashCode(), new Date().getTime());
                    var c = Context.getInstance();

                    c.setReplicaIdentity(identity);

                    log("After hashing: " + identity.toString());

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



