chrome.app.runtime.onLaunched.addListener(function (launchData) {
    chrome.app.window.create('index.html', function (win) {
        win.contentWindow.launchData = launchData;
    });
});


//var browserify = require('browserify');
//var b = browserify();
//b.add('./networking.js');
//b.bundle().pipe(process.stdout);


//var net = require('networking.js');

//net.createSocket("TCP", 1234);

//require('networking.js');

//network.createSocket('tcp', 1234);

var n = Network.getInstance();

console.log(n);

var promise = new Promise(function (resolve, reject) {
    console.log("calling: n.getNetworkInterfaces(resolve)");
    n.loadNetworkInterfaces(resolve);
});

promise.then(function(){
    console.log("calling: n.createSocket("+n.UDP_TYPE+", 1234)");
    n.createSocket(n.UDP_TYPE, 1234);
});


