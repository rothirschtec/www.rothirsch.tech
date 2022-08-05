---
Title:      SBC Cluster: DRBD + Pacemaker (Banana Pi m64)
Menuname:   HA Cluster
Summary:    Hochverfügbarer Cluster bestehend aus zwei Banana Pi m64
Language:   de
Keywords:   Banana Pi m64, Cluster, Singleboard Computer, SD Card, eMMC, Hochverfügbar
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-23_14:12:28
Image:      content/images/posts/projects/sbc-cluster/Two-Clearfog-Pro-and-two-bpi-m64.jpg
Alt:        Zur Veranschaulichung, zeigt dieses Bild zwei bpi-m64 die nebeneinander  in einem 1HE Gehäuse positioniert sind.
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   de/blog/projects/sbc-cluster/sbc-cluster-drbd-pacemaker.html
child:      none
parent:     none
template:   single-post.html
state:      ready
robots:     index, follow
---

# SBC Cluster: DRBD + Pacemaker (Banana Pi m64)

Das Ziel dieses Beitrags ist es dir zu zeigen wie du einen hochverfügbaren Cluster mit zwei Single Board Computer konfigurierst. Der Cluster verwendet DRBD um einen Datenspeicher über das Netzwerk zu replizieren. Beide Single Board Computer (SBC) werden über einen Switch verbunden. Dadurch werden all eingehenden und ausgehenden Verbindungen und die Replikation des Datenspeichers über das selbe Subnetz laufen. Zwei weitere Werkzeuge für den Cluster sind:

- Pacemaker for Ressourcen-Management
- Corosync für zuverlässige Synchronität

![Zur Veranschaulichung, zeigt dieses Bild zwei bpi-m64 die nebeneinander in einem 1HE Gehäuse positioniert sind und am Netzwerk und Strom angeschlossen sind](content/images/posts/projects/sbc-cluster/bpi-m64_cluster_of_two_plugged_in_to_network_and_power.jpg "bpi-m64 cluster of two")


## Parameter die für diesen Leitfaden verwendet werden

SBC           | IP Adressen
------------- | -------------
cluster-ab    | 172.30.2.15
node-a        | 172.30.2.16
node-b        | 172.30.2.17
cluster-san   | 172.30.2.20

## Installiere Armbian (auf deinem PC)

Als erstes konfigurierst du beide SBC. Lade die Image Datei herunter, schreib sie auf die SD-Karte und melde dich anschließend über SSH an. Du benötigst zwei Partitionen. Eine für das Betriebssystem und eine wird als _RAID1 über Ethernet_ konfiguriert.

