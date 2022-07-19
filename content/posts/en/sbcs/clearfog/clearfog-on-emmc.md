---
Title:      Clearfog on eMMC
Menuname:   Clearfog eMMC
Summary:    Description about operating system installation on eMMC storage
Language:   en
Keywords:   Clearfog, eMMC
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-19_16:56:56
Image:      content/images/posts/sbcs/clearfog/Clearfog_Pro_case_front.png
Alt:        Clear Pro
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   en/blog/sbcs/clearfog/clearfog-on-emmc.html
child:      none
parent:     none
template:   single-post.html
robots:     index, follow
---

# Clearfog on eMMC

- Power up the Clearfog
- Wait a few minutes for the U-Boot image to download
- !! Hit a key to stop autoboot !!
- - Wait for it. It'll come faster then you think
- Configure the eMMC to boot from hardware boot partition

### PC (kwboot terminal)

    mmc partconf 0 1 1 0
    date reset
    run bootcmd_usb0

login with _root_

    mount /dev/sda1 /mnt
    dd if=$(ls /mnt/extlinux/Armbian_*.*.*_Clearfogpro_buster_current_*.*.*.img)  of=/dev/mmcblk0 bs=1M conv=fsync
    hdparm -z /dev/mmcblk0
    umount /mnt/
    mount /dev/mmcblk0p1 /mnt/


    [  432.634521] EXT4-fs (mmcblk0p1): couldn't mount as ext3 due to feature incompatibilities
    [  432.643043] EXT4-fs (mmcblk0p1): couldn't mount as ext2 due to feature incompatibilities
    [  432.658936] EXT4-fs (mmcblk0p1): mounted filesystem with writeback data mode. Opts: (null)


    echo 0 > /sys/block/mmcblk0boot0/force_ro
    dd if=$(ls /mnt/usr/lib/linux-u-boot-current-clearfogpro_*_armhf/u-boot.emmc)  of=/dev/mmcblk0boot0
    sed -i 's/emmc_fix=off/emmc_fix=on/g' /mnt/boot/armbianEnv.txt
    umount /mnt/
    poweroff

### PC (a second terminal)

    killall kwboot
    screen /dev/ttyUSB0 115200

### Clearfog

- Unplug power adapter
- Set jumpers to **0 0 1 1 1**

![Jumper eMMC](content/images/posts/sbcs/clearfog/Clearfog_Jumper_eMMC.jpg "Jumper eMMC")

- Plugin power jack

Now you should see Armbian booting up in the terminal were you executed the _screen_ command


## Sources
- <a href"https://forum.armbian.com/topic/6525-installing-armbian-on-clearfog-pro-emmc-using-tftp/" target="_blank">First insights (armbian.com)</a>
- <a href="https://wiki.solid-run.com/doku.php?id=products:a38x:software:os:debian" target="_blank">Maintainers installation guide (wiki.solid-run.com)</a>
- <a href="https://forum.armbian.com/topic/5868-clearfog-base-with-emmc-first-boot-tutorial/" target="_blanc">First hint for armbian bootloader installation (armbian.com)</a>
- <a href="https://github.com/nightseas/arm_applications/blob/master/doc/getting_started_with_clearfog_base.md#boot-from-usb-disk----download-armbian-to-emmc" target="_blank">Final Armbian bootloader installation hint</a>
