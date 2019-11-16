# Tasmota

Control devices running Tasmota firmware using Homey (through MQTT).

### Introduction

This app supports devices running the (unofficial) [Sonoff-Tasmota](https://github.com/arendst/Sonoff-Tasmota/) firmware. However, installing an alternative firmware requires you to open up the device (voiding its warranty), soldering connectors to it, and flashing the firmware using a USB-to-serial dongle. It also requires an MQTT broker to be running; you can use the Homey [MQTT Broker](https://apps.athom.com/app/nl.scanno.mqttbroker) app for this.
Alternatively, the convert-tuya solution may (if you are lucky) help you to install the Sonoff-Tasmota firmware without soldering(https://github.com/ct-Open-Source/tuya-convert).

I hereby deny all responsabilties in the usage of above information or the application hereby provided for "free" and under your own responsability.

### Tested devices

This driver has been tested with the following devices:

* Sonoff 4CH Rev2 (multiswitch)
* Teepao Smart Touch Switch (shutter)

### Issues

Please report issues here: ***to be completed***

### Icon Attribution

The initial application "Sonoff"(https://github.com/robertklep/name.klep.sonoff) was created by Robert Klep.
He also designed the generic driver for tasmota devices (but didn't finished it :) ).
=> I removed all contents related to "original" Sonoff devices, all contents related to "specific" tasmota devices, and focused only on the "generic" driver for tasmota (see tested devices).

### Changelog

* 1.0.0 (2019-11-09):
  * Initial beta release
  * Support switch, multiswitch (up to 4) and shutter
  * Tested with : Sonoff 4CH Rev2 (multiswitch) and Teepao Smart Touch Switch (shutter)
