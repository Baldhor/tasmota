# Tasmota

Control devices running Tasmota firmware using Homey (through MQTT).

### Introduction

This app supports devices running the (unofficial) [Sonoff-Tasmota](https://github.com/arendst/Sonoff-Tasmota/) firmware. However, installing an alternative firmware requires you to open up the device (voiding its warranty), soldering connectors to it, and flashing the firmware using a USB-to-serial dongle. It also requires an MQTT broker to be running; you can use the Homey [MQTT Broker](https://apps.athom.com/app/nl.scanno.mqttbroker) app for this.
Alternatively, the [convert-tuya](https://github.com/ct-Open-Source/tuya-convert) solution may (if you are lucky) help you to install the Sonoff-Tasmota firmware without soldering.

I hereby deny all responsabilties in the usage of above information or the application hereby provided for "free" and under your own responsability.

### Tested devices

This driver has been tested with the following devices:

* Sonoff 4CH Rev2 (multiswitch)
* Teepao Smart Touch Switch (shutter)

### Issues

Please report issues here: https://github.com/Baldhor/tasmota

### Icon Attribution

The initial application [Sonoff](https://github.com/robertklep/name.klep.sonoff) was created by [Robert Klep](https://github.com/robertklep).
He also designed the generic driver for tasmota devices (but didn't finished it :) ).
=> I removed all contents related to "original" Sonoff devices, all contents related to "specific" tasmota devices, and focused only on the "generic" driver for tasmota (see tested devices).

### How to install
This app is not yet in Homey appstore, to install it you need to follow thiese steps:

1. Install Node.js

Download Node.js from [the Node.js website](https://nodejs.org/en/) and install it on your computer.

2. Install athom-cli

Open a command line, and install the athom-cli program by running the following command:

$ npm install -g homey

3. Install git

Download a git client (for example: https://git-scm.com/) and install it.

4. Clone the repository

$ git clone https://github.com/Baldhor/tasmota-for-homey.git

5. Go in the newly created folder

$ cd tasmota-for-homey

6. Install the application on your Homey

$ homey app install

7. Enjoy

And don't hesite to report any issue or even pull request/enhancement

### Changelog

* 1.0.0 (2019-11-09):
  * Initial beta release
  * Support switch, multiswitch (up to 4) and shutter
  * Tested with : Sonoff 4CH Rev2 (multiswitch) and Teepao Smart Touch Switch (shutter)
