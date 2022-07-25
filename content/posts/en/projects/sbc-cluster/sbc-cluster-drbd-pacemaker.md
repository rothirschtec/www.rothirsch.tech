---
Title:      SBC cluster: DRBD + Pacemaker (Banana Pi m64)
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

# SBC cluster: DRBD + Pacemaker (Banana Pi m64)

The goal of this post is, to show you how to configure a high available cluster configured with two single board computer. The cluster will use DRBD to replicate a storage system over the network. Both hosts will be connected through a Switch. So all incoming and outgoing connections and the storage replication will use the same subnet. Two other parts of the cluster are

- Pacemaker for resource management
- Corosync to provide good synchronicity

> !Tip: DRBD provides RAID 1 over a network. Corosync provides clustering infrastructure such as membership, messaging and quorum. crm_attribute - query and update Pacemaker cluster options and node attributes.

![For illustration, this image shows two bpi-m64 positioned parallel to each other, connected to the network and the power plug](content/images/posts/projects/sbc-cluster/bpi-m64_cluster_of_two_plugged_in_to_network_and_power.jpg "bpi-m64 cluster of two")

## Install Armbian

First of all you need to configure both hosts. Download an image, install it and login via SSH. You need two partitions. One for the operating system and one that will be configured as _RAID1 over ethernet_.

Download the image and sha file from Armbian https://www.armbian.com/bananapi-m64/ and check its integrity:

> !Tip: You can also download it via the command line but you have to rename it correctly to check integrity:
<br>
`wget https://redirect.armbian.com/region/EU/bananapim64/Bullseye_current`
<br>
`wget https://redirect.armbian.com/region/EU/bananapim64/Bullseye_current.sha`


    shasum -a 256 -c Armbian_*_bullseye_current_5.15.48.img.xz.sha

Flash the image to the sd card:

```
unxz Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img.xz
sudo dd if=Armbian_22.05.4_Bananapim64_bullseye_current_5.15.48.img of=/dev/<your device> bs=4M
```

> !Tip: You can find further instructions about flashing Armbian to a sd card here: [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-prepare-a-sd-card)

### Preparing partitions

The cluster for this post uses a 64GB - Class 10 sd card, so after flashing the image onto it you can create a second partition by decreasing the size of the first one. So after you have configured your device, you can use `fdisk` to resize your main partition and create the second one you'll use for _DRBD_.

Prepare partitions by start using fdisk

    fdisk /dev/mmcblk0

#### Show current partitions

    Command (m for help): p

    Disk /dev/mmcblk0: 59.48 GiB, 63864569856 bytes, 124735488 sectors
    Units: sectors of 1 * 512 = 512 bytes
    Sector size (logical/physical): 512 bytes / 512 bytes
    I/O size (minimum/optimal): 512 bytes / 512 bytes
    Disklabel type: dos
    Disk identifier: 0xe7f1ae5c

    Device         Boot Start       End   Sectors  Size Id Type
    /dev/mmcblk0p1       8192 123469823 123461632 58.9G 83 Linux

> !Tip: Be aware of the starting position of the partition. It shows you 8192 so you have to use this on resizing the partition


#### Delete partition

    Command (m for help): d
    Selected partition 1
    Partition 1 has been deleted.

#### Create first partition with a size of 16 Gigabyte

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

#### Create the second partition

You have to find the end sector of the first partition:

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

End shows you a value of 33562623 so increment it by one and create the next partition with it:

    Command (m for help): n
    Partition type
       p   primary (1 primary, 0 extended, 3 free)
       e   extended (container for logical partitions)
    Select (default p): p
    Partition number (2-4, default 2):
    First sector (2048-124735487, default 2048): 33562624
    Last sector, +/-sectors or +/-size{K,M,G,T,P} (33562624-124735487, default 124735487):

    Created a new partition 2 of type 'Linux' and of size 43,5 GiB.

#### Write anything to it

Most important, you have to write anything to the disk. Use __w__ to do that. Because we overwrite the partition where the operating system is installed on, you have to reboot the whole system before you can see the changes.

    Command (m for help): w
    The partition table has been altered.
    Syncing disks

### Startup the device

Unplug the sd card, insert it into the device and start up:

