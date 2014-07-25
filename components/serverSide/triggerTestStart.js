var Memcached = require('memcached');
var KeyGen = require('./mcKeyGenerator.js');

var mc = new Memcached("localhost:11211");

var mcKey = KeyGen.getTestKey();

mc.get(mcKey, function (err, json) {
    console.log("Got: ");
    console.log(json);

    var o = {};
    o.testId = "MULTICAST";
    o.numUpdates = 10;
    o.frequency = 1000;

    mc.set(mcKey, JSON.stringify(o), 0, function(){
       console.log("Set: TRUE");
    });
});