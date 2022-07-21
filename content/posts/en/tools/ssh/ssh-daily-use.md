---
Title:      A guideline for SSH
Menuname:   Guideline: SSH
Summary:    A few tweaks for your SSH configuration
Language:   en
Keywords:   ssh, improve, tweak
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-20_09:52:01
Image:      content/images/posts/tools/ssh/rothirsch-logo-ssh.svg
Alt:        The posts featured image showing a simple crest with a SSH lettering on it
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   en/blog/tools/ssh/ssh-daily-use.html
child:      none
parent:     none
template:   single-post.html
state:      ready
robots:     index, follow
---

# A guideline for SSH

This post will show you how to use SSH.

## Parameters used for this guideline

host          | IP address
------------- | -------------
client        | 192.168.0.1  
server        | 192.168.0.254
e-mail server | 192.168.0.253

## Connect with SSH hosts

    ssh 192.168.0.254

### Save connections

You can store and label your SSH hosts within your users .ssh directory

    ~/.ssh/config

The least host configuration looks like this:

    Host HOST
      Hostname 192.168.0.254
      Port 22
      User root

With this host configuration stored, you're able to connect by simply passing the hosts label.

    ssh HOST

You are allowed to overwrite stored parameters with new ones.

    ssh user@server

## Change configuration on the fly

The main configuration file for SSH on a Debian system is:

    /etc/ssh/sshd_config

> ! Tip: If you are connected to a host and you change something in inside the SSH configuration files, you can restart the SSH service. Even if you change the port. The connection stays as long as you log out.

### Restart the service

You have to restart the server, if you want to activate the changes you have taken.

    service ssh restart

## Change your SSH Port

The standard Port for SSH is __22__. This is known by any script kiddie in the whole universe. So, if you receive a lot of Brute Force attacks on your SSH port, it may help if you change it. Search the line with port in the main configuration file and change it:

    Port 22

## Verwende SSH ohne Passwort

Es ist möglich, sich an einem SSH-Host ohne Passwort aber mit einem [RSA Schlüssel Paar](https://www.youtube.com/watch?v=AQDCe585Lnc) anzumelden.

Als erstes erzeugst du das RSA Schlüssel Paar (öffentlich/privat) mit folgendem Befehl:

    ssh-keygen -t rsa

Später wirst du deinen öffentlichen Schlüssel auf Remote-Hosts hinterlegen. Danach kannst du dich mit diesen Hosts über deinen privaten Schlüssel verbinden. Wenn jemaden diesen privaten Schlüssen stiehlt kann er sich mit allen deinen Hosts verbinden. Du kannst daher  jetzt entscheiden, ob du den privaten Schlüssel mit einem Passwort absichern möchtest. Wenn nicht, kannst du einfach alle Fragen mit Enter bestätigen.

    Generating public/private rsa key pair.
    Enter file in which to save the key (/home/test/.ssh/id_rsa):
    Enter passphrase (empty for no passphrase):
    Enter same passphrase again:
    Your identification has been saved in /home/test/.ssh/id_rsa.
    Your public key has been saved in /home/test/.ssh/id_rsa.pub.
    The key fingerprint is:
    SHA256:nm9VTWqhaFf8yeOmjq0Xt0X74aa574WpkVL5dJvk2c4 test@testpc
    The key's randomart image is:
    +---[RSA 2048]----+
    |             .   |
    |          .   + .|
    |         o o =.*.|
    |        . B * O++|
    |       .S* o B.oo|
    |       .o.o . o=.|
    |        o. +  +E+|
    |         .= .+.+.|
    |         ++++=*  |
    +----[SHA256]-----+

Now you can transfer the public key to a host of your choice:

    ssh-copy-id -i ~/.ssh/id_rsa.pub -p 22 root@192.168.0.254

You will get prompted for a password. Afterwards the public key will be transferred via the network to the host:

    /usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/test/.ssh/id_rsa.pub"
    /usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
    /usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
    root@192.168.0.254's password:

    Number of key(s) added: 1

    Now try logging into the machine, with:   "ssh -p '22' 'root@192.168.30.254'"
    and check to make sure that only the key(s) you wanted were added.


## Prevent root login via password

After you have uploaded your public key to the remote host there is no real need to login via password, especially to the root user. You can change following parameter to prohibit-password:

    PermitRootLogin prohibit-password

These are the options this parameter provides:    

1. "yes", root user is able to login to the server with a password
2. "no", root user is not allowed to login with SSH
3. "without-password" or "prohibit-password", allows the root user to login but only with a RSA key pair

Restart the SSH service and try to access it with a different host which doesn't own the private key (.ssh/id_rsa) and you'll see that there is no way to login without the key.

## Send mail on SSH login

A possible way to send an e-mail directly after the login of an user is shown here. The following file is invoked on each succesfull SSH login.

    /etc/ssh/sshrc

This script sends a mail including the IP address of the logged in user. Additionally the log system will also receive a log line.

    ip=`echo $SSH_CONNECTION | cut -d " " -f 1`
        # Get the IP Adress of the connected user

    logger -t ssh-wrapper $USER login from $ip
        # Log to syslog

    echo "User $USER just logged in from $ip" | sendemail -q -u "SSH Login" -f "Originator" -t "Login <logins>" -s 192.168.0.253 &
        # Send mail
