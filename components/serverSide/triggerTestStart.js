var Memcached = require('memcached');
var KeyGen = require('./mcKeyGenerator.js');

var mc = new Memcached("localhost:11211");

var mcKey = KeyGen.getTestKey();

mc.get(mcKey, function (err, json) {
    console.log("Got: ");
    console.log(json);

    mc.set(mcKey, "TRUE", 0, function(){
       console.log("Set: TRUE");
    });
});
