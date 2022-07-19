---
Title:      Daily work with SSH
Menuname:   Daily SSH
Summary:    Optimize SSH for daily use
Language:   en
Keywords:   SSH, Harden, Key, Pair, Public, Private
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-19_09:52:01
Image:      content/images/icons/menu/3_Pillars_Rothirsch-Tech-GmbH.png
Alt:        
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   en/blog/tools/ssh/harden-ssh.html
child:      none
parent:     none
template:   single-post.html
robots:     index, follow
---

# Daily work with SSH

This posts will help you configure SSH to use it more comfortable.

## Parameters on this site

test          | Test
------------- | -------------
client        | 192.168.0.1  
server        | 192.168.0.254
mailserver    | 192.168.0.253

## Connect to a ssh server
Use a terminal like [tilix](https://gnunn1.github.io/tilix-web/) and connect with:

    ssh 192.168.0.254

### Save connections
You can save your server information to your local host file

    ~/.ssh/config

A simple host configuration looks like

<div class="output_highlight">
-----------   -----------------------------
_Host server_
              _Hostname 192.168.0.254_
              _Port 22_
              _User root_
-----------   -----------------------------
</div>


If you save this configuration you can connect to the server with following command...

    ssh server

...and you can change things for testing purpose

    ssh root@server

You can see that SSH prefers your input and reads the host configuration if it reads something it doesn't know.

## Configure SSH
So, here are a few configurations you can add to your environment. You always have to think about what strategy is the best for you and if you are aware of any possible security flaw. So if you allow a SSH connection to a remote server from your local subnet and you have an employee who steals your [SSH Credentials](https://help.vaultpress.com/ssh/) and connects to it, you have failed. So decide wise!

### Configuration files
The main configuration file for SSH on a Debian system is:

    /etc/ssh/sshd_config

<div class="info_highlight">
! Tip: If you are connected to a server and you change something in its ssh configuration, you can restart the server. Even if you change the port. The connection stays on this port because it's already allowed. So if you change your port and stay connected you can try to connect with a second SSH connection. If the port is closed or you simply misconfigured the configuration file, you can change the configuration with the first connection. But work fast! If the existing connection needs a reconnect because of an unknown parameter in the network, you might loose this connection.
</div>

### Restart the server
You have to restart the server, if you want to activate the changes you have taken.

    service ssh restart

## Change your SSH Port
The standard Port for SSH is __22__. This is known by any script kiddie in the whole universe. So, if you get a lot of Brute Force Attacks and it is possible to change the Port, this is the way you can do it. Change following parameter within the main configuration file:

    Port 22

## Securely login without password to ssh
It is possible to login to any SSH server without a password but with a [RSA key pair](https://www.youtube.com/watch?v=wXB-V_Keiu8)

Create the public/private RSA key pair with following command.

    ssh-keygen -t rsa

Just leave anything on the default value and don't use a password.

If you use a password you will always get a password prompt for it.

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

In the next step you transfer the public key to a server of you choice

    ssh-copy-id -i ~/.ssh/id_rsa.pub -p 22 root@192.168.0.254

You will get prompted for a password. The successful output looks something like this:

    ssh-copy-id -i ~/.ssh/id_rsa.pub -p 22 root@192.168.0.254
    /usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/test/.ssh/id_rsa.pub"
    /usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
    /usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
    root@192.168.0.254's password:

    Number of key(s) added: 1

    Now try logging into the machine, with:   "ssh -p '22' 'root@192.168.30.254'"
    and check to make sure that only the key(s) you wanted were added.


## Disable root access with password
After you have uploaded your public key to the remote server there is a useful and recommended option to use with SSH.

    PermitRootLogin yes

This option has three parameter

1. "yes", root user is able to login to the server with a password
2. "no", root user is not allowed to login with SSH
3. "without-password" or "prohibit-password", allows the root user to login but only with a RSA key pair

So after uploading the public key you can login to the server and change the parameter

    PermitRootLogin prohibit-password

Restart the server and try to access it with a different host. If there is no public key on the server, the login prompt forces you to input a password but this never matches. So any attacker has to steal the private key of your user if they want an access to the server. A "guess" is not possible from there on!

## Send a mail to the admin on ssh connection
It is possible to send an e-mail directly after the login of an user.

Therefore you have to change following file

    /etc/ssh/sshrc

Add following script code and install _sendemail_

    ip=`echo $SSH_CONNECTION | cut -d " " -f 1`
        # Get the IP Adress of the connected user

    logger -t ssh-wrapper $USER login from $ip
        # Log to syslog

    echo "User $USER just logged in from $ip" | sendemail -q -u "SSH Login" -f "Originator" -t "Login <logins>" -s 192.168.0.253 &
        # Send mail
