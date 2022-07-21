---
Title:      Install teamviewer on a bpi-m2
Menuname:   bpi-m2
Summary:    Installation instructions for for teamviewer on a bpi-m2
Language:   en
Keywords:   bpi-m2, banana pi
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-19_16:10:24
Image:      content/images/posts/sbcs/bpi-m2p/bpi-m2p_teamviewer.png
Alt:        bpi-m2p model with a teamviewer logo
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   en/blog/sbcs/bananapi/bpi-m2.html
child:      none
parent:     none
template:   single-post.html
state:      development
robots:     index, follow
---

# Install teamviewer on a bpi-m2

## Set up banana-pi-m2-plus with emmc storage and install teamviewer

For any further help, please feel free to use the [documentation](https://docs.armbian.com/) or the [forum](https://forum.armbian.com/) on armbian.com

## Where you can get it

We sell this board in Europe over Amazon. You can get more information on this site [http://bpi.rothirsch.local/#!bpi-m2p](http://bpi.rothirsch.local/#!bpi-m2p)

### Download and flash to sdCard

For our tests we'll use the CLI (command line interface) version of Armbian. Download the image from _https://www.armbian.com/banana-pi-m2-plus/_

    wget https://dl.armbian.com/bananapim2plus/Debian_stretch_next.7z

Flash it with 7zip piped to dd

    sudo apt update && sudo apt install p7zip

Find your SD card with sudo blkid and unmount it   

    sudo umount /dev/mmcblk0p*
    sudo 7za x Debian_stretch_next.7z -so | sudo dd of=/dev/mmcblk0 bs=4M

### Boot
Insert the sD card into the banana-pi-m2-plus plug in the network cable and a monitor before you start the device.

On your banana-pi-m2-plus login with password '1234' and update the system

    apt-get -y update && apt-get -y upgrade

Then install XFCE and dependencies

    apt-get -y install xorg lightdm xfce4 tango-icon-theme gnome-icon-theme

Reboot and you will see the gui
Next you can install teamviewer

    wget https://download.teamviewer.com/download/linux/teamviewer-host_armhf.deb
    dpg -i teamviewer-host_armhf.deb
    apt-get -f install

Now that everything is installed you can transport the operating system to the emmc storage with armbians tool nand-sata-install. This will take a few minutes.

    nand-sata-install


![Alt text](content/images/posts/sbcs/bpi-m2p/nand-to-sata_step1.png "a title")
![Alt text](content/images/posts/sbcs/bpi-m2p/nand-to-sata_step2.png "a title")
![Alt text](content/images/posts/sbcs/bpi-m2p/nand-to-sata_step3.png "a title")
![Alt text](content/images/posts/sbcs/bpi-m2p/nand-to-sata_step4.png "a title")
![Alt text](content/images/posts/sbcs/bpi-m2p/nand-to-sata_step5.png "a title")

#### nand-sata-install

## Finishing up

As soon as this is finished power off the system and remove the sdCard

![Alt text](content/images/posts/sbcs/bpi-m2p/Teamviewer_on_a_bpi-m2+.png "a title")

#### Teamviewer on a bpi-m2+