> !Tip: Use this link for further information about startup configuration options:  [https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login](https://docs.armbian.com/User-Guide_Getting-Started/#how-to-login)

Do this for both hosts then you're prepared for the rest of the post.



## DRBD

Install everything

```
apt update
apt install drbd-utils
```

### /etc/drbd.d/global_common.conf

    global {
        usage-count no;
    }
    common {

        handlers {
            # These are EXAMPLE handlers only.
            # They may have severe implications,
            # like hard resetting the node under certain circumstances.
            # Be careful when chosing your poison.
            pri-on-incon-degr "/usr/lib/drbd/notify-pri-on-incon-degr.sh; /usr/lib/drbd/notify-emergency-reboot.sh; echo b > /proc/sysrq-trigger ; reboot -f";
            pri-lost-after-sb "/usr/lib/drbd/notify-pri-lost-after-sb.sh; /usr/lib/drbd/notify-emergency-reboot.sh; echo b > /proc/sysrq-trigger ; reboot -f";
            local-io-error "/usr/lib/drbd/notify-io-error.sh; /usr/lib/drbd/notify-emergency-shutdown.sh; echo o > /proc/sysrq-trigger ; halt -f";
            #  Hook into Pacemaker's fencing
            # # fence-peer "/usr/lib/drbd/crm-fence-peer.sh";
            # # after-resync-target "/usr/lib/drbd/crm-unfence-peer.sh";
            # split-brain "/usr/lib/drbd/notify-split-brain.sh root";
            # out-of-sync "/usr/lib/drbd/notify-out-of-sync.sh root";
            # before-resync-target "/usr/lib/drbd/snapshot-resync-target-lvm.sh -p 15 -- -c 16k";
            # after-resync-target /usr/lib/drbd/unsnapshot-resync-target-lvm.sh;
        }

        startup {
            # wfc-timeout degr-wfc-timeout outdated-wfc-timeout wait-after-sb
            wfc-timeout 300;
            degr-wfc-timeout 120;
            outdated-wfc-timeout 120;
        }

        options {
            # cpu-mask on-no-data-accessible
            on-no-data-accessible io-error;
            #on-no-data-accessible suspend-io;
        }

        disk {
            # size max-bio-bvecs on-io-error fencing disk-barrier disk-flushes
            # disk-drain md-flushes resync-rate resync-after al-extents
            # c-plan-ahead c-delay-target c-fill-target c-max-rate
            # c-min-rate disk-timeout
            # # fencing resource-and-stonith;

            c-fill-target 100M;
            c-max-rate   1100M;
            c-plan-ahead    25;
            c-min-rate     40M;
        }

        net {


            #DRBD supports three distinct replication modes, allowing three degrees of replication synchronicity.
            #Protocol A

            #Asynchronous replication protocol. Local write operations on the primary node are considered completed as soon as the local disk write has finished, and the replication packet has been placed in the local TCP send buffer. In the event of forced fail-over, data loss may occur. The data on the standby node is consistent after fail-over; however, the most recent updates performed prior to the crash could be lost. Protocol A is most often used in long distance replication scenarios. When used in combination with DRBD Proxy it makes an effective disaster recovery solution. See Long-distance replication via DRBD Proxy, for more information.
            #Protocol B

            #Memory synchronous (semi-synchronous) replication protocol. Local write operations on the primary node are considered completed as soon as the local disk write has occurred, and the replication packet has reached the peer node. Normally, no writes are lost in case of forced fail-over. However, in the event of simultaneous power failure on both nodes and concurrent, irreversible destruction of the primary’s data store, the most recent writes completed on the primary may be lost.
            #Protocol C

            #Synchronous replication protocol. Local write operations on the primary node are considered completed only after both the local and the remote disk write(s) have been confirmed. As a result, loss of a single node is guaranteed not to lead to any data loss. Data loss is, of course, inevitable even with this replication protocol if all nodes (resp. their storage subsystems) are irreversibly destroyed at the same time.

            #By far, the most commonly used replication protocol in DRBD setups is protocol C.

            #The choice of replication protocol influences two factors of your deployment: protection and latency. Throughput, by contrast, is largely independent of the replication protocol selected.

            #See Configuring your resource for an example resource configuration which demonstrates replication protocol configuration.

            protocol B;

            # Tell DRBD to allow dual-primary. This is needed to enable
            # live-migration of our servers.
            # allow-two-primaries yes;

            # This tells DRBD what to do in the case of a split-brain when
            # neither node was primary, when one node was primary and when
            # both nodes are primary. In our case, we'll be running
            # dual-primary, so we can not safely recover automatically. The
            # only safe option is for the nodes to disconnect from one
            # another and let a human decide which node to invalidate.

            # Automatic split brain recovery policies
            # In order to be able to enable and configure WDRBD’s automatic split brain recovery policies, you must understand that WDRBD offers several configuration options for this purpose. WDRBD applies its split brain recovery procedures based on the number of nodes in the Primary role at the time the split brain is detected. To that end, WDRBD examines the following keywords, all found in the resource’s net configuration section:
            # _ after-sb-0pri. Split brain has just been detected, but at this time the resource is not in the Primary role on any host. For this option, WDRBD understands the following keywords:
            # - disconnect : Do not recover automatically, simply invoke the split-brain handler script (if configured), drop the connection and continue in disconnected mode.
            # - discard-younger-primary : Discard and roll back the modifications made on the host which assumed the Primary role last.
            # - discard-least-changes : Discard and roll back the modifications on the host where fewer changes occurred.
            # - discard-zero-changes : If there is any host on which no changes occurred at all, simply apply all modifications made on the other and continue.
            # _ after-sb-1pri. Split brain has just been detected, and at this time the resource is in the Primary role on one host. For this option, DRBD understands the following keywords:
            # - disconnect : As with after-sb-0pri, simply invoke the split-brain handler script (if configured), drop the connection and continue in disconnected mode.
            # - consensus : Apply the same recovery policies as specified in after-sb-0pri. If a split brain victim can be selected after applying these policies, automatically resolve. Otherwise, behave exactly as if disconnect were specified.
            # - call-pri-lost-after-sb : Apply the recovery policies as specified in after-sb-0pri. If a split brain victim can be selected after applying these policies, invoke the pri-lost-after-sb handler on the victim node. This handler must be configured in the handlers section and is expected to forcibly remove the node from the cluster.
            # - discard-secondary : Whichever host is currently in the Secondary role, make that host the split brain victim.
            # _ after-sb-2pri. Split brain has just been detected, and at this time the resource is in the Primary role on both hosts. This option accepts the same keywords as after-sb-1pri except discard-secondary and consensus.

            after-sb-0pri discard-younger-primary;
            after-sb-1pri discard-secondary;
            after-sb-2pri disconnect;
        }
    }

### /etc/drbd.d/r0.conf

    resource r0 {

        net {

                # This tells DRBD how to do a block-by-block verification of
                # the data stored on the backing devices. Any verification
                # failures will result in the effected block being marked
                # out-of-sync.
                verify-alg md5;

                # This tells DRBD to generate a checksum for each transmitted
                # packet. If the data received data doesn't generate the same
                # sum, a retransmit request is generated. This protects against
                # otherwise-undetected errors in transmission, like
                # bit-flipping. See:
                # http://www.drbd.org/users-guide/s-integrity-check.html
                data-integrity-alg md5;

                # Increase send buffer since we are on 1Gbs bonded network
                sndbuf-size 2048k;
                rcvbuf-size 1024k;
                max-buffers 36k;

        }
        disk {
                # This tells DRBD not to bypass the write-back caching on the
                # RAID controller. Normally, DRBD forces the data to be flushed
                # to disk, rather than allowing the write-back cachine to
                # handle it. Normally this is dangerous, but with BBU-backed
                # caching, it is safe. The first option disables disk flushing
                # and the second disabled metadata flushes.
                disk-flushes no;
                md-flushes no;
                disk-barrier no;

                # In case of error DRBD will operate in diskless mode, and carries
                # all subsequent I/O operations, read and write, on the peer node
                on-io-error detach;

                # Increase metadata activity log to reduce disk writing and
                # improve performance
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

### Create drbd disk

Overwrite partitions

    dd if=/dev/zero of=/dev/mmcblk0p2 bs=1M count=128

Start drbd

    service drbd start

Bring the device up on both hosts

    service drbd reload
    drbdadm create-md r0
    drbdadm up r0

Define one host as primary

    drbdadm primary r0 --force

You can watch what drbd does

    watch cat /proc/drbd

    version: 8.4.11 (api:1/proto:86-101)
    srcversion: 78636C7E8D25CE9BA641329
    0: cs:Connected ro:Secondary/Primary ds:UpToDate/UpToDate B r-----
    ns:0 nr:635136 dw:9805764 dr:0 al:8 bm:0 lo:0 pe:0 ua:0 ap:0 ep:1 wo:d oos:0


Create a ext4 filesystem

    mkfs.ext4 /dev/drbd0


## Pacemaker

Install everything

    apt update
    apt install crmsh corosync pacemaker

### /etc/corosync/corosync.conf

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

Now restart corosync and start pacemaker after it

    service corosync restart
    service pacemaker start

Both hosts are online. We can check this with the command `crm_mon`.

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
