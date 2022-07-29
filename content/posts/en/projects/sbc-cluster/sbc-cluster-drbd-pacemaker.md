---
Title:      SBC cluster: DRBD, Pacemaker and corosync (Banana Pi m64)
Menuname:   HA Cluster
Summary:    High availability cluster on two Banana Pi m64
Language:   en
Keywords:   Banana Pi m64, Cluster, Singleboard Computer, SD Card, eMMC, Highavailability
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-23_14:12:28
Image:      content/images/posts/projects/sbc-cluster/Two-Clearfog-Pro-and-two-bpi-m64.jpg
Alt:        For illustration, this image shows two bpi-m64 positioned parallel to each other.
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

The goal of this post is to show you how to set up a high available cluster, configured with two single board computer. The cluster will use DRBD to replicate a storage system over the network. Both hosts will be connected through a switch. So all incoming and outgoing connections and the storage replication will use the same subnet. Two other parts of the cluster are:

- Pacemaker for resource management
- Corosync to provide good synchronicity

![For illustration, this image shows two bpi-m64 positioned parallel to each other, connected to the network and the power plug](content/images/posts/projects/sbc-cluster/bpi-m64_cluster_of_two_plugged_in_to_network_and_power.jpg "bpi-m64 cluster of two")

## Install Armbian

First of all you need to configure both hosts. Download an image, install it and login via SSH. You need two partitions. One for the operating system and one that will be configured as _RAID1 over ethernet_.

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
sudo dd if=Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img of=/dev/<your device> bs=4M
```

> You can find further instructions about flashing Armbian to a sd card here: [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card)

## Preparing partitions

For the cluster a 64GB - Class 10 sd card is used, so after flashing the image onto it you can create a second partition by decreasing the size of the first one. So after you have configured your device, you can use `fdisk` to resize your main partition and create the second one you'll use for _DRBD_.

![Do visualize this you can see an image the shows a bar with 25% width section referencing to a partition for the system and 75% section that represents the share storage](content/images/posts/projects/sbc-cluster/Partitioning.png "bpi-m64 cluster of two")

Prepare partitions by start using fdisk

    fdisk /dev/mmcblk0

### Show current partitions

    Command (m for help): p

    Disk /dev/mmcblk0: 59.48 GiB, 63864569856 bytes, 124735488 sectors
    Units: sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 512 bytes
    I/O size (minimum/optimal): 512 bytes / 512 bytes
    Disklabel type: dos
    Disk identifier: 0xe7f1ae5c

    Device         Boot Start       End   Sectors  Size Id Type
    /dev/mmcblk0p1       8192 123469823 123461632 58.9G 83 Linux

> Be aware of the starting position of the partition. It shows you 8192 so you have to use this on resizing the partition


### Delete partition

Yes you have to delete the partition first. But `fdisk` doesn't really delete the partition at this point. You have to confirm this later on.

    Command (m for help): d
    Selected partition 1
    Partition 1 has been deleted.

### Create the first partition with a size of 16 Gigabyte

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

> Don't forget to use the right starting point for  the first sector

### Create the second partition with the rest size

Print the latest configuration to find the end position of the first partition.

    Command (m for help): p

    Disk /dev/sda: 59,48 GiB, 63864569856 bytes, 124735488 sectors
    Disk model: 1081 SD         
    Units: sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 512 bytes
    I/O size (minimum/optimal): 512 bytes / 512 bytes
    Disklabel type: dos
    Disk identifier: 0xe7f1ae5c

    Device     Boot Start      End  Sectors Size Id Type
    /dev/sda1        8192 33562623 33554432  16G 83 Linux

The end column shows you a value of 33562623 so increment it by one and create the next partition with it:

    Command (m for help): n
    Partition type
       p   primary (1 primary, 0 extended, 3 free)
       e   extended (container for logical partitions)
    Select (default p): p
    Partition number (2-4, default 2):
    First sector (2048-124735487, default 2048): 33562624
    Last sector, +/-sectors or +/-size{K,M,G,T,P} (33562624-124735487, default 124735487):

    Created a new partition 2 of type 'Linux' and of size 43,5 GiB.

### Write anything to it

Most important, you have to write anything to the disk. Use __w__ to do that.

    Command (m for help): w
    The partition table has been altered.
    Syncing disks

### Boot the device

Unplug the sd card, insert it into the device and start up:

> Use this link for further information about _first startup_ configuration _options_:  [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login)

Do this for both hosts then you're prepared for the rest of the post.

## DRBD

Install everything

```
apt update
apt install drbd-utils
```

### /etc/drbd.d/global_common.conf

The cluster works with this configuration but there are maybe better options that fit your purpose more. There is a well explained global.conf on github from DRBD's vendor company linbit: [https://github.com/LINBIT/drbd-8.3/blob/master/scripts/drbd.conf.example](https://github.com/LINBIT/drbd-8.3/blob/master/scripts/drbd.conf.example)

```conf
global {
    usage-count no;
}
common {
    startup {
        wfc-timeout 300;
        degr-wfc-timeout 120;
        outdated-wfc-timeout 120;
    }

    options {
        on-no-data-accessible io-error;
    }

    disk {
        c-fill-target 100M;
        c-max-rate   1100M;
        c-plan-ahead    25;
        c-min-rate     40M;
    }

    net {
        protocol B;
        after-sb-0pri discard-younger-primary;
        after-sb-1pri discard-secondary;
        after-sb-2pri disconnect;
    }
}
```

### /etc/drbd.d/r0.conf

```conf
resource r0 {

    net {
            verify-alg md5;
            data-integrity-alg md5;

            # Increase send buffer since we are on 1Gbs bonded network
            sndbuf-size 2048k;
            rcvbuf-size 1024k;
            max-buffers 36k;
    }
    disk {
            disk-flushes no;
            md-flushes no;
            disk-barrier no;
            on-io-error detach;
            al-extents 3389;
    }

    on ehjb.rothirsch.tech {
            device /dev/drbd0;
            disk /dev/mmcblk0p2;
            address 172.30.2.11:7788;
            meta-disk internal;
    }
    on ehjc.rothirsch.tech {
            device /dev/drbd0;
            disk /dev/mmcblk0p2;
            address 172.30.2.12:7788;
            meta-disk internal;
    }

  }
