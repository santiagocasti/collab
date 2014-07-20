#!/bin/bash

# copy this folder to the destination
#
# scp -i ~/.ssh/santiago.pem -o BatchMode=yes -o StrictHostKeyChecking=no ./serverConfiguration.tar.gz ubuntu@54.191.115.238:~/
# ssh -i ~/.ssh/santiago.pem ubuntu@54.191.115.238 \ "tar -zxvf serverConfiguration.tar.gz; bash ~/serverConfiguration/initialSetup.sh"
#

##############################
#   Needed Variables
##############################

CONFIG_FOLDER=~/serverConfiguration
X_STARTUP_FILE="${CONFIG_FOLDER}/xstartup"
PASSWORD_FILE="${CONFIG_FOLDER}/passwd"
EXTENSION_CONFIG_FILE="${CONFIG_FOLDER}/bmjfjogjlianmhgaendoghocmfdbihlj.json"
PASSWORD_FILE="${CONFIG_FOLDER}/passwd"
CHROME_REPO_FILE="${CONFIG_FOLDER}/google-chrome.list"
VNC_SERVER_FILE="${CONFIG_FOLDER}/vncserver"

VNC_FOLDER="${HOME}/.vnc/"
AUTOSTART_DIR=~/.config/autostart
VNC_SERVER_STARTUP_FILE="/etc/init.d/vncserver"


##############################
#   Installation steps
##############################

echo "--------------------------------"
echo " STEP: 1"
echo "--------------------------------"
#install the google repository
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo cp $CHROME_REPO_FILE /etc/apt/sources.list.d/

echo "--------------------------------"
echo " STEP: 2"
echo "--------------------------------"
# update the repositories
sudo apt-get update

echo "--------------------------------"
echo " STEP: 3"
echo "--------------------------------"
# install the required packages
sudo apt-get install -y xfce4 tightvncserver git google-chrome-stable
sudo apt-get install -y gnome-desktop
sudo apt-get install -y ubuntu-desktop
sudo apt-get install -y xfce4-goodies
sudo apt-get install -y gnome-core gnome-session-fallback

echo "--------------------------------"
echo " STEP: 4"
echo "--------------------------------"
#clone the repository in the home directory
git clone https://github.com/santiagocasti/collab.git ${HOME}/collab

##############################
#   Configuration steps
##############################

# create the vnc folder so we can place password and config files there
if [ ! -d "$VNC_FOLDER" ]; then
	mkdir $VNC_FOLDER
fi

# change permissions of that folder
sudo chmod -R 777 $VNC_FOLDER

# move the xstartup to a backup file, if present
if [ -f ${VNC_FOLDER}xstartup ]; then
	mv -f ${VNC_FOLDER}xstartup ${VNC_FOLDER}xstartup.original
fi

# place the new xstartup
cp -f $X_STARTUP_FILE ${VNC_FOLDER}xstartup

# place the password file
cp -f $PASSWORD_FILE ${VNC_FOLDER}

# copy the startup script
sudo cp $VNC_SERVER_FILE $VNC_SERVER_STARTUP_FILE
# add execution permissions
sudo chmod +x $VNC_SERVER_STARTUP_FILE
# add it to the startup logic
sudo update-rc.d vncserver defaults

##############################
#   Reboot
##############################

#reboot the system
#sudo reboot

##############################
#   Old commented code follows
##############################

#EXTENSION_DIR_1="/opt/google/chrome/extensions/"
#EXTENSION_CONFIG_DEST_1="/opt/google/chrome/extensions/bmjfjogjlianmhgaendoghocmfdbihlj.json"
#EXTENSION_DIR_2="/usr/share/google-chrome/extensions"
#EXTENSION_CONFIG_DEST_2="/usr/share/google-chrome/extensions/bmjfjogjlianmhgaendoghocmfdbihlj.json"
#VNC_AUTOSTART_FILE="${CONFIG_FOLDER}/vncserver.desktop"

# start the vnc server
#vncserver :1
#kill the vnc server
#vncserver -kill :1

# backup the original sources file
#sudo cp -f /etc/apt/sources.list /etc/apt/sources.list.original

# remove the us-west-2.ec2 part of the URL since it's not accessible from the VPC
#sudo sed 's@http://us-west-2\.ec2\.archive\.ubuntu\.com/@http://archive.ubuntu.com/@' -i /etc/apt/sources.list

# install the extension
#if [ ! -d "$EXTENSION_DIR_1" ]; then
#  sudo mkdir $EXTENSION_DIR_1
#fi
#
#if [ ! -d "/usr/share/google-chrome" ]; then
#	sudo mkdir /usr/share/google-chrome
#	if [ ! -d "$EXTENSION_DIR_2" ]; then
#		sudo mkdir $EXTENSION_DIR_2
#	fi
#fi
#
#sudo chmod -R 777 $EXTENSION_DIR_1
#sudo chmod -R 777 $EXTENSION_DIR_2
#
#cp -f $EXTENSION_CONFIG_FILE $EXTENSION_CONFIG_DEST_1
#cp -f $EXTENSION_CONFIG_FILE $EXTENSION_CONFIG_DEST_2
#
#if [ ! -d "/home/share" ]; then
#	sudo mkdir /home/share
#fi
#
#sudo chmod -R 777 /home/share
#
#cp ${CONFIG_FOLDER}/collab.crx /home/share
#
#chmod 777 /home/share/collab.crx