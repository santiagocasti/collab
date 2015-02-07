# How to run a routine
# fab prepare_peer -i ~/.ssh/santiago.pem

from fabric.api import *
from fabric.contrib.console import confirm

serverIP = ""

peer1 = ""
# peer2 = ""

peers = [
    peer1
]

server = [
    serverIP
]

env.roledefs = {
    'peers': peers,
    'server': server
}

env.user = "ubuntu"


def safeexec(command, execSudo=False, warningOnlyOnFailure=True):
    with settings(warn_only=warningOnlyOnFailure):

        if execSudo == True:
            result = sudo(command)
        else:
            result = run(command)

    if result.failed:
        msg = 'Command [' + command + '] returned non-zero.'
        print(msg)

    return result



@parallel
def prepare_peer_detailed():
    ### kill chrome
    safeexec("pkill chrome")

    ### kill ifstat
    safeexec("pkill ifstat")

    ### update the chrome app code
    safeexec("rm -rf ~/collab && git clone https://github.com/santiagocasti/collab.git")

    ipAddress = safeexec("ifconfig eth0 | awk '/inet addr/ {gsub(\"addr:\", \"\", $2); print $2}'")
    splittedIp = ipAddress.split(".")
    display = "ip-" + splittedIp[0] + "-" + splittedIp[1] + "-" + splittedIp[2] + "-" + splittedIp[3] + ":1"
    print("Display: "+display)

    safeexec("sleep 2")

    ## launch the app
    result = safeexec("export DISPLAY="+display+"; nohup google-chrome --load-and-launch-app=/home/ubuntu/collab/ &")
    print("Result was["+result+"]")

    #
    # create the folder for all the data
    ipAddress = safeexec("ifconfig edge0 | awk '/inet addr/ {gsub(\"addr:\", \"\", $2); print $2}'")
    date = safeexec("date +'%Y-%m-%d_%H-%M-%S'")

    folderName = ipAddress + "_" + date
    folderPath = "/home/ubuntu/" + folderName
    safeexec("mkdir " + folderPath)

    # this file name has to change for every peer
    netstatFileName = "netstat_"+ ipAddress +".txt"
    netstatFilePath = folderPath + "/" + netstatFileName
    safeexec("touch "+netstatFilePath)


    # remove previous netstat files
    safeexec("rm /home/ubuntu/netstat*", True)

    # remove downloaded files
    safeexec("rm -f ~/Downloads/*", True)

    # start ifstat
    safeexec("ifstat -i edge0 -ntwb 1 >> " + netstatFilePath + " &", True)

    print(ipAddress + safeexec("date"))


def prepare_server_detailed():
    # restart memcached
    safeexec("service memcached restart", True)

    # kill node js if running
    safeexec("pkill nodejs", True)

    # start server side main thread
    safeexec("nodejs /home/ubuntu/collab/components/serverSide/main.js &")

    # start experiment
    safeexec("nodejs /home/ubuntu/collab/components/serverSide/triggerTestStart.js")


@parallel
@roles('peers')
def prepare_peer():
    env.always_use_pty = False
    #env.hosts = env.roledefs["peers"]
    prepare_peer_detailed()


@roles('server')
def prepare_server():
#env.roles = ['server']
    prepare_server_detailed()
