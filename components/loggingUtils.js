function log(message, object){
    var e = new Error;
    var line = e.stack.split('\n')[2];
    var re = RegExp('[^ ]*$');
    var fileFullpathString = re.exec(line)[0];
    var re2 = RegExp("([^/]*)$");
    var filenameAndLineNumber = re2.exec(fileFullpathString)[1];
    var lineNumber = filenameAndLineNumber.split(":")[1];
    var filename = filenameAndLineNumber.split(":")[0];
    console.log("["+filename+":"+lineNumber+"] "+message);
    if (object){
        console.log(object);
    }
}
