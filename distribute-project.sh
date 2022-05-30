#!/bin/bash

echo "Sync begins"
cd $(dirname $0)
hdir="$PWD/"

if [ ! -f ${hdir}content/config ]; then
    echo "Copy content/config.example to content/config and configure it first"
else
    source ${hdir}content/config
fi

echo "Create directories"
ssh -p ${ssh_port} ${ssh_user}@${ssh_server} mkdir -p ${ssh_directory}content/php ${ssh_directory}de ${ssh_directory}en

echo "Syncing files, remove before"
rsync -rlD -e "ssh -p ${ssh_port}" ${hdir} ${ssh_user}@${ssh_server}:${ssh_directory} \
    --include={"content/bootstrap/"\
,"content/images"\
,"content/fonts"\
,"content/jquery"\
,"content/main.min.js"\
,"content/main.min.css"\
} \
    --exclude={"*.py","*.sh","content/*","*.git"} \
    --delete

echo "Sync php files"
rsync -rld -e "ssh -p ${ssh_port}" ${hdir}content/php/ ${ssh_user}@${ssh_server}:${ssh_directory}content/php/ \
    --delete

echo "Change user to www-data: on server"
ssh -p ${ssh_port} ${ssh_user}@${ssh_server} chown -R www-data: ${ssh_directory}

echo "Sync ended"
