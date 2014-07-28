const DEBUG_MODE_ON = true;

function createMsgHead(depth, debug) {
    var e = new Error;
    var line = e.stack.split('\n')[depth];
    var re = RegExp('[^ ]*$');
    var fileFullpathString = re.exec(line)[0];
    var re2 = RegExp("([^/]*)$");
    var filenameAndLineNumber = re2.exec(fileFullpathString)[1];
    var lineNumber = filenameAndLineNumber.split(":")[1];
    var filename = filenameAndLineNumber.split(":")[0];

    var msg = "[" + filename + ":" + lineNumber + "] ";

    if (debug == true) {
        msg = "[dbg]" + msg;
    }

    return msg;
}


function log(message, object, debug, depth) {

    if (!depth) {
        depth = 3;
    }

    var head = createMsgHead(depth, debug);

    //console.log(head + message);

    if (object) {
        //console.log(object);
    }
}

function debug(message, object) {
    if (!DEBUG_MODE_ON) {
        return;
    }

    log(message, object, true, 4);
}

function log_delivered(hash) {
    sudo_log("|"+(new Date().getTime())+"|delivered|"+hash, 4);
}

function log_created(hash){
    sudo_log("|"+(new Date().getTime())+"|created|"+hash, 4);
}

function sudo_log(message, depth){
    var head = createMsgHead(depth, debug);

    var c = Context.getInstance();
    c.addMsg();

    console.log(head + message);
}

(function(console){

    console.save = function(data, filename){

        if(!data) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            data = JSON.stringify(data, undefined, 4)
        }

        var blob = new Blob([data], {type: 'text/json'}),
            e    = document.createEvent('MouseEvents'),
            a    = document.createElement('a')

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    }
})(console);