Lade die Image- und sha-Datei von [Armbian](https://www.armbian.com/bananapi-64) herunter und prüfe die Integrität:

> Du kannst die Dateien auch über das Terminal herunterladen, du musst sie aber anschließend umbenennen um eine valide Integritätsprüfung durchführen zu können.
<br>
`wget https://redirect.armbian.com/region/EU/bananapim64/Bullseye_current`
<br>
`wget https://redirect.armbian.com/region/EU/bananapim64/Bullseye_current.sha`

    shasum -a 256 -c Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img.xz.sha

Spiele das Image auf die SD-Karte:

```
unxz Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img.xz
sudo dd if=Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img of=/dev/<your-sdcard> bs=4M
```

> Hier findest du weitere Information über das aufspielen von Armbian auf eine SD-Karte: [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card)

## Partitionen vorbereiten (auf deinem PC)

Für diesen Cluster wird eine _64GB - Klasse 10_ SD-Karte verwendet. Deshalb kannst du eine zweite Partition erstellen, nachdem du das Image aufgespielt hast, indem du die erste Partition verkleinerst. Dafür kannst du `fdisk` verwenden.

![Um das zu visualisieren kannst du hier ein Bild eines Balkens mit einer 25% großen Sektion für das Betriebssystem und einer 75% großen Sektion für den geteilen Datenspeicher sehen.](content/images/posts/projects/sbc-cluster/Partitioning.svg "bpi-m64 cluster of two")

### Ändere die Partitionen mit dem tool fdisk

Finde den Namen der SD-Karte

```output
Disk /dev/<your-sdcard>: 59,48 GiB, 63864569856 bytes, 124735488 sectors
Disk model: 1081 SD         
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0xe7f1ae5c
```

und starte fdisk

    fdisk /dev/<your-sdcard>

#### Zeige aktuelle Partitionierung

    Command (m for help): p

    Disk /dev/<your-sdcard>: 59.48 GiB, 63864569856 bytes, 124735488 sectors
    Units: sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 512 bytes
    I/O size (minimum/optimal): 512 bytes / 512 bytes
    Disklabel type: dos
    Disk identifier: 0xe7f1ae5c

    Device                Boot Start       End   Sectors  Size Id Type
    /dev/<your-sdcard>p1         8192 123469823 123461632 58.9G 83 Linux

> Beachte die Startposition der Partition. Dort wird dir 8192 angezeigt, diesen Wert musst du anschließend beim Ändern der Größe verwenden.

#### Löschen der Partition

Ja, du musst die System Partition zuerst löschen. `fdisk` löscht die Partition aber zu diesem Zeitpunkt nicht. Du musst den Schreibvorgang später erst starten.

    Command (m for help): d
    Selected partition 1
    Partition 1 has been deleted.

#### Erstelle die Systempartition mit 16 Gigabyte

    Command (m for help): n
    Partition type
       p   primary (0 primary, 0 extended, 4 free)
       e   extended (container for logical partitions)
    Select (default p): p
    Partition number (1-4, default 1):
    First sector (2048-124735487, default 2048): 8192
    Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-124735487, default 124735487): +16G

    Created a new partition 1 of type 'Linux' and of size 16 GiB.  
    Partition #1 contains a ext4 signature.

    Do you want to remove the signature? [Y]es/[N]o: N

> Vergiss nicht den richtigen Startpunkt für den ersten Sektor zu setzen.

#### Erstelle die zweite Partition

Gib die letzte Konfiguration aus um die Endposition der ersten Partition zu finden.

    Command (m for help): p

    Disk /dev/<your-sdcard> 59,48 GiB, 63864569856 bytes, 124735488 sectors
    Disk model: 1081 SD         
    Units: sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 512 bytes
    I/O size (minimum/optimal): 512 bytes / 512 bytes
    Disklabel type: dos
    Disk identifier: 0xe7f1ae5c

    Device                Boot Start End      Sectors   Size Id Type
    /dev/<your-sdcard>p1         8192  33562623 33554432  16G  83 Linux

Die Spalte "End" zeigt einen Wert von 33562623 den wir um 1 erhöhen um damit die nächste Partition zu erstellen

    Command (m for help): n
    Partition type
       p   primary (1 primary, 0 extended, 3 free)
       e   extended (container for logical partitions)
    Select (default p): p
    Partition number (2-4, default 2):
    First sector (2048-124735487, default 2048): 33562624
    Last sector, +/-sectors or +/-size{K,M,G,T,P} (33562624-124735487, default 124735487):

    Created a new partition 2 of type 'Linux' and of size 43,5 GiB.

#### Schreib alles auf die SD-Karte

Das wichtigste ist am Ende alles auf die SD-Karte zu schreiben. Verwende __w__ um den Vorgang zu starten.

    Command (m for help): w
    The partition table has been altered.
    Syncing disks

#### Starte die Einheit

Entferne die SD-Karte vom Kartenlesegerät, installiere sie in einer der Einheiten und starte sie.

> Verwende diesen Link um mehr über mögliche Optionen beim ersten Start des Armbian Betriebssystems zu erfahren.:  [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login)

Wenn du das für beide SBC gemacht hast, bist du für den weiteren Beitrag vorbereitet.

## Cluster Node Konfiguration

Alle Nodes eines Clusters sollten sich kennen. Du kannst dafür die Protokolle DNS und DHCP verwenden, aber du kannst die Konfiguration auch etwas verhärten in dem du die Nodes in die `/etc/hosts` Datei schreibst.

