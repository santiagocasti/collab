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

    console.log(head + message);

    if (object) {
        console.log(object);
    }
}

function debug(message, object) {
    if (!DEBUG_MODE_ON) {
        return;
    }

    log(message, object, true, 4);
}
