---
Title:      Use bpi-m64
Menuname:   bpi-m64
Summary:    Tests and other stuff on a Bananapi M64
Language:   en
Keywords:   bpi-m64, banana pi
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-19_16:31:31
Image:      content/images/posts/sbcs/bpi-m64/bpi-m64_cable_and_card.png
Alt:        bpi-m64 with a micro sd card
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   en/blog/posts/sbcs/use-bpi-m64.html
child:      none
parent:     none
template:   single-post.html
state:      development
robots:     index, follow
---

# Use bpi-m64

## Tests and other stuff on a Bananapi M64

For any further help, please feel free to use the [documentation](https://docs.armbian.com/) or the [forum](https://forum.armbian.com/) on armbian.com

### Download and flash to sdCard

For our tests we'll use the CLI (command line interface) version of Armbian. Download the image from _https://www.armbian.com/bananapi-m64/_

    wget https://dl.armbian.com/bananapim64/Debian_stretch_next.7z

Flash it with 7zip piped to dd

    sudo apt update && sudo apt install p7zip

Search for your sdCard and unmount all partitions. Maybe _blkid_ helps here.

    sudo umount /dev/mmcblk0p*
    sudo 7za x Debian_stretch_next.7z -so | sudo dd of=/dev/mmcblk0 bs=4M

### Boot
After I plugged in the sdCard to the board the operating system started with the boot process. The bpi-m64 has 3 small (RGB) LEDs on the board. Only the red one lights up. After a few seconds the network card started to blink.


### Configure over UART
You can either configure the operating system with UART over USB, see here [http://blog.rothirsch.local/SBCs/banana_pi/bpi-m64/#!UART](http://blog.rothirsch.local/SBCs/banana_pi/bpi-m64/#!UART) or

### Configure over SSH
you configure it over SSH. Therefore I did a scan on my network with nmap do find the new board

    sudo nmap -sn 192.168.0.0/24

If you are not sure wich of them are the new one you can scan each of them or try to connect to ssh port 22.

    sudo nmap -A 192.168.0.100


    Starting Nmap 7.40 ( https://nmap.org ) at 2018-05-14 17:04 CEST
    Nmap scan report for 192.168.0.100
    Host is up (0.00021s latency).
    Not shown: 999 closed ports
    PORT   STATE SERVICE VERSION
    22/tcp open  ssh     OpenSSH 7.4p1 Debian 10+deb9u2 (protocol 2.0)
    | ssh-hostkey:
    |   2048 ... (RSA)
    |_  256 ... (ECDSA)
    Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

    Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
    Nmap done: 1 IP address (1 host up) scanned in 0.82 seconds


So we can connect to the board over SSH port 22.
The password is *1234*

    ssh -p 22 root@192.168.0.100


    The authenticity of host '192.168.0.100 (192.168.0.100)' can't be established.
    ECDSA key fingerprint is SHA256:...
    Are you sure you want to continue connecting (yes/no)? yes
    Warning: Permanently added '192.168.0.100' (ECDSA) to the list of known hosts.
    root@192.168.0.100's password:


Besides that you can see hardware information you have to change your password.

![Alt text](content/images/posts/sbcs/bpi-m64/Armbian_First_Start.png "Armbian first start")


#### First Start

## Warning

Unfortunately the board is not official supported by Armbian. This is because the maintainer of the bpi-m64 is not that accurate with information about there products. Nevertheless, the developers at Armbian working hard on getting this boards to run. So why not donate to them if you can do something with your board. You can [directly donate to them](https://www.armbian.com/donate/) over their site. A second option is, that you buy the bpi-m64 directly over our site [http://bpi.rothirsch.local/BananaPi/#!bpi-m64](http://bpi.rothirsch.local/BananaPi/#!bpi-m64). We will donate an euro to Armbian for each board we sell.


## Preparing the system for testing purpose

Before we do a few benchmarks we upgrade the system first.

    apt update && apt -y upgrade

Executing sysbench

    sysbench --test=cpu --cpu-max-prime=20000 run


    sysbench 0.4.12:  multi-threaded system evaluation benchmark

    Running the test with following options:
    Number of threads: 1

    Doing CPU performance benchmark

    Threads started!
    Done.

    Maximum prime number checked in CPU test: 20000


    Test execution summary:
      total time:                          44.4469s
      total number of events:              10000
      total time taken by event execution: 44.4350
      per-request statistics:
          min:                                  4.44ms
          avg:                                  4.44ms
          max:                                  4.62ms
          approx.  95 percentile:               4.45ms

    Threads fairness:
      events (avg/stddev):           10000.0000/0.00
      execution time (avg/stddev):   44.4350/0.00


## Source
[7z to dd](http://mark.koli.ch/howto-whole-disk-backups-with-dd-gzip-and-p7zip) http://mark.koli.ch/howto-whole-disk-backups-with-dd-gzip-and-p7zip)

[nmap](https://hackertarget.com/nmap-cheatsheet-a-quick-reference-guide/) https://hackertarget.com/nmap-cheatsheet-a-quick-reference-guide/
