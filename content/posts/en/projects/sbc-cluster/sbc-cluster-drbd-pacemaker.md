---
Title:      SBC cluster: DRBD, Pacemaker and corosync (Banana Pi m64)
Menuname:   HA Cluster
Summary:    High availability cluster on two Banana Pi m64
Language:   en
Keywords:   Banana Pi m64, Cluster, Singleboard Computer, SD Card, eMMC, Highavailability
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-08-05_10:29:28
Image:      content/images/posts/projects/sbc-cluster/Two-Clearfog-Pro-and-two-bpi-m64.jpg
Alt:        For illustration, this image shows two bpi-m64 positioned parallel to each  other inside an 1U case.
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   en/blog/projects/sbc-cluster/sbc-cluster-drbd-pacemaker.html
child:      none
parent:     none
template:   single-post.html
state:      ready
robots:     index, follow
---

# SBC cluster: DRBD, Pacemaker and corosync (Banana Pi m64)

The goal of this post is to show you how to set up a high available cluster, configured with two single board computers. The cluster will use DRBD to replicate a storage system over the network. Both single board computers [SBCs] will be connected through a switch. So all incoming and outgoing connections and the storage replication will use the same subnet. Two other tools for the cluster are:

- Pacemaker for resource management
- Corosync to provide good synchronicity

![For illustration, this image shows two bpi-m64 positioned parallel to each other inside an 1U case, connected to the network and the power plug](content/images/posts/projects/sbc-cluster/bpi-m64_cluster_of_two_plugged_in_to_network_and_power.jpg "bpi-m64 cluster of two")

## Parameters used for this guideline

SBCs          | IP addresses
------------- | -------------
cluster-ab    | 172.30.2.15
node-a        | 172.30.2.16
node-b        | 172.30.2.17
cluster-san   | 172.30.2.20

## Install Armbian (on your PC)

First of all you configure both SBCs. Download an image, flash it to a sd card and login via SSH afterwards. You need two partitions. One for the operating system and one that will be configured as _RAID1 over ethernet_.

