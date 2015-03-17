var http = require('http');
var url = require('url');
var Memcached = require('memcached');
var VectorClock = require('../crdt/vectorClock.js');
var RegisterValue = require('../crdt/registerValue.js');
var MVRegister = require('../crdt/multiValueRegister.js');
var Counter = require('../crdt/pncounter.js');
var CRDT = require('../crdt/factory.js');
var KeyGen = require('./mcKeyGenerator.js');
var ReplicationController = require('../replication/replicationController.js');
var ServerConstants = require('../serverSide/serverConstants.js');

/**
 * Checks if the request is one of the PeerReplication protocol
 * @param request
 * @returns {boolean}
 */
function isPeerReplicationRequest(request) {
    var path = url.parse(request.url).pathname;
    var parts = path.split("/");
    return typeof request.method == 'string' &&
            request.method.toLowerCase() == 'post' && // POST request
            (parts[1].toLowerCase() == 'register' || // to the resource register
                    parts[1].toLowerCase() == 'counter');   // or counter
}

/**
 * Checks if the request is one of the DirectReplication protocol
 * @param request
 * @returns {boolean}
 */
function isDirectReplicationRequest(request) {
    var path = url.parse(request.url).pathname;
    var parts = path.split("/");
    return typeof request.method == 'string' &&
            request.method.toLowerCase() == 'get' && // GET request
            parts[1].toLowerCase() == 'basedata'; // to the resource basedata
}

/**
 * Check if the request is one of the Test checking protocol
 * @param request
 * @returns {boolean}
 */
function isTestRequest(request) {
    var path = url.parse(request.url).pathname;
    console.log('[' + (new Date().getTime()) + '] Request for [' + path + '] from [' + request.connection.remoteAddress + ']');
    var parts = path.split("/");
    return typeof request.method == 'string' &&
            request.method.toLowerCase() == 'get' && // GET request
            parts[1].toLowerCase() == 'test'; // to the resource basedata
}

/**
 * Check if the request is one of the time protocol.
 * @param request
 * @returns {boolean}
 */
function isTimeRequest(request) {
    var path = url.parse(request.url).pathname;
    var parts = path.split("/");
    return typeof request.method == 'string' &&
            request.method.toLowerCase() == 'get' && // GET request
            parts[1].toLowerCase() == 'time'; // to the resource basedata
}

/**
 * Create the server, and handle requests.
 */
http.createServer(function (request, response) {

    var postData = "";
    request.on('data', function (chunk) {
        postData += chunk;
    });

//    var path = url.parse(request.url).pathname;
//    console.log('Request for [' + path + '] from ['+request.connection.remoteAddress+']');

    request.on('end', function () {
//        console.log('POSTed: ' + postData);

        if (isTimeRequest(request)) {
            handleTimeRequest(response);
        } else if (isPeerReplicationRequest(request)) {
            // handle peer replication request
            handlePeerReplicationRequest(request, response, postData);
        } else if (isDirectReplicationRequest(request)) {
            // handle direct replication request
            handleDirectReplicationRequest(response);
        } else if (isTestRequest(request)) {
            var remoteAddress = request.connection.remoteAddress;
            // handle direct replication request
            handleTestRequest(response, remoteAddress);
        } else {
            console.log("UNRECOGNIZED REQUEST!");
            finishRequest(response);
        }
    });

}).listen(ServerConstants.Port, ServerConstants.IP);


function handleTimeRequest(response) {
    finishRequest(response, (new Date().getTime()));
}

function handleTestRequest(response, remoteAddress) {

    var mc = getMcClient();
    var mcKey = KeyGen.getTestKey();

    mc.get(mcKey, function (err, json) {
        if (typeof json == 'string') {
//            console.log("Replying: " + json);
            finishRequest(response, json);
        } else {
//            console.log("Replying: {}");
            finishRequest(response, "{}");
        }
    });

}


/**
 * Handles a request of the protocol PeerReplication
 * @param request
 * @param response
 * @param postData
 */
function handlePeerReplicationRequest(request, response, postData) {

    var path = url.parse(request.url).pathname;
//    console.log('Request for: ' + path);

    var parts = path.split("/");

    switch (parts[1]) {
        case "register":
//            console.log("Received a register request.");
            updateCRDTFromCache(parts[2], postData, response, "MVRegister");
            break;
        case "counter":
//            console.log("Received a counter request.");
            updateCRDTFromCache(parts[2], postData, response, "Counter");
            break;
        default:
    }
}

/**
 * Finishes the request responding with the given message.
 * It defaults to a message with the timestamp if no message is provided.
 * @param response
 * @param msg
 */
function finishRequest(response, msg) {
    response.writeHead(200, {'Content-Type': 'text/plain' });
    if (typeof msg == 'undefined') {
        msg = "" + new Date().getTime();
    }
    response.end(msg);
}

/**
 * Returns a memcached client.
 * @returns {Memcached}
 */
function getMcClient() {
    var mc = new Memcached("localhost:11211");
    return mc;
}


/**
 * Very simple function to update a CRDT stored in cache by merging it with
 * the one provided as a JSON string.
 * @param id
 * @param data
 * @param response
 * @param crdtName
 */
