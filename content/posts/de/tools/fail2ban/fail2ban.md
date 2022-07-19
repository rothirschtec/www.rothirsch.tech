---
Title:      fail2ban
Menuname:   fail2ban
Summary:    Einrichten und Verwenden von fail2ban
Language:   de
Keywords:   fail2ban, konfigurieren, verwenden
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-19_11:01:09
Image:      content/images/icons/menu/3_Pillars_Rothirsch-Tech-GmbH.png
Alt:        
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   de/blog/tools/fail2ban/fail2ban.html
child:      none
parent:     none
template:   single-post.html
robots:     index, follow
---

# fail2ban

Mit fail2ban wird es uns ermöglicht, dass wir Angreifer die sich mehrmals falsch anmelden, mit automatisch erzeugten iptables Regeln aus dem System sperren.

Das klingt eigentlich nach einer Super Idee, da der User auf Lebzeiten gesperrt werden kann.

Problematisch dabei ist aber, dass ein möglicher Angreifer wahrscheinlich immer über ein Tor Netzwerk angreifen wird. Der Sinn hinter einem Tor Netzwerk ist, dass ein Benutzer der über einen Server zugreift, dies nicht über seine eigene IP Adresse sondern über einen im Tor Netzwerk befindlichen Fremdrechner macht. Zusätzlich wechselt dieser Rechner. Man kann ihn auch automatisch wechseln.

Dadurch wäre eine Möglichkeit das fail2ban zu umgehen, ein Script zu schreiben, dass automatisch nach 5 Versuchen die Route neu berechnet und über eine neue IP Adresse angreift.

Somit müsste euer Server einen Blacklist aller im Tor Netzwerk befindlichen Rechnern hinterlegt haben um diese Angriffsmethode abzuwehren. Daher ist auch das fail2ban nur eine Teilsicherung.


## Installation fail2ban

fail2ban installieren wir direkt über die Repositories.

### Installation Repositories

    sudo apt-get update
    sudo apt-get install fail2ban

Das wars schon ; )

## Konfiguration fail2ban

Es wird empfohlen, die Standard-Konfiguration nicht zu überschreiben. Stattdessen, ermöglicht es fail2ban mittels einer lokalen Datei die eigenen Einstellung dem Service zu übermitteln.

    cd /etc/fail2ban
    sudo cp jail.conf jail.local
    vi jail.local

In der Konfigurationsdatei, sind auf Englisch eigentlich alle Konfigurationsparameter beschrieben. In diesem Tutorial werden wir nur den SSH Tunnel sichern.

### Bantime

Über den Parameter bantime, weist ihr fail2ban an, wie lange ein Benutzer der sich falsch angemeldet hat gesperrt sein soll.
Hier werden 10Jahre in Sekunden eingestellt. Der Grund ist einfach. Es gibt nur den Admin der sich anmeldet. Wenn dieser das Passwort vergisst, ist ja eh schon das komplette System gefährdet ;)

    bantime=3784320000

### findtime

Über den Parameter bantime, weist ihr fail2ban an, ab wann ein maxretry abläuft. Auch hier werden 10 Jahre verwendet.
Somit bekommt ein möglicher Angreifer, bei einer maxretry Einstellung von 5, die Möglichkeit alle 10 Jahre 4 Versuche zu starten ohne dass er das maxretry auslöst.

    findtime=3784320000


### maxretry

Mit dem Parameter maxretry könnt ihr einstellen wie oft sich ein Benutzer falsch anmelden darf.
Mehr als 3 Versuche geben wir auch dem Administrator nicht ;)

    maxretry=3

## fail2ban ssh absichern

Nun müssen wir noch die ssh Parameter in der jail.local für den ssh Service ändern. Such nach dem Bereich "[ssh]" und ändert diesen auf eure Konfiguration. Hier könnt ihr auch das "maxretry" für diesen Dienst ändern.

    vi /etc/fail2ban/jail.local

    [ssh]
    enabled = true
    port = [EUER PORT]
    filter = sshd
    logpath = /var/log/auth.log
    maxretry = [EUER maxretry]

## Konfigurationen übernehmen

Neustart des Dienstes.

    sudo service fail2ban restart