Download the image and sha file from [Armbian](https://www.armbian.com/bananapi-64) and check its integrity:

> You can also download it via the command line but you have to rename it correctly to perform a valid integrity check:
<br>
`wget https://redirect.armbian.com/region/EU/bananapim64/Bullseye_current`
<br>
`wget https://redirect.armbian.com/region/EU/bananapim64/Bullseye_current.sha`

    shasum -a 256 -c Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img.xz.sha

Flash the image to the sd card:

```
unxz Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img.xz
sudo dd if=Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img of=/dev/<your-sdcard> bs=4M
```

> You can find further instructions about flashing Armbian to a sd card here: [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card)

## Preparing partitions (on your PC)

![To visualize, this picture shows a 64GB - Class 10 Micro sd card](content/images/posts/projects/sbc-cluster/64GB-Class10.png "64GB - Class 10 sd card")

For this cluster a 64GB - Class 10 sd card is used. So after flashing the image onto it you can create a second partition by decreasing the size of the first one. For this you can use `fdisk`.

![Do visualize this you can see an image the shows a bar with 25% width section referencing to a partition for the system and 75% section that represents the share storage](content/images/posts/projects/sbc-cluster/Partitioning.svg "bpi-m64 cluster of two")

### Change partitions with the tool fdisk

Find the name of your sd card

    fdisk -l

```output
Disk /dev/<your-sdcard>: 59,48 GiB, 63864569856 bytes, 124735488 sectors
Disk model: 1081 SD         
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0xe7f1ae5c
```

And start fdisk

    fdisk /dev/<your-sdcard>

#### Show current partitions

    Command (m for help): p

    Disk /dev/<your-sdcard>: 59.48 GiB, 63864569856 bytes, 124735488 sectors
    Units: sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 512 bytes
    I/O size (minimum/optimal): 512 bytes / 512 bytes
    Disklabel type: dos
    Disk identifier: 0xe7f1ae5c

    Device                Boot Start       End   Sectors  Size Id Type
    /dev/<your-sdcard>p1         8192 123469823 123461632 58.9G 83 Linux

> Be aware of the starting position of the partition. It shows you 8192 so you have to use this on resizing the partition.

#### Delete partition

Yes, you have to delete the system partition first. But `fdisk` doesn't really delete the partition at this point. You have start the writing process later on.

    Command (m for help): d
    Selected partition 1
    Partition 1 has been deleted.

#### Create the system partition with 16 Gigabyte

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

> Don't forget to set the right starting point for the first sector.

#### Create the second partition

Print the latest configuration to find the end position of the first partition.

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

The "end" column shows you a value of 33562623 so increment it by one and create the next partition with it:

    Command (m for help): n
    Partition type
       p   primary (1 primary, 0 extended, 3 free)
       e   extended (container for logical partitions)
    Select (default p): p
    Partition number (2-4, default 2):
    First sector (2048-124735487, default 2048): 33562624
    Last sector, +/-sectors or +/-size{K,M,G,T,P} (33562624-124735487, default 124735487):

    Created a new partition 2 of type 'Linux' and of size 43,5 GiB.

#### Write anything to the sd card

Most important, you have to write anything to the sd card. Use __w__ to do that.

    Command (m for help): w
    The partition table has been altered.
    Syncing disks

#### Boot the device

Unplug the sd card from the card reader, insert it into either of the devices and start up:

> Use this link for further information about possible options for _first startup_ of an Armbian device:  [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login)

Do this for both SBCs then you're prepared for the rest of the post.

## Cluster Node configuration

All nodes of a cluster should know each other. You could use the protocols DNS and DHCP for that purpose, but you can harden the set up a little more by adding host definitions to the `/etc/hosts` file.

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

### Reboot

When all configuration is done, reboot both Nodes.

## DRBD

You can use these instructions for both Nodes until it'll tell you not to do so. Start by install the necessary dependencies

    apt update
    apt install drbd-utils

#### /etc/drbd.d/global_common.conf

You can define global configuration options for your cluster here. This guideline is meant to be as lightweight as possible, so you can leave anything on default.

> There is a well explained global.conf on github from DRBD's vendor company linbit: [https://github.com/LINBIT/drbd-8.3/blob/master/scripts/drbd.conf.example](https://github.com/LINBIT/drbd-8.3/blob/master/scripts/drbd.conf.example)

#### vi /etc/drbd.d/r0.conf

What we configure is a resource that tells DRBD which disk or partition it should use for the share storage.

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

### Create the DRBD partition

#### Overwrite partition table

    dd if=/dev/zero of=/dev/mmcblk0p2 bs=1M count=128

#### Create the DRBD ressource on both nodes

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

#### Activate the resource

    drbdadm up r0

#### Define one host as primary

    drbdadm primary r0 --force

> ! Be ware, you only have to do this step on one node

#### You can watch what DRBD does

    watch cat /proc/drbd

> ! You can watch on both nodes

```output
version: 8.4.11 (api:1/proto:86-101)
srcversion: 78636C7E8D25CE9BA641329
0: cs:Connected ro:Secondary/Primary ds:UpToDate/UpToDate B r-----
ns:0 nr:635136 dw:9805764 dr:0 al:8 bm:0 lo:0 pe:0 ua:0 ap:0 ep:1 wo:d oos:0
```

#### Create a filesystem

On the primary node you create an ext4 filesystem

    mkfs.ext4 /dev/drbd0

That's it, you've successfully configured a DRBD resource

## STONITH

_Shoot the other node in the head [STONITH]_ is a technique that tries to prevent a state called _split brain_. This is a problem which occurs if both nodes in the cluster think, that they are the new main node. This happens when they can't see each other on the network via corosync. By using shared storage this will shred your data immediately. So each node which thinks it has to be the main node will first shoot the other node in the head, before it'll become the main node. You may think, what is if both nodes kill each other at the same time. This may be an issue but in most cases one Node is always faster and it is always better to restart both devices then to trigger a _split brain_ situation. There are multiple STONITH fencing devices. Some will sit directly inside your mainboard which you can execute over a separate ethernet connection like IPMI or you could power off the device by controlling your UPS. In the SBC cluster we can't find such devices and using some techniques won't make any sense. The bpi-m64 doesn't have such features but it provides a hardware watchdog. With it you can use a third-party node that'll serve as a iSCSI-SAN to provide node information inside a [LUN](https://www.minitool.com/lib/logical-unit-number.html). One node can write the other node that it should commit suicide. If a node loses the connection to the iSCSI-target it will also swallow the poison pill, means it will to a hard reset.

> These articles provide well explained information about fencing, STONITH, SBD [Stonith Block Device] and timeouts:
<br>
- [https://jwb-systems.com/high-availability-cluster-with-pacemaker-part-3-stonith/](https://jwb-systems.com/high-availability-cluster-with-pacemaker-part-3-stonith/)
<br>
- [https://documentation.suse.com/sle-ha/15-SP1/html/SLE-HA-all/cha-ha-storage-protect.html](https://documentation.suse.com/sle-ha/15-SP1/html/SLE-HA-all/cha-ha-storage-protect.html)
<br>
- [https://clusterlabs.org/pacemaker/doc/crm_fencing.html](https://clusterlabs.org/pacemaker/doc/crm_fencing.html)

### The third-party node

You can set up another high available node that'll provide you with LUN information via the iSCSI protocol. For this post two bpi-m2+ are used to share the LUN. You can use the explanation above and use the eMMC storage to create a DRBD storage device. There is a post in development which will explain this set up later on. In the meantime the installation of the iSCSI-SAN will be explained here in short.

![For illustration, this image shows two bpi-m64 and bpi-m2+ positioned parallel to each other inside an 1U case](content/images/posts/projects/sbc-cluster/bpi-m2p_and_bpi-m64_Cluster.jpg "bpi-m2p and bpi-m64 cluster of two")


#### Install tgt

    apt update
    apt install tgt

#### Create an image file on the shared storage

Das LUN benötigt nur eine Größe von 15 MB.

    mkdir -p /media/stonith_luns
    mount /dev/drbd0 /media/stonith_luns
    dd if=/dev/zero of=/media/stonith_luns/cluster-ab.img count=0 bs=1 seek=15M

#### Configure tgt

Here you can tell tgt where it finds the image and you can secure the configuration.

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

Restart the service and check if your configuration is present.

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

> More information:
  <br>
  [https://www.tecmint.com/setup-iscsi-target-and-initiator-on-debian-9/](https://www.tecmint.com/setup-iscsi-target-and-initiator-on-debian-9/)
  <br>
  [https://www.server-world.info/en/note?os=Debian_10&p=iscsi&f=2](https://www.server-world.info/en/note?os=Debian_10&p=iscsi&f=2)


### The highavailable cluster

Back on the high available cluster you'll connect to the iSCSI-Target first and configure the _STONITH Block Device_ next. Install `open-iscsi` and connect to the iSCSI target:

    apt-get update
    apt-get install open-iscsi
    iscsiadm -m discovery -t st -p 172.30.2.20

```output
172.30.2.20:3260,1 iqn.cluster-ab:lun-ab
```

Following file has been created and you will configure it to your needs

    vi /etc/iscsi/nodes/iqn.cluster-ab\:lun-ab/172.30.2.20\,3260\,1/default

You can change the authmethod from `none` to following.:

    node.session.auth.authmethod = CHAP
    node.session.auth.username = stonith-iscsi-user
    node.session.auth.password = password
    node.session.auth.username_in = stonith-iscsi-target
    node.session.auth.password_in = secretpass

> Don't forget to change the password and secretpass to your configuration

The server should connect to the iSCSI target on reboot so change `node.startup` to automatic

    node.startup = automatic

Now you can restart the service and check the iSCSI session

    service open-iscsi restart
    iscsiadm -m session

```output
tcp: [1] 172.30.2.20:3260,1 iqn.node-ac.rothirsch.tech:lun-node-ac (non-flash)
```

Check `fdisk -l` and look if a new disk _VIRTUAL-DISK_ is present


```output
Disk /dev/sda: 15 MiB, 15728640 bytes, 30720 sectors
Disk model: VIRTUAL-DISK    
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
```

You're now connected to the iSCSI-Target.

#### Configure SBD

    apt install sbd fence-agents

You have to change a few lines inside `/etc/default/sbd` from default to this:

    # Find iSCSI target's device with fdisk -l and add it here
    SBD_DEVICE="/dev/sda"

    # The watchdog device you need for this is present and already configured
    SBD_WATCHDOG_DEV=/dev/watchdog


__! Restart__ both devices and on either of the two, do following afterwards to create the SBD device:

    # Create the SBD device with timeouts for watchdog and sbd
    sbd -d /dev/sda -4 20 -1 10 create

    # Check what was written
    sbd -d /dev/sda dump

> FYI `sbd` is not a service, so you don't have to start it. This will be done by pacemaker later on
<br>
More information:
[https://kb.linbit.com/stonith-using-sbd-storage-based-death](https://kb.linbit.com/stonith-using-sbd-storage-based-death)
<br>


## Pacemaker, Corosync - Active/Passive high availability cluster

Install and configure everything on both nodes unless the guideline tells you otherwise.

    apt update
    apt install crmsh corosync pacemaker

Disable corosync and pacemaker from autostart on reboot because you want to check everything first on any reboot.

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

Back to the SBD device, you're now able to list both nodes inside the LUN

    sbd -d /dev/sda list

```output
0 node-a clear
1 node-b clear
```

`crm_mon` ist the tool you can use to check the health of your cluster.

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

#### Cluster configuration file

Create a cluster configuration file in which you will define your cluster.

    vim cib.txt

```conf

# Define both cluster nodes
node 1: node-a
node 2: node-b

# Definde SBD
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

# Connect resource to each other. If the IP is activated on a node so will the shared storage.
colocation co_FOIP_DRBD inf: c_FOIP drbd_fs-r0 drbd_ms-r0:Master

# Order the start behaviour of ressources. In this case it will first be checked if the DRBD resource ist configured as primary on the active node before it mounts the filesystem
order fs_after_drbd Mandatory: drbd_ms-r0:promote drbd_fs-r0:start
```

#### DRBD directory

Create a directory for your DRBD resource (r0)

    mkdir -p /media/r0

#### Configure your cluster

You can now use your cluster definition to create the resources on your cluster.

    # To be more secure, stop all active resources first
    crm configure property stop-all-resources=true

    # Overwrite the existing configuration
    crm configure load replace cib.txt

> You do these steps only on either of the two nodes but you can watch what happens with `crm_mon` on the other node


#### Helpful commands

    # Export cluster definition
    crm configure show > cib.txt

    # Update cluster configuration
    crm configure load update cib.txt

    # Stop a service
    crm resource stop <service>

    # Clean up. If it seems that nothing doesn't work anymore
    crm resource cleanup

    # Move a service to the other node
    crm resource move <service> <other-node>
