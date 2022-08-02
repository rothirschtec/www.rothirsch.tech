---
Title:      SBC cluster: DRBD + Pacemaker (Banana Pi m64)
Menuname:   HA Cluster
Summary:    High availability cluster auf zwei Banana Pi m64
Language:   de
Keywords:   Banana Pi m64, Cluster, Singleboard Computer, SD Card, eMMC, Hochverfügbarkeit
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-23_14:12:28
Image:      content/images/projects/sbc-cluster/Two-Clearfog-Pro-and-two-bpi-m64.jpg
Alt:        Zur Veranschaulichung, zeigt dieses Bild zwei bpi-m64 die nebeneinander positioniert sind.
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   de/blog/projects/sbc-cluster/sbc-cluster-drbd-pacemaker.html
child:      none
parent:     none
template:   single-post.html
state:      development
robots:     index, follow
---

# SBC cluster: DRBD + Pacemaker (Banana Pi m64)

In diesem Beitrag wird dir gezeigt, wie du einen hochverfügbaren Cluster mit zwei Single-Board-Computer konfigurierst. Der Cluster verwendet DRBD um den Datenspeicher über das Netzwerk zu replizieren. Beide Hosts sind über einen Switch verbunden. Also verwenden all einen eingehenden und ausgehenden Verbindungen sowie die Speicher Repliaktion das selbe Subnetz.

> !Tipp: DRBD bildet RAID 1 über ein Netzwerk

![Zur  Veranschaulichung, zeigt dieses Bild zwei bpi-m64 die nebeneinander gestellt sind und mit dem Netzwerk und an den Strom angeschlossen sind.](content/images/posts/projects/sbc-cluster/bpi-m64_cluster_of_two_plugged_in_to_network_and_power.jpg "bpi-m64 cluster bestehend aus zwei")

Als erstes musst du beide Hosts konfigurieren. Lade ein Image herunter, installiere es und melde dich an beiden Geräten mittels SSH an. Du brauchst zwei Partitionen, ein für das Betriebssystem und eine die als _RAID1 über Ethernet_ fungiert.
