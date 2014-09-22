/**
 * NetworkInterface class
 * @param ip
 * @param netmask
 * @param name
 * @constructor
 */
function NetworkInterface(ip, netmask, name) {

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