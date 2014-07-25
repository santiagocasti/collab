'use strict';
describe("Context ", function () {

    it("keeps track of peers", function () {

        var c = Context.getInstance();

        var id = "123123123";
        var ts = 123123123;
        var ip = "192.168.1.1";

        var ri = ReplicaIdentity.new(id, ts);
        var pi = new PeerIdentity(ip, ri);

        c.addPeer(pi);

        var oldRi = ri.toString();
        var oldPi = c.getPeer(oldRi);

        expect(oldPi).not.toBe(false);

        var oldRi = ri.toString();
        ri = ReplicaIdentity.new(id, ts + 1);
        pi = new PeerIdentity(ip, ri);


        c.addPeer(pi);

        expect(c.getPeer(ri.toString())).not.toBe(false);
        expect(c.getPeer(oldRi)).toBe(false);
    });

});
 
