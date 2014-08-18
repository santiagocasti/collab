/**
 * Network class
 */
var Network = (function () {

    // Instance stores a reference to the Singleton
    var instance;

    var TCP_TYPE = 1;
    var UDP_TYPE = 2;

    function init() {

        var multicastSockets = [];
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

        var udpCallbacks = [];

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
        function hasMulticastSocket(protocol, ip, port) {

            if (protocol !== UDP_TYPE) {
                log("Multicast socket not created");
                return false;
            } else if (typeof multicastSockets[ip + ":" + port] !== 'undefined') {
                log("Multicast socket was created");
                log("Typeof multicasSocket ", multicastSockets[ip + ":" + port]);
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

        /**
         *
         * @param socketId
         * @param messageObj
         */
        function sendMessageThroughExistingSocket(socketId, messageObj) {

            var arrayBuffer = messageObj.getPreparedContent();

            chrome.sockets.tcp.send(socketId, arrayBuffer, function (sendInfo) {
                var msgPayload = messageObj.getPayload();
                log("Sent message through socketId[" + socketId + "]: " + msgPayload.toJSON());

                chrome.sockets.tcp.close(socketId, function () {
                    log("Socket with ID [" + socketId + "] closed successfully");
                });
            });

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
                            debug("Message sent through TCP socket[" + socketId + "] : " + messageObj.getPayload().toJSON());
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

        /**
         *
         * @param resolve
         * @param ip
         * @param port
         */
        function createUDPSocket(resolve, ip, port, onReceive) {

            debug("Creating UDP Socket on [" + ip + ":" + port + "] ");

            chrome.sockets.udp.create({bufferSize: 65535}, function (socketInfo) {

                var socketId = socketInfo.socketId;

                if (socketId < 0) {
                    handleSocketCreationError(socketId, 1, socketInfo);
                    return;
                }

                addUdpSocketListener(socketId, onReceive);

                debug("Calling bind with: socketId[" + socketId + "] ip[" + ip + "] port[" + port + "]")


                chrome.sockets.udp.bind(socketId, ip, port, function (result) {

                    if (result < 0) {
                        handleSocketCreationError(result, 4, socketInfo);
                        return;
                    }

                    debug("UDP socket listening on " + ip + ":" + port + "...");

                    resolve(socketId);

                });
            });
        }

        /**
         * Send simple UDP message to the given ip:port
         * @param socketId
         * @param ip
         * @param port
         * @param m
         */
        function sendUDPMessage(socketId, ip, port, m, callbackFunction) {

            var arrayBuffer = m.getPreparedContent();

            chrome.sockets.udp.send(socketId, arrayBuffer, ip, port, function (sendInfo) {
                var msgPayload = m.getPayload();
                debug("Sent message through socketId[" + socketId + "]: " + msgPayload.toJSON(), sendInfo);
                if (typeof callbackFunction != 'undefined') {
                    callbackFunction();
                }
            });

        }


        function createMuticastUDPSocket(resolve, ip, port, onReceive) {

            // Create the Socket
            chrome.sockets.udp.create({}, function (socketInfo) {

                if (socketInfo.socketId < 0) {
                    handleSocketCreationError(socketInfo.socketId, 1, socketInfo);
                    return;
                }
                var socketId = socketInfo.socketId;

                var localIp = "0.0.0.0";
//                networkInterfaces.forEach(function(ni){
//                    var regEx = new RegExp('^192\.168\.1\.[0-9]*$');
//                    if (regEx.test(ni.ip) == true) {
//                        localIp = ni.ip;
//                        log("Setting local IP to: "+localIp);
//                    }
//                });
                log("LocalIP: " + localIp);


//                Set multicast TTL
                chrome.sockets.udp.setMulticastTimeToLive(socketId, 12, function (result) {

                    if (result < 0) {
                        handleSocketCreationError(result, 2);
                        return;
                    }

                    log("RESULT ON MULTICAST TTL WAS:" + result);

                    // Set onReceive callback
                    addUdpSocketListener(socketId, onReceive);

//                    Disable loopback on multicast
                    chrome.sockets.udp.setMulticastLoopbackMode(socketId, false, function (result) {

                        if (result < 0) {
                            handleSocketCreationError(result, 3);
                            return;
                        }

                        log("RESULT ON MULTICAST LOOPBACK MODE WAS:" + result);

                        // Bind the socket to the desired port
                        chrome.sockets.udp.bind(socketId, localIp, port, function (result) {

                            if (result < 0) {
                                handleSocketCreationError(result, 4);
                                return;
                            }

                            log("RESULT ON MULTICAST BINDING WAS:" + result);

//                            var socket = new Socket(socketId, port, UDP_TYPE);
//                            sockets[UDP_TYPE].push(socket);
                            multicastSockets[(ip + ":" + port)] = new Socket(socketId, port, UDP_TYPE);

                            // Join the multicast group where replication occurs
                            chrome.sockets.udp.joinGroup(socketId, ip, function (result) {

                                if (result < 0) {
                                    handleSocketCreationError(result, 5);
                                    return;
                                }

                                log("RESULT ON MULTICAST JOIN GROUP WAS:" + result);

                                resolve(localIp);

                                // Debugging: list the multicast groups joined
                                chrome.sockets.udp.getJoinedGroups(socketId, function (val) {
                                    debug("[" + socketId + "][" + localIp + "] joined groups for ip " + val + " [sockeId:" + socketId + "]");
                                });

                            });

                        });

                    });
                });
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

            if (typeof multicastSockets[multicastIp + ":" + port] == 'undefined') {
                log("ERROR: cannot send multicast socket because we don't have a socket for that IP-Port combination.");
                return;
            }

            var socket = multicastSockets[multicastIp + ":" + port];

            chrome.sockets.udp.send(socket.id, arrayBuffer, multicastIp, port, function (data) {

                cb();

            });
        }

        function releaseSocket(socketId, type) {

            switch (type) {
                case TCP_TYPE:
                    chrome.sockets.tcp.disconnect(socketId, function () {
                        chrome.sockets.tcp.close(socketId, function () {
                            log("TCP Socket with ID " + socketId + " closed correctly.");
                        })
                    });
                    break;
                case UDP_TYPE:
                    chrome.sockets.udp.close(socketId, function () {
                        log("UDP Socket with ID " + socketId + " closed correctly.");
                    });
                    break;
                default:
                    log("Don't know how to close socket [" + socketId + "] of type [" + type + "]");
            }
        }

        function handleUdpOnReceiveCallbacks(info) {

            udpCallbacks.forEach(function (el) {
                if (info.socketId == el.socketId) {
                    el.callback(info);
                }
            });

        }

        function addUdpSocketListener(socketId, callback) {

            var obj = {};
            obj.socketId = socketId;
            obj.callback = callback;

            udpCallbacks.push(obj);
        }


        return {

            TCP_TYPE: TCP_TYPE,
            UDP_TYPE: UDP_TYPE,

            getNetworkInterfaces: function () {
                return networkInterfaces;
            },

            getVPNIp: function () {
                var ip;
                networkInterfaces.forEach(function (el) {
                    var regEx = new RegExp('^192\.168\.1\.[0-9]*$');
                    if (regEx.test(el.ip) == true) {
                        ip = el.ip;
                    }
                });
                return ip;
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

                if (!hasMulticastSocket(UDP_TYPE, multicastIp, port)) {
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
             * @param ip
             * @param port
             * @param onReceive
             */
            createMulticastSocket: function (ip, port, onReceive) {

                debug("Creating UDP Multicast socket on port[" + port + "]");

                var checkUDPSocketCreation = function () {
                    debug("Created multicast UDP socket on [" + port + "].");
                    setMulticastUDPCreatedFlag(true);
                }

                createMuticastUDPSocket(checkUDPSocketCreation, ip, port, onReceive);
            },


            /**
             *
             * @param socketId
             * @param ip
             * @param port
             * @param msg
             * @param callback
             * @returns {boolean}
             */
            sendUDPMessage: function (socketId, ip, port, msg, callback) {

                sendUDPMessage(socketId, ip, port, msg, callback);

                return true;
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

                var onReceive_tpZ9u193HAY9 = function (data) {
                    onReceive(data.data, data.socketId);
                };

                chrome.sockets.tcp.onReceive.addListener(onReceive_tpZ9u193HAY9);

                var tcpServerSocketCreated = function () {
                    if (networkInterfaces.length == tcpServerSockets.length) {
                        debug("All TCP server sockets created.");
                    }
                };

                var comm = Communication.getInstance();
                var drProtocol = comm.getPeerRecoveryProtocol();

                createTCPServerSocket(tcpServerSocketCreated, "0.0.0.0", drProtocol.port);

            },

            setupUdpOnReceiveEvent: function () {
                chrome.sockets.udp.onReceive.addListener(handleUdpOnReceiveCallbacks);
            },

            createUDPSocket: function (ip, port, onReceive, onCreation) {

                var onCreated_Ht1shwRi6RfP = function (socketId) {
                    log("UDP Socket created successfully [" + ip + ":" + port + "]");
                    onCreation(socketId);
                };

                createUDPSocket(onCreated_Ht1shwRi6RfP, ip, port, onReceive);
            },

            sendMessageThroughNewSocket: function (peerIp, peerPort, msg) {
                sendMessageThroughNewSocket(peerIp, peerPort, msg);
            },

            sendMessageThroughExistingSocket: function (socketId, msg) {
                sendMessageThroughExistingSocket(socketId, msg);
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

                    log("Network interfaces:", networkInterfaces);

                    log("IdentityString: " + identityString);

                    var identity = ReplicaIdentity.new(identityString.hashCode(), new Date().getTime());
                    var c = Context.getInstance();

                    c.setReplicaIdentity(identity);

                    log("After hashing: " + identity.toString());

                    resolve();
                });
            },

            releaseSocket: function (socketId, type) {
                releaseSocket(socketId, type);
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



