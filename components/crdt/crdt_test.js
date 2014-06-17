'use strict';
describe("CRDTs counters ", function () {

    it("can be initialized with an empty value", function () {

        // create an empty counter
        var c = CRDT.newCounter(1, {}, {});
        var repId = "5f43df3ed3.123123";

        // check that the count is 0
        expect(c.getCount()).toEqual(0);

        // increment the counter
        c.increment(repId);

        // check that the count increases
        expect(c.getCount()).toEqual(1);

        c.decrement(repId);

        expect(c.getCount()).toEqual(0);

        var jsonString = c.toJSON();

        // check that the JSON representation is correct
        expect(jsonString).toEqual('{"increment":{"'+repId+'":1},"decrement":{"'+repId+'":1}}');

        // create a new counter from the JSON produced by the first counter
        var c2 = CRDT.newCounterFromJSON(1, JSON.parse(jsonString));

        // check that the count still matches
        expect(c2.getCount()).toEqual(c.getCount());
        expect(c2.getIncrementCountByReplicaId(repId)).toEqual(1);
        expect(c2.getDecrementCountByReplicaId(repId)).toEqual(1);
        expect(c2.getCount()).toEqual(0);

    });

    it("support increments and decrements from different replicas", function () {

        var c = CRDT.newCounter(1, {}, {});

        // replica IDs
        var repIdA = "123123.545234";
        var repIdB = "1de2d2dw2.123123";
        var repIdC = "6456dfsdfsdf.34234234";

        c.increment(repIdA);

        expect(c.getCount()).toEqual(1);

        c.decrement(repIdB);

        expect(c.getCount()).toEqual(0);

        c.increment(repIdB);

        expect(c.getCount()).toEqual(1);

        c.increment(repIdC);

        expect(c.getCount()).toEqual(2);

        var jsonString = c.toJSON();

        expect(JSON.parse(jsonString)['increment'][repIdA]).toEqual(1);
        expect(JSON.parse(jsonString)['increment'][repIdB]).toEqual(1);
        expect(JSON.parse(jsonString)['increment'][repIdC]).toEqual(1);

        expect(JSON.parse(jsonString)['decrement'][repIdA]).toEqual(0);
        expect(JSON.parse(jsonString)['decrement'][repIdB]).toEqual(1);
        expect(JSON.parse(jsonString)['decrement'][repIdC]).toEqual(0);

        c.increment(repIdA);
        c.increment(repIdB);
        c.increment(repIdC);

        expect(c.getCount()).toEqual(5);

        jsonString = c.toJSON();

        expect(JSON.parse(jsonString)['increment'][repIdA]).toEqual(2);
        expect(JSON.parse(jsonString)['increment'][repIdB]).toEqual(2);
        expect(JSON.parse(jsonString)['increment'][repIdC]).toEqual(2);

        c.decrement(repIdA);

        expect(c.getCount()).toEqual(4);

        c.decrement(repIdC);

        expect(c.getCount()).toEqual(3);

    });

    it("support merge of different counters", function () {

        function assertMergeBothWays(c1, c2, n) {

            var jsonString = c1.toJSON();
            var parsedJSON = JSON.parse(jsonString);
            var originalC1 = CRDT.newCounterFromJSON(1, parsedJSON);

            c1.merge(c2);

            expect(c1.getCount()).toEqual(n);

            c2.merge(originalC1);

            expect(c2.getCount()).toEqual(n);
        }

        var c1 = CRDT.newCounter(1, {}, {});
        var c2 = CRDT.newCounter(1, {}, {});

        var repId1 = "123123.1231231";
        var repId2 = "5345345.4523434";
        var repIdBoth = "342353.634234";

        c1.increment(repId1);
        c2.increment(repId2);

        c1.increment(repIdBoth);
        c2.increment(repIdBoth);

        // c1 = 2 and c2 = 2, but they have one disjoint repId
        assertMergeBothWays(c1, c2, 3);

        c1.increment(repId2);

        // c1 = 3 and c2 = 2, but c1 has all the repIds and c2 not
        assertMergeBothWays(c1, c2, 4);

        c1.decrement(repId2);

        assertMergeBothWays(c1, c2, 3);

        c2.increment(repId2);

        // c2 = 3 and c1 = 3, but c2 has the counter for one replica bigger than c1
        assertMergeBothWays(c1, c2, 4);

        c1.increment(repId1);

        // c1 = 4 and c2 = 4, but they have different values in shared and not shared repIds
        assertMergeBothWays(c1, c2, 5);

    });

    it("allow access to the replica counts", function () {

        var c = CRDT.newCounter(1, {}, {});
        var repId = "555.5121231";

        // no value for replica ID given
        expect(c.getIncrementCountByReplicaId(repId)).toEqual(false);

        // empty array of replica Ids
        expect(c.getReplicaIds()).toEqual([]);

        // check the counter does not track the replica
        expect(c.tracks(repId)).toEqual(false);

        // let the magic happen :)
        c.increment(repId);

        // it incremented the count for this replicaId
        expect(c.getIncrementCountByReplicaId(repId)).toEqual(1);

        // it has the replica Id
        expect(c.getReplicaIds()).toEqual([repId]);

        // it tracks this replica
        expect(c.tracks(repId)).toEqual(true);

    });

    it("allow comparison of counters", function () {
        //TODO: write test when the logic is properly defined
    });

    it("purge the old counts of replicas", function (){
        var c = CRDT.newCounter(1, {}, {});
        var id = "123123123";
        var ts = new Date().getTime();
        var ri = ReplicaIdentity.new(id, ts);

        var oldId = ri.toString();
        c.increment(oldId);

        expect(c.tracks(oldId)).toBe(true);

        ri = ReplicaIdentity.new(id, ts+1);
        var newId = ri.toString();
        var c2 = CRDT.newCounter(1, {}, {});

        c2.increment(newId);

        expect(c.tracks(oldId)).toBe(true);
        expect(c2.tracks(newId)).toBe(true);

        console.log("C before: "+ c.toJSON());
        c.merge(c2);
        console.log("C after: "+ c.toJSON());

        expect(c.tracks(newId)).toBe(true);
        expect(c.tracks(oldId)).toBe(false);

        c = CRDT.newCounter(1, {}, {});
        c2 = CRDT.newCounter(1, {}, {});

        c.decrement(oldId);

        expect(c.tracks(oldId)).toBe(true);

        c2.decrement(newId);

        expect(c.tracks(oldId)).toBe(true);
        expect(c2.tracks(newId)).toBe(true);

        c.merge(c2);

        expect(c.tracks(newId)).toBe(true);
        expect(c.tracks(oldId)).toBe(false);
    });

});