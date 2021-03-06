---
Title:      Ein Leitfaden für SSH
Menuname:   Leitfaden: SSH
Summary:    Ein paar Verbesserungen für deine SSH Konfiguration
Language:   de
Keywords:   ssh, verbessern
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-20_09:52:01
Image:      content/images/posts/tools/ssh/rothirsch-logo-ssh.svg
Alt:        Das Beitragsbild zeigt ein Wappen mit dem Schriftzug SSH darauf
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   de/blog/tools/ssh/ssh-taeglicher-gebrauch.html
child:      none
parent:     none
template:   single-post.html
state:      ready
robots:     index, follow
---

# Ein Leitfaden für SSH

Dieser Beitrag zeigt dir wie du SSH verwendest.

## Parameter die in diesem Leitfaden genutzt werden

Rechner       | IP Adresse
------------- | -------------
Client        | 192.168.0.1  
Server        | 192.168.0.254
E-Mail-Server | 192.168.0.253

## Verbindung mit SSH-Hosts aufbauen

    ssh 192.168.0.254


### Verbindungen speichern

Du kannst deine SSH-Hosts im .ssh Ordner deines Benutzers speichern

    ~/.ssh/config

Die geringste Host Konfiguration schaut wie folgt aus:

    Host HOST
      Hostname 192.168.0.254
      Port 22
      User root

Mit dieser gespeicherten Host Konfiguration, kannst du dich nun mit der Host Bezeichnung verbinden.

    ssh HOST

Es ist dir erlaubt, gespeicherte Parameter mit Neuen zu übrschreiben.

    ssh -p 111 user@HOST

## Konfiguration im laufenden Betrieb ändern

Die SSH-Hauptkonfigurationsdatei ist auf einem Debian-System folgende:

    /etc/ssh/sshd_config

> ! Tipp: Wenn du mit einem host  verbunden bist und etwas in den SSH-Konfigurationsdateien änderst, kannst du den SSH-Service neustarten. Auch wenn du den SSH-Port geändert hast. Die Verbindung bleibt bestehen, bis du dich abmeldest.

### Service neustarten

Um Änderungen zu übernehmen, musst du den SSH-Service am Host neustarten

    service ssh restart

## SSH Port ändern

Der Standard-Port für SSH lautet __22__. Das weiß jedes Skript-Kiddie im gesamten Universum. Wenn du also viele Brute-Force-Attacken auf deinem SSH-Port verzeichnest, kann es helfen den Port zu ändern. Suche in der Hauptkonfigurationsdatei nach der Zeile die den Port definiert:

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

Nun kannst du den öffentlichen Schlüssel auf einen Host deiner Wahl kopieren:

    ssh-copy-id -i ~/.ssh/id_rsa.pub -p 22 root@192.168.0.254

Du wirst nach dem Passwort des Hosts gefragt. Anschließend wird der Schlüssel über das Netzwerk auf den Host kopiert:

    /usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/test/.ssh/id_rsa.pub"
    /usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
    /usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
    root@192.168.0.254's password:

    Number of key(s) added: 1

    Now try logging into the machine, with:   "ssh -p '22' 'root@192.168.30.254'"
    and check to make sure that only the key(s) you wanted were added.


## Unterbinde root Anmeldungen mittels Passwort

Nachdem du den öffentlichen Schlüssel auf den Remote-Host geladen hast, gibt es eigentlich keinen Grund mehr dich mittels Passwort als Root anzumelden. Du kannst den folgenden Parameter auf __prohibit-password__ stellen:

    PermitRootLogin prohibit-password

Das sind die Optionen die dieser Parameter anbietet:

1. "yes", Der Benutzer *root* kann sich mit dem Passwort anmelden
2. "no", Der Benutzer *root* kann sich gar nicht mehr über SSH anmelden
3. "without-password" or "prohibit-password", erlaubt es dem Benutzer *root* sich mit einem RSA-Schlüssel-Paar anzumelden.

Starte den SSH-Service neu und versuche dich mit einem Host zu verbinden auf dem der private Schlüssel nicht vorhanden ist (.ssh/id_rsa) und du wirst sehen, dass du dich nicht mehr anmelden kannst.

## Versende eine Mail bei einer SSH Anmeldung

Ein möglicher Weg um eine E-Mail nach jedem gelungenen SSH Verbindungsaufbau zu senden wird hier gezeigt. Folgende Datei wird nach jedem erfolgreichen Verbindungsaufbau aufgerufen.

    /etc/ssh/sshrc

Dieser Skript sendet eine E-mail mit der IP Adresse von der aus der Benutzer sich anmeldet. Zusätzlich wird die Anmeldung ins Logsystem geschrieben.

    ip=`echo $SSH_CONNECTION | cut -d " " -f 1`
        # Get the IP Adress of the connected user

    logger -t ssh-wrapper $USER login from $ip
        # Log to syslog

    echo "User $USER just logged in from $ip" | sendemail -q -u "SSH Login" -f "Originator" -t "Login <logins>" -s 192.168.0.253 &
        # Send mail
