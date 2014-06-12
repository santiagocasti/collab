'use strict';
describe("CRDTs counters ", function () {

    it("can be initialized with an empty value", function () {

        // create an empty counter
        var c = CRDT.newCounter(1, {}, {});
        var repId = "asd";

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
        expect(jsonString).toEqual('{"increment":{"asd":1},"decrement":{"asd":1}}');

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

        // replica IDs can be any string
        var repIdA = "asd";
        var repIdB = "1";
        var repIdC = "0.6";

        c.increment(repIdA);

        expect(c.getCount()).toEqual(1);

        c.decrement(repIdB);

        expect(c.getCount()).toEqual(0);

        c.increment(repIdB);

        expect(c.getCount()).toEqual(1);

        c.increment(repIdC);

        expect(c.getCount()).toEqual(2);

        var jsonString = c.toJSON();

        console.log(jsonString);

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
        var c1 = CRDT.newCounter(1, {}, {});
        var c2 = CRDT.newCounter(1, {}, {});


        function assertMergeBothWays(c1, c2, n) {
            var c1MergeC2 = c1.merge(c2);

            expect(c1MergeC2.getCount()).toEqual(n);

            var c2MergeC1 = c2.merge(c1);

            expect(c2MergeC1.getCount()).toEqual(n);
        }


        var repId1 = "123";
        var repId2 = "asd";
        var repIdBoth = "sdf";

        c1.increment(repId1);
        c2.increment(repId2);

        c1.increment(repIdBoth);
        c2.increment(repIdBoth);

        // c1 = 2 and c2 = 2, but they have one disjoint repId
        assertMergeBothWays(c1, c2, 3);

        c1.increment(repId2);

        // c1 = 3 and c2 = 2, but c1 has all the repIds and c2 not
        assertMergeBothWays(c1, c2, 3);

        c1.decrement(repId2);

        assertMergeBothWays(c1, c2, 2);

        c2.increment(repId2);

        // c2 = 3 and c1 = 3, but c2 has the counter for one replica bigger than c1
        assertMergeBothWays(c1, c2, 3);

        c1.increment(repId1);

        // c1 = 4 and c2 = 4, but they have different values in shared and not shared repIds
        assertMergeBothWays(c1, c2, 4);

    });

    it("allow access to the replica counts", function () {

        var c = CRDT.newCounter(1, {}, {});
        var repId = "asd";

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


});