function updateCRDTFromCache(id, data, response, crdtName) {

//    console.log("Handling request to CRDT [" + id + "] with the following data: " + data);

    // create a register object with the data from the request
    var newCrdt = CRDT.newFromJSON(id, data, crdtName);

    var mc = getMcClient();
    var mcKey = KeyGen.getCrdtKey(id, crdtName);

    // get from memcached the data for that ID
    mc.get(mcKey, function (err, crdtJson) {

//        console.log("We got [" + crdtJson + "] for key [" + mcKey + "]");

        var existingCrdt;

        if (typeof crdtJson == 'string') {
            // if there existed a register already create the object
            existingCrdt = CRDT.newFromJSON(id, crdtJson, crdtName);
        } else {
            // if it didn't existed, create an empty register
            existingCrdt = CRDT.newFromJSON(id, {}, crdtName);
        }

//        console.log("Existing" + existingCrdt.toJSON());
//        console.log("New" + newCrdt.toJSON());

        // merge the new register with the one we got from cache
        newCrdt = existingCrdt.merge(newCrdt);

        addCrdtToIdSets(id, crdtName);

        // save the new merged register in memcached
        mc.set(mcKey, newCrdt.toJSON(), 0, function () {
            var msg = "Saved [" + mcKey + "] as [" + newCrdt.toJSON() + "]";
//            console.log(msg);
            finishRequest(response, msg);

//            printAllIds(crdtName);
        });
    });
}

/**
 * Add the id of the CRDT of the type 'crdtName' to the set of IDs of that
 * type stored in memcached
 * @param id
 * @param crdtName
 */
function addCrdtToIdSets(id, crdtName) {

    var mc = getMcClient();
    var mcKey = KeyGen.getIdSetKey(crdtName);

    mc.get(mcKey, function (err, data) {

        if (!data) {
            data = {};
        }

        data[KeyGen.getCrdtKey(id, crdtName)] = id;

        mc.set(mcKey, data, 0, function () {
//            console.log("Saved set of all " + crdtName + " IDs: " + JSON.stringify(data));
        });
    });
}

/**
 * Debugging function for printing all the IDs of a given crdt type
 * @param crdtName
 */
function printAllIds(crdtName) {

    var mc = getMcClient();
    var mcKey = KeyGen.getIdSetKey(crdtName);

    mc.get(mcKey, function (err, data) {
//        console.log("Printing all [" + crdtName + "] keys [" + data + "]...");
        for (var key in data) {
//            console.log(key);
        }
    });

}


/**
 * Handles a request of the protocol DirectReplication
 * @param response
 */
function handleDirectReplicationRequest(response) {

    var counterName = 'Counter';
    var registerName = 'MVRegister';

//    console.log("A");

    var counterMcKey = KeyGen.getIdSetKey(counterName);
    var registerMcKey = KeyGen.getIdSetKey(registerName);

    var mc = getMcClient();

//    console.log("B");

    mc.get([counterMcKey, registerMcKey], function (err, data) {

//        console.log("C");

//        console.log("DATA: " + JSON.stringify(data));

        if (JSON.stringify(data) === "{}") {
            console.log("C.1");
            var responsePayload = ReplicationController.BuildDirectReplicationResponseData({}, {});
            finishRequest(response, JSON.stringify(responsePayload));
            return;
        }


//        console.log("D");

//        console.log("counter IDs: " + JSON.stringify(data[counterMcKey]));
//        console.log("register IDs: " + JSON.stringify(data[registerMcKey]));

        if (!data[counterMcKey]) {
            data[counterMcKey] = {};
        }

        if (!data[registerMcKey]) {
            data[registerMcKey] = {};
        }

        var counterIDs = Object.keys(data[counterMcKey]);
        var registerIDs = Object.keys(data[registerMcKey]);


        var callback_wj3h1l2j1ls = function (allJsonCounters) {

            var callback_aslkej123lnda = function (allJsonRegisters) {

                var allCounters = [];
                for (var id in allJsonCounters) {
                    allCounters.push(CRDT.newFromJSON(0, allJsonCounters[id], counterName));
                }

                var allRegisters = [];
                for (var id in allJsonRegisters) {
                    allRegisters.push(CRDT.newFromJSON(0, allJsonRegisters[id], registerName));
                }

                var responsePayload = ReplicationController.BuildDirectReplicationResponseData(allCounters, allRegisters);

                finishRequest(response, JSON.stringify(responsePayload));

            }

            getRegisters(registerIDs, callback_aslkej123lnda);
        }

        getCounters(counterIDs, callback_wj3h1l2j1ls);


    });

}


function getRegisters(registerIDs, callback) {

    if (registerIDs.length > 0) {
        var mc = getMcClient();
        mc.get(registerIDs, function (err, data) {

            if (!data) {
                data = [];
            }

            callback(data)

        });
    } else {
        callback([]);
    }

}

function getCounters(counterIDs, callback) {

    if (counterIDs.length > 0) {
        var mc = getMcClient();
        mc.get(counterIDs, function (err, data) {

            if (!data) {
                data = [];
            }

            callback(data);
        });
    } else {
        callback([]);
    }

}