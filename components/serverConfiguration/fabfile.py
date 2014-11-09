
#fab prepare_peer -i ~/.ssh/santiago.pem

from fabric.api import *

serverIP = ""

peer1 = ""
peer2 = ""

peers = [
	peer1,
	peer2
]

server = [
	serverIP
]

env.roledefs = {
	'peers': peers,
	'server': server
}

env.user = "ubuntu"


@parallel
def prepare_peer_detailed():
	# kill chrome
	run("pkill chrome")

	# kill ifstat
	sudo("pkill ifstat")

	# launch the app
	run("sh -c 'export DISPLAY=localhost:1.0; nohup google-chrome --load-and-launch-app=/home/ubuntu/collab/ &'"

    NETSTAT_FILE="netstat_192.168.1.10${i}.txt"

    # remove previous netstat files
    sudo("rm /home/ubuntu/netstat*")

    # remove downloaded files
    sudo("rm -f ~/Downloads/*")

    # start ifstat
    sudo("ifstat -i edge0 -ntwb 1 >> /home/ubuntu/"+NETSTAT_FILE+" &")




@parallel
@roles('peers')
def prepare_peer():
    #env.hosts = env.roledefs["peers"]
    prepare_peer_detailed()

@roles('server')
def prepare_server():
    #env.roles = ['server']
	prepare_server()