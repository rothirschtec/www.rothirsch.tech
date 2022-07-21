---
Title:      bpi-m64 over UART
Menuname:   bpi-m64 UART
Summary:    Bananapi M64 and UART
Language:   en
Keywords:   bpi-m64, banana pi, UART
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-07-19_16:31:31
Image:      content/images/posts/sbcs/bpi-m64/bpi-m64_UART_connected_to_USB2TLL_Adapter_CP2102_3.jpg
Alt:        bpi-m64 with a micro sd card
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   en/blog/posts/sbcs/bpi-m64-uart.html
child:      none
parent:     none
template:   single-post.html
state:      development
robots:     index, follow
---

# bpi-m64 over UART

This site represents a simple test for UART function on a bpi-m64.

For the test I used

- bpi-m64 v1.1 and 1.2
- Betemcu: BTE13-007 USB2TTL Adapter
- Armbian as operating system

## Warning

Some sites report that a wrong connection to the PINs could destroy the board. So please be careful.

## Exceptions

The **TX** and **RX** PINs are crossed on my configuration. So I have to plug in the **TX** Pin on the USB connector to **RX** on the Banana Pi board and vice versa.


![Alt text](content/images/posts/sbcs/bpi-m64/bpi-m64_UART_connected_to_USB2TLL_Adapter_CP2102_1.jpg"a title")
![Alt text](content/images/posts/sbcs/bpi-m64/bpi-m64_UART_connected_to_USB2TLL_Adapter_CP2102_2.jpg"a title")
![Alt text](content/images/posts/sbcs/bpi-m64/bpi-m64_UART_connected_to_USB2TLL_Adapter_CP2102_3.jpg"a title")

## How to connect

Plug in the 3 PINs on the Banana Pi and connect it with your PC or Notebook. On this device open a terminal and run

    screen /dev/ttyUSB0 115200

Now you can start the Banana Pi and the control it over your host.
