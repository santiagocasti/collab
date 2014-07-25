function PeerIdentity(ip, ri) {
    this.ipAddress = ip;
    this.replicaIdentity = ri;
}

PeerIdentity.prototype.getId = function () {
    return this.replicaIdentity.getId();
}

PeerIdentity.prototype.getTimestamp = function () {
    return this.replicaIdentity.getTimestamp();
}

PeerIdentity.prototype.getReplicaIdentityString = function () {
    return this.replicaIdentity.toString();
}

PeerIdentity.prototype.getIpAddress = function () {
    return this.ipAddress;
}


if (typeof module != 'undefined') {
    module.exports = PeerIdentity;
}