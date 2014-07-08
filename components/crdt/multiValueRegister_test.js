'use strict';
describe("Multi Value Registers", function () {

    function randomString(length) {
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    }

    function getRandomIdentities(numIdentities) {
        var i, result = [];
        for (i = 0; i < numIdentities; ++i) {
            var id = randomString(10).hashCode();
            var rid = ReplicaIdentity.new(id, new Date().getTime());
            result[result.length] = rid.toString();
        }
        return result;
    }

    it(" can be initialized to empty.", function () {

        var identities = getRandomIdentities(2);
        var idA = identities[0];
        var idB = identities[1];

        var r = CRDT.newRegister(1);
        var vc1 = new VectorClock({});

        // empty value
        expect(r.getValue().length).toBe(0);

        var value1 = "2k3lj4h1l2k";
        r.setValue(idA, value1);
        vc1.increment(idA);

        // only one value
        expect(r.getValue()[0]).toBe(value1);
        var values = r.getHigherValues(vc1);
        expect(values.length).toBe(1);
        expect(values[0].value).toEqual(r.getValue()[0]);

        expect(r.getMergedVectorClock()).toEqual(vc1);

        var value2 = "2kj31hl12jkkkk";
        r.setValue(idB, value2);
        vc1.increment(idB);

        expect(r.getValue()[0]).toBe(value2);
        expect(r.getMergedVectorClock()).toEqual(vc1);

    });

    it ("can be initialized with a set values, and from JSON.", function (){

        var vc1 = new VectorClock({"ASDFE#F#4rfq34j": 1});
        var vc2 = new VectorClock({"AD@2k3j4h2k3jh": 1});

        var value1 = "12lkj31h2lk";
        var value2 = "#$#$%34k32j4l1kj";

        var data = [
            new RegisterValue(vc1, value1),
            new RegisterValue(vc2, value2)
        ];

        var r = new MVRegister(1, data);

        expect(r.getValue().length).toBe(2);
        expect(r.getValue()).toContain(value1);
        expect(r.getValue()).toContain(value2);

        var jsonBag = r.toJSON();

        var r2 = CRDT.newRegisterFromJSON(1, jsonBag);

        expect(r2).toEqual(r);
    });


    it("can returned the merged vector clock as a result of all the values", function (){

        var identities = getRandomIdentities(2);
        var idA = identities[0];
        var idB = identities[1];

        var vc1 = new VectorClock({});
        var vc2 = new VectorClock({});
        var r1 = CRDT.newRegister(1);
        var r2 = CRDT.newRegister(1);

        expect(r1.getMergedVectorClock()).toEqual(vc1);

        r1.setValue(idA, "1l2kj3h1l2kj");
        vc1.increment(idA);
        expect(r1.getMergedVectorClock()).toEqual(vc1);

        r2.setValue(idB, "kjh1l2j3h1l");
        vc2.increment(idB);
        expect(r2.getMergedVectorClock()).toEqual(vc2);

        var r1merge2 = r1.merge(r2);
        vc1.increment(idB);
        expect(r1merge2.getMergedVectorClock()).toEqual(vc1);

    });

    it("can set a value overwriting whatever was before.", function (){

        var identities = getRandomIdentities(2);
        var idA = identities[0];
        var idB = identities[1];

        var vc1 = new VectorClock({});
        var value1 = "kj12l3k1jh23";
        var value2 = "k2j45h23kj4h1";

        var r = CRDT.newRegister(1);

        r.setValue(idA, value1);
        vc1.increment(idA);

        expect(r.getValue()).toContain(value1);
        expect(r.getValue().length).toBe(1);
        expect(r.getMergedVectorClock()).toEqual(vc1);

        r.setValue(idB, value2);
        vc1.increment(idB);

        expect(r.getValue()).toContain(value2);
        expect(r.getValue().length).toBe(1);
        expect(r.getMergedVectorClock()).toEqual(vc1);

    });

    it("can compare with each other.", function (){

        var identities = getRandomIdentities(3);
        var idA = identities[0];
        var idB = identities[1];

        var r1 = CRDT.newRegister(1);
        var r2 = CRDT.newRegister(1);

        var value1 = "12kj31l2kj3h";
        var value2 = "askdjahsdlkjh";

        expect(r1.compare(r2)).toBe(0);
        expect(r2.compare(r1)).toBe(0);

        r1.setValue(idA, value1);

        expect(r1.compare(r2)).toBe(1);
        expect(r2.compare(r1)).toBe(-1);

        r2.setValue(idB, value2);

        expect(r1.compare(r2)).toBe(0);
        expect(r2.compare(r1)).toBe(0);

        r1.setValue(idB, value2);

        expect(r1.compare(r2)).toBe(1);
        expect(r2.compare(r1)).toBe(-1);

        r2.setValue(idA, value1);

        expect(r1.compare(r2)).toBe(0);
        expect(r2.compare(r1)).toBe(0);

    });

    it("merge the sets of values of different registers when merging registers with concurrent changes.", function () {

        var identities = getRandomIdentities(3);
        var idA = identities[0];
        var idB = identities[1];
        var idC = identities[2];

        var r1 = CRDT.newRegister(1);
        var r2 = CRDT.newRegister(1);
        var r3 = CRDT.newRegister(1);

        // set the value on one replica
        var value1 = "123l1kj2h198djasd";
        r1.setValue(idA, value1);
        var vc1 = new VectorClock({});
        vc1.increment(idA);

        // set another value on another replica simultaneously
        var value2 = "sdklj3j12lk3j12lkj";
        r2.setValue(idB, value2);
        var vc2 = new VectorClock({});
        vc2.increment(idB);

        // make sure they are simultaneous
        expect(vc1.compare(vc2)).toBe(0);
        expect(vc2.compare(vc1)).toBe(0);

        // merge the two registers: there should be 2 values in the paiload
        var merge1with2 = r1.merge(r2);
        expect(merge1with2.getValue().length).toBe(2);
        expect(merge1with2.getValue()).toContain(value1);
        expect(merge1with2.getValue()).toContain(value2);

        var merge2with1 = r2.merge(r1);
        expect(merge2with1.getValue().length).toBe(2);
        expect(merge2with1.getValue()).toContain(value1);
        expect(merge2with1.getValue()).toContain(value2);

        // another simultaneous change on another replica
        var value3 = "askjdhl2k3jh1l2";
        r3.setValue(idC, value3);
        var vc3 = new VectorClock({});
        vc3.increment(idC);

        // Merge a register with two values with another one
        // with one and expect 3 values in total. Both ways.
        var merge3with12 = r3.merge(merge1with2);
        expect(merge3with12.getValue().length).toBe(3);
        expect(merge3with12.getValue()).toContain(value1);
        expect(merge3with12.getValue()).toContain(value2);
        expect(merge3with12.getValue()).toContain(value3);

        var merge3with21 = r3.merge(merge2with1);
        expect(merge3with21.getValue().length).toBe(3);
        expect(merge3with21.getValue()).toContain(value1);
        expect(merge3with21.getValue()).toContain(value2);
        expect(merge3with21.getValue()).toContain(value3);

    });

    it ("can return the values that are higher than a given vector value.", function (){

        var identities = getRandomIdentities(2);
        var idA = identities[0];
        var idB = identities[1];

        var r1 = CRDT.newRegister(1);
        var r2 = CRDT.newRegister(1);

        var vc = new VectorClock({});

        expect(r1.getHigherValues(vc).length).toBe(0);

        var value1 = "alwkjh1l2kj31nwd";
        r1.setValue(idA, value1);
        expect(r1.getHigherValues(vc).length).toBe(1);
        expect(r1.getValue()).toContain(value1);

        var value2 = "12kj3hlkjh3123";
        r2.setValue(idB, value2);
        expect(r2.getHigherValues(vc).length).toBe(1);
        expect(r2.getValue()).toContain(value2);

        var r1merge2 = r1.merge(r2);
        expect(r1merge2.getHigherValues(vc).length).toBe(2);
        expect(r1merge2.getValue()).toContain(value1);
        expect(r1merge2.getValue()).toContain(value2);

        vc.increment(idA);
        expect(r1merge2.getHigherValues(vc).length).toBe(2);

        vc.increment(idB);
        expect(r1merge2.getHigherValues(vc).length).toBe(0);

    });


});