### Node A

#### node-a [vi /etc/hostename]

```conf
node-a
```

#### node-a [vi /etc/hosts]

```conf
127.0.0.1   localhost
127.0.1.1   node-a
172.30.2.17 node-b
```

#### node-a [Set static IP]

    nmcli dev mod eth0 ipv4.addresses "172.30.2.16/24"
    nmcli dev mod eth0 ipv4.gateway "172.30.2.254"
    nmcli dev mod eth0 ipv4.dns "172.30.2.254"
    nmcli dev mod eth0 ipv4.method manual
    nmcli dev mod eth0 connection.autoconnect yes
    systemctl restart NetworkManager

### Node B

#### node-b [vi /etc/hostename]

```conf
node-b
```

#### node-b [vi /etc/hosts]

```conf
127.0.0.1   localhost
127.0.1.1   node-b
172.30.2.16 node-a
```

#### node-b [Set static IP]

    nmcli dev mod eth0 ipv4.addresses "172.30.2.17/24"
    nmcli dev mod eth0 ipv4.gateway "172.30.2.254"
    nmcli dev mod eth0 ipv4.dns "172.30.2.254"
    nmcli dev mod eth0 ipv4.method manual
    nmcli dev mod eth0 connection.autoconnect yes
    systemctl restart NetworkManager

### Neustart

Wenn die Konfigurationen abschlossen sind, starte beide Nodes neu.

## DRBD

Du kannst diese Anleitung für beide Nodes verwenden außer dir wird etwas gegenteiliges beschrieben. Starte mit der Installation der notwendigen Abhängigkeiten

    apt update
    apt install drbd-utils

#### /etc/drbd.d/global_common.conf

Hier kannst du globale Konfigurtionen für deinen Cluster definieren. Der Leitfaden ist darauf ausgelegt alles so simple wie möglich zu halten, daher kannst du dich hier auf die Standardeinstellungen verlassen.

