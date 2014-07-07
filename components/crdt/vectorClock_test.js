'use strict';
describe("Vector Clocks", function () {

    it(" support multiple keys, and track counts individually.", function () {

        var idA = "123123123";
        var idB = "lk3j1h23lkj1h";
        var idC = "kj23lkjh3l41";

        var identityA = ReplicaIdentity.new(idA.hashCode(), new Date().getTime());
        var identityB = ReplicaIdentity.new(idB.hashCode(), new Date().getTime());
        var identityC = ReplicaIdentity.new(idC.hashCode(), new Date().getTime());

        var data = {};
        var vc = VectorClock.new(data);
        var identityACount = 0, identityBCount = 0, identityCCount = 0;
        var totalCount = 0;

        // assert initial state
        expect(vc.tracks(identityA.toString())).toBe(false);
        expect(vc.getCount(identityA.toString())).toBe(false);
        expect(vc.getTotalCount()).toBe(totalCount);

        // increment for the first time
        vc.increment(identityA.toString());
        identityACount++;
        totalCount++;

        // assert the first time
        expect(vc.tracks(identityA.toString())).toBe(true);
        expect(vc.getCount(identityA.toString())).toBe(identityACount);
        expect(vc.getTotalCount()).toBe(totalCount);

        // increment for the second time
        vc.increment(identityA.toString());
        identityACount++;
        totalCount++;

        // assert for the second time
        expect(vc.getCount(identityA.toString())).toBe(identityACount);
        expect(vc.getTotalCount()).toBe(totalCount);

        vc.increment(identityB.toString());
        identityBCount++;
        totalCount++;

        // assert values with two counters
        expect(vc.getCount(identityA.toString())).toBe(identityACount);
        expect(vc.getCount(identityB.toString())).toBe(identityBCount);
        expect(vc.getTotalCount()).toBe(totalCount);

        // increment a third counter
        vc.increment(identityC.toString());
        identityCCount++;
        totalCount++;

        // assert values with three counters
        expect(vc.getCount(identityA.toString())).toBe(identityACount);
        expect(vc.getCount(identityB.toString())).toBe(identityBCount);
        expect(vc.getCount(identityC.toString())).toBe(identityCCount);
        expect(vc.getTotalCount()).toBe(totalCount);

    });

    it(" can return the keys of the vector.", function () {

        function checkKeys(given, expected) {

            given.sort();
            expected.sort();

            given.forEach(function (element, index) {
                expect(expected[index]).toBe(element);
            });
        }

        var idA = "123123123";
        var idB = "lk3j1h23lkj1h";
        var idC = "kj23lkjh3l41";

        var identityA = ReplicaIdentity.new(idA.hashCode(), new Date().getTime());
        var identityB = ReplicaIdentity.new(idB.hashCode(), new Date().getTime());
        var identityC = ReplicaIdentity.new(idC.hashCode(), new Date().getTime());

        var data = {};
        var vc1 = VectorClock.new(data);

        // check initial state
        expect(vc1.tracks(identityA.toString())).toBe(false);
        expect(vc1.tracks(identityB.toString())).toBe(false);
        expect(vc1.tracks(identityC.toString())).toBe(false);
        checkKeys(vc1.getKeys(), []);

        // increment the counter with three different keys
        // and check the tracked keys and the returned keys

        vc1.increment(identityA.toString());
        checkKeys(vc1.getKeys(), [identityA.toString()]);
        expect(vc1.tracks(identityA.toString())).toBe(true);

        vc1.increment(identityB.toString());
        checkKeys(vc1.getKeys(), [identityA.toString(), identityB.toString()]);
        expect(vc1.tracks(identityB.toString())).toBe(true);

        vc1.increment(identityC.toString());
        checkKeys(vc1.getKeys(), [identityA.toString(), identityB.toString(), identityC.toString()]);
        expect(vc1.tracks(identityC.toString())).toBe(true);

    });

    it(" can be merged with each other, keeping the higher count per key.", function () {

        var idA = "123123123";
        var idB = "lk3j1h23lkj1h";
        var idC = "kj23lkjh3l41";

        var identityA = ReplicaIdentity.new(idA.hashCode(), new Date().getTime());
        var identityB = ReplicaIdentity.new(idB.hashCode(), new Date().getTime());
        var identityC = ReplicaIdentity.new(idC.hashCode(), new Date().getTime());

        var data = {};
        var vc1 = VectorClock.new(data);
        var vc2 = VectorClock.new(data);
        var identityACount = 0, identityBCount = 0, identityCCount = 0;
        var totalCount = 0;

        expect(vc1.getTotalCount()).toBe(totalCount);
        expect(vc2.getTotalCount()).toBe(totalCount);
        var vcMerge = vc1.merge(vc2);
        expect(vcMerge.getTotalCount()).toBe(totalCount);

        vc1.increment(identityA.toString());
        vc2.increment(identityA.toString());
        identityACount++;
        totalCount++;

        vcMerge = vc1.merge(vc2);
        expect(vcMerge.getTotalCount()).toBe(totalCount);
        vcMerge = vc2.merge(vc1);
        expect(vcMerge.getTotalCount()).toBe(totalCount);

        vc1.increment(identityB.toString());
        vc2.increment(identityC.toString());
        totalCount += 2;
        identityBCount++;
        identityCCount++;

        vcMerge = vc1.merge(vc2);
        expect(vcMerge.getTotalCount()).toBe(totalCount);
        expect(vcMerge.getCount(identityA.toString())).toBe(identityACount);
        expect(vcMerge.getCount(identityB.toString())).toBe(identityBCount);
        expect(vcMerge.getCount(identityC.toString())).toBe(identityCCount);

        vcMerge = vc2.merge(vc1);
        expect(vcMerge.getTotalCount()).toBe(totalCount);
        expect(vcMerge.getCount(identityA.toString())).toBe(identityACount);
        expect(vcMerge.getCount(identityB.toString())).toBe(identityBCount);
        expect(vcMerge.getCount(identityC.toString())).toBe(identityCCount);

    });

    it(" can purge the data on the vector based on a specific type of identifier.", function () {

        var idA = "123123123";

        var ts = new Date().getTime();
        var identityA1 = ReplicaIdentity.new(idA.hashCode(), ts);
        var identityA2 = ReplicaIdentity.new(idA.hashCode(), ts + 1);
        var identityA3 = ReplicaIdentity.new(idA.hashCode(), ts + 1123123);

        var data = {};
        var vc1 = VectorClock.new(data);
        var totalCount = 0;

        vc1.increment(identityA1.toString());
        totalCount++;
        expect(vc1.tracks(identityA1.toString())).toBe(true);
        expect(vc1.getTotalCount()).toBe(totalCount);


        vc1.increment(identityA2.toString());
        totalCount++;
        expect(vc1.tracks(identityA2.toString())).toBe(true);
        expect(vc1.getTotalCount()).toBe(totalCount);

        // in this step we eliminate the first increment cause it's from an older timestamp
        vc1.purge();
        totalCount--;
        expect(vc1.tracks(identityA1.toString())).toBe(false);
        expect(vc1.getTotalCount()).toBe(totalCount);

        vc1.increment(identityA3.toString());
        totalCount++;
        expect(vc1.tracks(identityA3.toString())).toBe(true);
        expect(vc1.getTotalCount()).toBe(totalCount);

        // in this step we eliminate the first increment cause it's from an older timestamp
        vc1.purge();
        totalCount--;
        expect(vc1.tracks(identityA2.toString())).toBe(false);
        expect(vc1.getTotalCount()).toBe(totalCount);
    });

    it(" can be initialized with the json string from another counter.", function () {


        function compare(vc1, vc2){

            expect(vc1.getTotalCount()).toBe(vc2.getTotalCount());

            var keys = vc1.getKeys();

            keys.forEach(function (element){
                expect(vc2.tracks(element)).toBe(true);
                expect(vc2.getCount(element)).toBe(vc1.getCount(element));
            });

            keys = vc2.getKeys();

            keys.forEach(function (element){
                expect(vc1.tracks(element)).toBe(true);
                expect(vc1.getCount(element)).toBe(vc2.getCount(element));
            });

        }


        var idA = "QPRvP8tvxuBe";
        var idB = "Y241nvGS78R5";
        var idC = "Ue9wTxxgJtNa";

        var identityA = ReplicaIdentity.new(idA.hashCode(), new Date().getTime());
        var identityB = ReplicaIdentity.new(idB.hashCode(), new Date().getTime());
        var identityC = ReplicaIdentity.new(idC.hashCode(), new Date().getTime());

        var vc1 = VectorClock.new({});

        vc1.increment(identityA.toString());
        vc1.increment(identityB.toString());
        vc1.increment(identityC.toString());

        var json = vc1.toJSON();

        var vc2 = VectorClock.new(JSON.parse(json));

        compare(vc1, vc2);
    });
});