```

### Create drbd disk

Overwrite partition table

    dd if=/dev/zero of=/dev/mmcblk0p2 bs=1M count=128

Bring the device up on both hosts

    drbdadm create-md r0
    drbdadm up r0

Define one host as primary

    drbdadm primary r0 --force

You can watch what drbd does

    watch cat /proc/drbd

```output
version: 8.4.11 (api:1/proto:86-101)
srcversion: 78636C7E8D25CE9BA641329
0: cs:Connected ro:Secondary/Primary ds:UpToDate/UpToDate B r-----
ns:0 nr:635136 dw:9805764 dr:0 al:8 bm:0 lo:0 pe:0 ua:0 ap:0 ep:1 wo:d oos:0
```

Create an ext4 filesystem

    mkfs.ext4 /dev/drbd0

## STONITH

_Now it'll get really awesome._

_Shoot the other node in the head [STONITH]_ is a technique that tries to prevent something called _split brain_. This is a problem which occurs if both nodes in the cluster think, that they are the new main node. This happens when they can't see each other on the network via corosync and this will shred your data on a shared filesystem immediately. So each node which thinks it has to be the main node will first shoot the other node in the head, before it'll become the main node. There are multiple so called fencing techniques. Some will sit directly inside your mainboard which you can execute over a separate ethernet connection like IPMI or you could power off the the device by controlling your UPS. The bpi-m64 doesn't have such features but you can use a third node that'll serve as a SAN to provide node information inside a LUN. If something went wrong the node will no more appear on the storage device and will commit suicide, means it will perform a hard reset.

### The third node

You can setup a high available node that'll provide you with LUN information via the iSCSI protocol. For this post two bpi-m2+ are used to share the LUN. You can use the explanation above and use the eMMC storage to create a DRBD storage device. There is a post in development which will show the configuration of the bpi-m2+ as SAN later on. In the meantime the installation of the SAN will be explained here in short.

Install tgt

    apt update
    apt install tgt

Create an image file on the shared storage

    mkdir -p /media/stonith_luns
    mount /dev/drbd0 /media/stonith_luns
    dd if=/dev/zero of=/media/stonith_luns/ehjbc.rothirsch.tech.img count=0 bs=1 seek=15M

Now you can tell tgt to use this image file

    vi /etc/tgt/conf.d/ehjbc_iscsi.conf

```conf
<target iqn.ehjbc.rothirsch.tech:lun-ehjbc>

     # Provided device as an iSCSI target
     backing-store /media/stonith_luns/ehjbc.rothirsch.tech.img

     # You can secure the connection with credentials.
     # Change the password and secretpass to a secure one
     incominguser stonith-iscsi-user password
     outgoinguser stonith-iscsi-target secretpass