> Es gibt eine sehr gut beschriebene global.conf auf github von der Hersteller Firma von DRBD, linbit: [https://github.com/LINBIT/drbd-8.3/blob/master/scripts/drbd.conf.example](https://github.com/LINBIT/drbd-8.3/blob/master/scripts/drbd.conf.example)

#### vi /etc/drbd.d/r0.conf

Was wir aber konfigurieren ist eine Ressource die DRBD zeigt welche Festplatte oder Partition es für den geteilten Speicher verwenden soll.

```conf
resource r0 {

    # B: write IO is reported as completed, if it has reached
    #    local DISK and remote buffer cache.
    #    * for most cases.
    protocol B;

    startup {

      # Wait for connection timeout.
      # The init script blocks the boot process until the resources
      # are connected. This is so when the cluster manager starts later,
      # it does not see a resource with internal split-brain.
      # In case you want to limit the wait time, do it here.
      # Default is 0, which means unlimited. Unit is seconds.
      #
      wfc-timeout         0;  ## Infinite!

      # Wait for connection timeout if this node was a degraded cluster.
      # In case a degraded cluster (= cluster with only one node left)
      # is rebooted, this timeout value is used.
      #
      degr-wfc-timeout  120;  ## 2 minutes.
    }
    disk {
      # if the lower level device reports io-error you have the choice of
      #  "pass_on"  ->  Report the io-error to the upper layers.
      #                 Primary   -> report it to the mounted file system.
      #                 Secondary -> ignore it.
      #  "call-local-io-error"
      #	          ->  Call the script configured by the name "local-io-error".
      #  "detach"   ->  The node drops its backing storage device, and
      #                 continues in disk less mode.
      #
      on-io-error detach;
    }  

    on node-a {
      device /dev/drbd0;
      disk /dev/mmcblk0p2;
      address 172.30.2.16:7788;
      meta-disk internal;
    }
    on node-b {
      device /dev/drbd0;
      disk /dev/mmcblk0p2;
      address 172.30.2.17:7788;
      meta-disk internal;
    }

  }
```

### Erzeuge die DRBD partition

#### Überschreibe die Partitionstabelle

    dd if=/dev/zero of=/dev/mmcblk0p2 bs=1M count=128

#### Erstelle die DRBD Ressource auf beiden Nodes

    drbdadm create-md r0

```output
You want me to create a v08 style flexible-size internal meta data block.
There appears to be a v08 flexible-size internal meta data block
already in place on /dev/mmcblk0p2 at byte offset 9391042560

Do you really want to overwrite the existing meta-data?
[need to type 'yes' to confirm] yes

initializing activity log
initializing bitmap (280 KB) to all zero
Writing meta data...
New drbd meta data block successfully created.
```

#### Aktiviere die Ressource

    drbdadm up r0

#### Definiere eine primäre Node

    drbdadm primary r0 --force

> ! Aufpassen, dieser Schritt soll nur auf einer Node durchgeführt werden

#### Du kannst verfolgen was DRBD macht

    watch cat /proc/drbd

> ! Du kannst das auf beiden Nodes verfolgen.

```output
version: 8.4.11 (api:1/proto:86-101)
srcversion: 78636C7E8D25CE9BA641329
0: cs:Connected ro:Secondary/Primary ds:UpToDate/UpToDate B r-----
ns:0 nr:635136 dw:9805764 dr:0 al:8 bm:0 lo:0 pe:0 ua:0 ap:0 ep:1 wo:d oos:0
```

#### Erstelle ein Dateisystem

Auf der primären Node erstellst du ein ext4 Dateisystem

    mkfs.ext4 /dev/drbd0

Das wars, du hast erfolgreich eine DRBD Ressource konfiguriert.

## STONITH

_Shoot the other node in the head [STONITH]_, also schieß der anderen Node in den Kopft, ist eine Technik die einen Zustand names _split brain_ verhindern soll. Es handelt sich hierbei um ein Problem das auftritt wenn beide Nodes glauben, dass sie der Hauptnode sind. Das passiert wenn sich beide Nodes nicht mehr über das Netzwerk via corosync sehen können. Unter Verwendung von geteilten Datenspeichern würde das deine Daten sofort zerstören. Wenn also eine Node zur Hauptnode wird, schießt sie im ersten Schritt der anderen Node in den Kopf. Vielleicht denkst du jetzt, was ist wenn sich beide Nodes zur gleichen Zeit eleminieren? Das kann tatsächlich passieren. Aber in den meisten Fällen ist eine Node schneller und ein Neustart beider Nodes ist immer besser als eine _split brain_ Situation auszulösen. Es gibt verschiedene "STONITH fencing" Einheiten. Manche können direkt in deinem Mainboard sitzen und über eine separate Netzwerkverbindung ausgeführt werden (IPMI) oder du kannst direkt die Stromversorgung über deine USV kappen. Bei dem SBC Cluster gibt es diese Einheiten aber nicht bzw. machen sie nicht wirklich Sinn. Das bpi-m64 hat auch keine STONITH Einheit aber es hat einen Hardware Watchdog installiert. Damit können wir ein drittes SBC verwenden das als ein iSCSI-SAN agiert und Node-Informationen über ein [LUN](https://www.minitool.com/lib/logical-unit-number.html) bereitstellt. Eine Node kann über dieses Geräte der anderen Node schreiben, dass sie sich selbst neustarten soll. Wenn eine Node die Verbindung zu dem iSCSI-Target verliert schluckt sie selbt sie giftige Pille und startet sich neu.

> Diese Artikel beinhalten gut erklärte Informationen über fencing, STONITH, SBD [Stonith Block Device] und Timeouts:
<br>
- [https://jwb-systems.com/high-availability-cluster-with-pacemaker-part-3-stonith/](https://jwb-systems.com/high-availability-cluster-with-pacemaker-part-3-stonith/)
<br>
- [https://documentation.suse.com/sle-ha/15-SP1/html/SLE-HA-all/cha-ha-storage-protect.html](https://documentation.suse.com/sle-ha/15-SP1/html/SLE-HA-all/cha-ha-storage-protect.html)
<br>
- [https://clusterlabs.org/pacemaker/doc/crm_fencing.html](https://clusterlabs.org/pacemaker/doc/crm_fencing.html)

### The third-party node

Du kannst einen weitern hochverfügbaren Cluster aufsetzen der LUN Informationen über das iSCSI Protokoll bereitstellt. Für diesen Beitrag werden dafür 2 bpi-m2+ verwendet um das LUN zu teilen. Du kannst die bisherige Anleituung dafür verwenden den Cluster aufzusetzen und den eMMC Speicher verwenden um den DRBD Datenspeicher zu installieren. Es wird gerade an einem Beitrag gearbeitet, der diese Installation beschreibt. Daher wird hier nur die iSCSI-Target installation beschrieben.

#### Installiere tgt

    apt update
    apt install tgt

#### Erstelle eine Image-Datei auf dem geteilten Datenspeichern

Das LUN benötigt nur eine Größe von 15 MB.

    mkdir -p /media/stonith_luns
    mount /dev/drbd0 /media/stonith_luns
    dd if=/dev/zero of=/media/stonith_luns/cluster-ab.img count=0 bs=1 seek=15M

#### Konfiguriere tgt

Hier kannst du tgt zeigen wo es die Image-Datei finden und die Konfiguration absichern.

    vi /etc/tgt/conf.d/cluster-ab_iscsi.conf

```conf
<target iqn.cluster-ab:lun-ab>

     # Provided device as an iSCSI target
     backing-store /media/stonith_luns/cluster-ab.img

     # You can secure the connection with credentials.
     # Change the password and secretpass to a secure one
     incominguser stonith-iscsi-user password
     outgoinguser stonith-iscsi-target secretpass

</target>
```

Neustarte den Service und prüfe ob deine Konfiguration registriert wurde.

    systemctl restart tgt
    tgtadm --mode target --op show

```output
Target 1: iqn.cluster-ab:lun-ab
    System information:
        Driver: iscsi
        State: ready
    I_T nexus information:
        I_T nexus: 8
            Initiator: iqn.1993-08.org.debian:01:82f5ba4c182 alias: node-a
            Connection: 0
                IP Address: 172.30.2.16
        I_T nexus: 9
            Initiator: iqn.1993-08.org.debian:01:c85f79c9ef9e alias: node-b
            Connection: 0
                IP Address: 172.30.2.17
    LUN information:
        LUN: 0
            Type: controller
            SCSI ID: IET     00010000
            SCSI SN: beaf10
            Size: 0 MB, Block size: 1
            Online: Yes
            Removable media: No
            Prevent removal: No
            Readonly: No
            SWP: No
            Thin-provisioning: No
            Backing store type: null
            Backing store path: None
            Backing store flags:
        LUN: 1
            Type: disk
            SCSI ID: IET     00010001
            SCSI SN: beaf11
            Size: 16 MB, Block size: 512
            Online: Yes
            Removable media: No
            Prevent removal: No
            Readonly: No
            SWP: No
            Thin-provisioning: No
            Backing store type: rdwr
            Backing store path: /media/stonith-luns/cluster-ab.img
            Backing store flags:
    Account information:
        stonith-iscsi-user
        stonith-iscsi-target (outgoing)
    ACL information:
        ALL

```

> Weitere Informationen:
  <br>
  [https://www.tecmint.com/setup-iscsi-target-and-initiator-on-debian-9/](https://www.tecmint.com/setup-iscsi-target-and-initiator-on-debian-9/)
  <br>
  [https://www.server-world.info/en/note?os=Debian_10&p=iscsi&f=2](https://www.server-world.info/en/note?os=Debian_10&p=iscsi&f=2)


### Der hochverfügbare Cluster

Zurück am hochverfügbaren Cluster verbindest du dich zuerst mit dem iSCSI-Target und konfigurierst die _STONITH Block Device_ im nächsten Schritt. Installiere dafür `open-iscsi` und verbinde dich mit dem iSCSI-Target:

    apt-get update
    apt-get install open-iscsi
    iscsiadm -m discovery -t st -p 172.30.2.20

```output
172.30.2.20:3260,1 iqn.cluster-ab:lun-ab
```

Folgende Datei wurde erzeugt und du kannst sich für dich konfigurieren

    vi /etc/iscsi/nodes/iqn.cluster-ab\:lun-ab/172.30.2.20\,3260\,1/default

Hier stellst du die Auth Methode von `none` auf folgende Einstellung:

    node.session.auth.authmethod = CHAP
    node.session.auth.username = stonith-iscsi-user
    node.session.auth.password = password
    node.session.auth.username_in = stonith-iscsi-target
    node.session.auth.password_in = secretpass

> Vergiss nicht, die Parameter 'password' und 'secretpass' auf deine Einstellungen am iSCSI-Target abzuändern.

Der Server soll sich mit dem iSCSI-Target nach einem Neustart automatisch verbinden.

    node.startup = automatic

Nun kannst du die iSCSI-Session neustarten

    service open-iscsi restart
    iscsiadm -m session

```output
tcp: [1] 172.30.2.20:3260,1 iqn.node-ac.rothirsch.tech:lun-node-ac (non-flash)
```

Überprüfe ob die Ausgabe von `fdisk -l` einen neuen Speicher namen _VIRTUAL-DISK_ anzeigt


```output
Disk /dev/sda: 15 MiB, 15728640 bytes, 30720 sectors
Disk model: VIRTUAL-DISK    
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
```

Du bist jetzt mit dem iSCSI-Target verbunden.

#### Konfiguriere SBD

    apt install sbd fence-agents

Du musst ein paar Zeilen in der Datei `/etc/default/sbd` abändern:

    # Find iSCSI target's device with fdisk -l and add it here
    SBD_DEVICE="/dev/sda"

    # The watchdog device you need for this is present and already configured
    SBD_WATCHDOG_DEV=/dev/watchdog


__! Neustarte__ beide Geräte und auf einem der beiden führst du folgende Befehle aus um die SBD Einheit zu erstellen:

    # Create the SBD device with timeouts for watchdog and sbd
    sbd -d /dev/sda -4 20 -1 10 create

    # Check what was written
    sbd -d /dev/sda dump

> Zur Information `sbd` ist kein Service, du musst ihn also nicht starten. Das wird das Pacemaker später für die übernehmen. Deshalb prüfen wir hier auch noch nicht ob die Konfiguration funktioniert hat.
<br>
Weiter Informationen:
[https://kb.linbit.com/stonith-using-sbd-storage-based-death](https://kb.linbit.com/stonith-using-sbd-storage-based-death)
<br>


## Pacemaker, Corosync - Aktiv/Passiv hochverfügbarer Cluster

Install and configure everything on both nodes

    apt update
    apt install crmsh corosync pacemaker

Prevent corosync and pacemaker from autostart on reboot because you want to check everything first if STONITH kills a node.

    systemctl disable corosync
    systemctl disable pacemaker

### /etc/corosync/corosync.conf


```conf
# Please read the corosync.conf.5 manual page
totem {
        version: 2

        # Corosync itself works without a cluster name, but DLM needs one.
        # The cluster name is also written into the VG metadata of newly
        # created shared LVM volume groups, if lvmlockd uses DLM locking.
        cluster_name: debian

        # crypto_cipher and crypto_hash: Used for mutual node authentication.
        # If you choose to enable this, then do remember to create a shared
        # secret with "corosync-keygen".
        # enabling crypto_cipher, requires also enabling of crypto_hash.
        # crypto works only with knet transport
        crypto_cipher: none
        crypto_hash: none
}

logging {
        # Log the source file and line where messages are being
        # generated. When in doubt, leave off. Potentially useful for
        # debugging.
        fileline: off
        # Log to standard error. When in doubt, set to yes. Useful when
        # running in the foreground (when invoking "corosync -f")
        to_stderr: yes
        # Log to a log file. When set to "no", the "logfile" option
        # must not be set.
        to_logfile: yes
        logfile: /var/log/corosync/corosync.log
        # Log to the system log daemon. When in doubt, set to yes.
        to_syslog: yes
        # Log debug messages (very verbose). When in doubt, leave off.
        debug: off
        # Log messages with time stamps. When in doubt, set to hires (or on)
        #timestamp: hires
        logger_subsys {
                subsys: QUORUM
                debug: off
        }
}

quorum {
        # Enable and configure quorum subsystem (default: off)
        # see also corosync.conf.5 and votequorum.5
        provider: corosync_votequorum
}

nodelist {
        # Change/uncomment/add node sections to match cluster configuration

        node {
                # Hostname of the node
                name: ehjd.rothirsch.tech
                # Cluster membership node identifier
                nodeid: 1
                # Address of first link
                ring0_addr: 172.30.2.16
                # When knet transport is used it's possible to define up to 8 links
                #ring1_addr: 192.168.1.1
        }
        node {
                # Hostname of the node
                name: ehje.rothirsch.tech
                # Cluster membership node identifier
                nodeid: 2
                # Address of first link
                ring0_addr: 172.30.2.17
                # When knet transport is used it's possible to define up to 8 links
                #ring1_addr: 192.168.1.1
        }
        # ...
}
```

Now restart corosync and start pacemaker after it

    service corosync restart
    service pacemaker start

You can now check if sbd recognizes both nodes

    sbd -d /dev/sda list

```output
0 node-a clear
1 node-b clear
```

Both hosts are online. We can check this with the command `crm_mon`.

```output
Cluster Summary:
  * Stack: corosync
  * Current DC: node-a (version 2.0.5-ba59be7122) - partition with quorum
  * Last updated: Mon Jul 25 18:13:22 2022
  * Last change:  Mon Jul 25 18:12:59 2022 by hacluster via crmd on node-a
  * 2 nodes configured
  * 0 resource instances configured

Node List:
  * Online: [ node-a node-b ]

Active Resources:
  * No active resources
```

### Resource configuration

#### Create a cluster configuration file

    vim cib.txt

```conf

# Define both cluster nodes
node 1: node-a
node 2: node-b

# Define the SBD for STONITH
primitive f_sbd_node_node-a stonith:fence_sbd devices=/dev/sda plug=node-a
primitive f_sbd_node_node-b stonith:fence_sbd devices=/dev/sda plug=node-b

# Create a shared IP address. The active node will use it.
primitive FOIP IPaddr \
        params ip=172.30.2.10 \
        meta target-role=Started
clone c_FOIP FOIP \
        params master-max=1 master-node-max=1 clone-max=2 clone-node-max=1 notify=true

# Tell corosync how to mount your DRBD shared storage on the active node
primitive drbd0 ocf:linbit:drbd \
        params drbd_resource=r0 \
        op start interval=0 timeout=240 \
        op stop interval=0 timeout=100
primitive drbd_fs-r0 Filesystem \
        params device="/dev/drbd0" directory="/media/r0" fstype=ext4
ms drbd_ms-r0 drbd0 \
        meta master-max=1 master-node-max=1 clone-max=2 clone-node-max=1 notify=true


colocation co_FOIP_DRBD inf: c_FOIP drbd_fs-r0 drbd_ms-r0:Master

order fs_after_drbd Mandatory: drbd_ms-r0:promote drbd_fs-r0:start
```

#### Create directory for r0 on both nodes

    mkdir -p /media/r0

#### Create directory for r0 on one node only

    # Stop all active resources
    crm configure property stop-all-resources=true

    # Replace all resources with the ones inside the cib.txt
    crm configure load replace cib.txt

> You do these steps only on either of the two nodes but you can watch what happens with `crm_mon` on the other node


#### Helpful commands

    # export
    crm configure show > cib.txt

    # update
    crm configure load update cib.txt

    # stop service
    crm resource stop <service>

    # Clean up
    crm resource cleanup

    # Move
    crm resource move <service> <other-node>
