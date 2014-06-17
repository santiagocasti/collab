'use strict';
describe("Replica identity ", function () {

    it("can be constructed from id and timestamp", function () {

        var id = "123123123123";
        var timestamp = new Date().getTime();

        var ri = ReplicaIdentity.new(id, timestamp);

        expect(ri.getId()).toBe(id);
        expect(ri.getTimestamp()).toBe(timestamp);

        expect(ri.toString()).toBe(id + "." + timestamp.toString());
    });

    it("can be constructed from a string", function (){
        var id = "12323546534";
        var ts = new Date().getTime();

        var stringId = id + "." + ts.toString();

        var ri = ReplicaIdentity.newFromString(stringId);

        expect(ri.getId()).toBe(id);
        expect(ri.getTimestamp()).toBe(ts);
        expect(ri.toString()).toBe(stringId);
    });

    it("has a validation function", function (){

        var invalid = [
                "123123123.a1231231",
                "123123123.1123123a",
                "123123123.1123c231",
                "123123123.1123,231",
                "123123123.",
                "123123123",
                ".123123123",
                "123123123.a1231231.asdasda"
        ];

        var valid = [
                "asdasdasd.123123123",
                "23123123.123123123"
        ];


        invalid.forEach(function(val){
            expect(ReplicaIdentity.IsValidStringIdentity(val)).toBe(false);
        });

        valid.forEach(function(val){
            expect(ReplicaIdentity.IsValidStringIdentity(val)).toBe(true);
        });


    });

});