</target>
```

Restart the service and check if your configuration is present

    systemctl restart tgt
    tgtadm --mode target --op show

```output
Target 1: iqn.ehjbc.rothirsch.tech:lun-ehjbc
    System information:
        Driver: iscsi
        State: ready
    I_T nexus information:
        I_T nexus: 8
            Initiator: iqn.1993-08.org.debian:01:82f5ba4c182 alias: ehjb.rothirsch.tech
            Connection: 0
                IP Address: 172.30.2.11
        I_T nexus: 9
            Initiator: iqn.1993-08.org.debian:01:c85f79c9ef9e alias: ehjc.rothirsch.tech
            Connection: 0
                IP Address: 172.30.2.12
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
            Backing store path: /media/stonith-luns/ehjbc.img
            Backing store flags:
    Account information:
        stonith-iscsi-user
        stonith-iscsi-target (outgoing)
    ACL information:
        ALL

```

> Thanks to:
  <br>
  [https://www.tecmint.com/setup-iscsi-target-and-initiator-on-debian-9/](https://www.tecmint.com/setup-iscsi-target-and-initiator-on-debian-9/)
  <br>
  [https://www.server-world.info/en/note?os=Debian_10&p=iscsi&f=2](https://www.server-world.info/en/note?os=Debian_10&p=iscsi&f=2)


### The HA cluster

Back on the high available cluster you'll connect to the SANs LUN first and configure the _Storage Based Death_ fencing technique next

#### Connect to iSCSI Target

Install tgt and connect to iSCSI target

    apt-get update
    apt-get install open-iscsi
    iscsiadm -m discovery -t st -p <IP ADDRESS OF THE SAN>

```output
<IP ADDRESS OF THE SAN>:3260,1 iqn.ehjbc.rothirsch.tech:lun-ehjbc
```

Following file has been created we can configure it to our needs

    vi /etc/iscsi/nodes/iqn.ehjbc.rothirsch.tech\:lun-ehjbc/<IP ADDRESS OF THE SAN>\,3260\,1/default

You can change the authmethod from `none` to following.:

    node.session.auth.authmethod = CHAP
    node.session.auth.username = stonith-iscsi-user
    node.session.auth.password = password
    node.session.auth.username_in = stonith-iscsi-target
    node.session.auth.password_in = secretpass

> Don't forget to change password and secretpass to your configuration

And to let the server connect to the iSCSI target on reboot change following from `manual`

    node.startup = automatic

Now you can restart the service and check the iSCSI session

    service open-iscsi restart
    iscsiadm -m session

```output
tcp: [1] <IP ADDRESS OF THE SAN>:3260,1 iqn.ehjbc.rothirsch.tech:lun-ehjbc (non-flash)
```

On the iSCSI target you can check the connected devices

    tgtadm --mode conn --op show --tid 1

#### Configure SBD

    apt install sbd fence-agents

You have to change a few lines inside `/etc/default/sbd` from default to this:

    # Find LUN with fdisk -l and add it here
    SBD_DEVICE="/dev/sda"

    SBD_WATCHDOG_DEV=/dev/watchdog


Restart both devices and on one of both to following afterwards:

    # Create the SBD device
    sbd -d /dev/sda create

    # Check what was written
    sbd -d /dev/sda created

    # Check if both nodes are listed
    sbd -d /dev/sda list

```output
0 ehjb.rothirsch.tech clear
1 ehjc.rothirsch.tech clear
```


> Thanks to:  
<br>
[https://kb.linbit.com/stonith-using-sbd-storage-based-death](https://kb.linbit.com/stonith-using-sbd-storage-based-death)
<br>
[https://jwb-systems.com/high-availability-cluster-with-pacemaker-part-3-stonith/](https://jwb-systems.com/high-availability-cluster-with-pacemaker-part-3-stonith/)


## Pacemaker, Corosync - Active/Passive high availability cluster

Install everything

    apt update
    apt install crmsh corosync pacemaker

### /etc/corosync/corosync.conf

```conf
# Please read the corosync.conf.5 manual page
totem {
        version: 2

        # How long before declaring a token lost (ms)
        token: 3000

        # How many token retransmits before forming a new configuration
        token_retransmits_before_loss_const: 10

        # How long to wait for join messages in the membership protocol (ms)
        join: 60

        # How long to wait for consensus to be achieved before starting a new round of membership configuration (ms)
        consensus: 3600

        # Turn off the virtual synchrony filter
        vsftype: none

        # Number of messages that may be sent by one processor on receipt of the token
        max_messages: 20

        # Limit generated nodeids to 31-bits (positive signed integers)
        clear_node_high_bit: yes

        # Disable encryption
        secauth: off

        # How many threads to use for encryption/decryption
        threads: 0

        # Optionally assign a fixed node id (integer)
        # nodeid: 1234

        # CLuster name, needed for GFS2 and DLM or DLM wouldn't start
        #cluster_name: slcluster

        # This specifies the mode of redundant ring, which may be none, active, or passive.
        rrp_mode: none

        interface {
                ringnumber: 0
                bindnetaddr: 172.30.2.0
        }
        transport: udpu
}


