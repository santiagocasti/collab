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


def run_background(cmd, display, sockname="dtach"):
    return run('export DISPLAY=' + display + ' && dtach -n `mktemp -u /tmp/%s.XXXX` %s' % (sockname, cmd))


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


def kill_applications():
    # kill chrome
    safeexec("pkill chrome")

    # kill ifstat
    safeexec("pkill ifstat")


def update_collab():
    # update the chrome app code
    safeexec("rm -rf ~/collab && git clone https://github.com/santiagocasti/collab.git")


def start_collab():
    # first obtain the display name based on the eth0 ip address
    ipAddress = safeexec("ifconfig eth0 | awk '/inet addr/ {gsub(\"addr:\", \"\", $2); print $2}'")
    splittedIp = ipAddress.split(".")
    display = "ip-" + splittedIp[0] + "-" + splittedIp[1] + "-" + splittedIp[2] + "-" + splittedIp[3] + ":1"
    print("Display: " + display)



    # then launch the app
    result = run_background(
        "google-chrome --load-and-launch-app=/home/ubuntu/collab/", display)
    print("Result was[" + result + "]")


def delete_logs():
    # remove previous netstat files
    safeexec("rm /home/ubuntu/netstat*", True)

    # remove downloaded files
    safeexec("rm -f ~/Downloads/*", True)

    # remove previous log folder
    ipAddress = safeexec("ifconfig edge0 | awk '/inet addr/ {gsub(\"addr:\", \"\", $2); print $2}'")
    safeexec("rm -f ~r/" + ipAddress + "/*", True)


def create_folders():
    # obtain the ip address and the date
    ipAddress = safeexec("ifconfig edge0 | awk '/inet addr/ {gsub(\"addr:\", \"\", $2); print $2}'")
    date = safeexec("date +'%Y-%m-%d_%H-%M-%S'")

    # create folder name and path
    folderName = ipAddress + "_" + date
    folderPath = "/home/ubuntu/" + folderName
    safeexec("mkdir " + folderPath)

    # this file name has to change for every peer
    netstatFileName = "netstat_" + ipAddress + ".txt"
    netstatFilePath = folderPath + "/" + netstatFileName
    safeexec("touch " + netstatFilePath)

    start_ifstat(netstatFilePath)


def start_ifstat(netstatFilePath):
    # start ifstat
    safeexec("ifstat -i edge0 -ntwb 1 >> " + netstatFilePath + " &", True)


@parallel
def prepare_peer_detailed():
    kill_applications()

    delete_logs()

    update_collab()

    safeexec("sleep 2")

    start_collab()

    create_folders()


def prepare_server_detailed():
    # restart memcached
    safeexec("service memcached restart", True)

    # kill node js if running
    safeexec("pkill nodejs", True)

    # start server side main thread
    run_background("nodejs /home/ubuntu/collab/components/serverSide/main.js")

    # start experiment
    run_background("nodejs /home/ubuntu/collab/components/serverSide/triggerTestStart.js")


@parallel
@roles('peers')
def prepare_peer():
    #env.always_use_pty = False
    prepare_peer_detailed()


@roles('server')
def prepare_server():
    prepare_server_detailed()