amf {
        mode: disabled
}

service {
        # Load the Pacemaker Cluster Resource Manager
        ver:       0
        name:      pacemaker
}

aisexec {
        user:   root
        group:  root
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
        provider: corosync_votequorum
        two_node: 1
}

nodelist {
        # Change/uncomment/add node sections to match cluster configuration

        node {
                # Hostname of the node
                name: ehjb.rothirsch.tech
                # Cluster membership node identifier
                nodeid: 1
                # Address of first link
                ring0_addr: 172.30.2.11
        }
        node {
                # Hostname of the node
                name: ehjc.rothirsch.tech
                # Cluster membership node identifier
                nodeid: 2
                # Address of first link
                ring0_addr: 172.30.2.12
        }
        # ...
}
```

Now restart corosync and start pacemaker after it

    service corosync restart
    service pacemaker start

Both hosts are online. We can check this with the command `crm_mon`.

```output
Cluster Summary:
  * Stack: corosync
  * Current DC: ehjd.rothirsch.tech (version 2.0.5-ba59be7122) - partition with quorum
  * Last updated: Mon Jul 25 18:13:22 2022
  * Last change:  Mon Jul 25 18:12:59 2022 by hacluster via crmd on ehjd.rothirsch.tech
  * 2 nodes configured
  * 0 resource instances configured

Node List:
  * Online: [ ehjd.rothirsch.tech ehje.rothirsch.tech ]

Active Resources:
  * No active resources
```

### Resource configuration

Create a cluster configuration file

    vim cib.txt

```conf

# Define both cluster nodes
node 1: ehjb.rothirsch.tech
node 2: ehjc.rothirsch.tech

# Define the SBD for STONITH
primitive f_sbd_node_ehjb stonith:fence_sbd devices=/dev/sda plug=ehjb.rohtirsch.tech
primitive f_sbd_node_ehjc stonith:fence_sbd devices=/dev/sda plug=ehjc.rothirsch.tech

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

    # Stop all active resources
    crm configure property stop-all-resources=true

    # Replace all resources with the ones inside the cib.txt
    crm configure load replace cib.txt



#### Helpful commands

    # export
    crm configure show > cib.txt
    # update
    crm configure load update cib.txt

    # stop service
    crm resource stop fetchmail

    # Clean up
    crm resource cleanup dockerd

    # Move
    crm resource move dockerd <other-node>
