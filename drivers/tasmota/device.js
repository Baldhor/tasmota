const Homey             = require('homey');
const SonoffTasmotaMqtt = require('sonoff-tasmota-mqtt');
const { delay }         = require('./utils');

module.exports = class TasmotaDevice extends Homey.Device {
  async onInit() {
    this.log(`device init: name = ${ this.getName() }, id = ${ this.getId() }, module type = ${ this.getModule() }, version = ${ this.getVersion() }, topic = ${ this.getTopic() }`);
    this.log('device init: class = ' + this.getClass() + ', capabilities: ' + this.getCapabilities().join(', '));
    
    // Register capability listeners
    if (this.getClass() == 'socket' && this.hasCapability('onoff.1')) {
      this.log('register capability listener: ' + 'onoff.1');
      this.registerCapabilityListener('onoff.1', this.onCapabilityOnoff1.bind(this))
    }
    
    if (this.getClass() == 'socket' && this.hasCapability('onoff.2')) {
      this.log('register capability listener: ' + 'onoff.2');
      this.registerCapabilityListener('onoff.2', this.onCapabilityOnoff2.bind(this))
    }
    
    if (this.getClass() == 'socket' && this.hasCapability('onoff.3')) {
      this.log('register capability listener: ' + 'onoff.3');
      this.registerCapabilityListener('onoff.3', this.onCapabilityOnoff3.bind(this))
    }
    
    if (this.getClass() == 'socket' && this.hasCapability('onoff.4')) {
      this.log('register capability listener: ' + 'onoff.4');
      this.registerCapabilityListener('onoff.4', this.onCapabilityOnoff4.bind(this))
    }
    
    if (this.getClass() == 'blinds' && this.hasCapability('windowcoverings_set')) {
      this.log('register capability listener: ' + 'windowcoverings_set');
      this.registerCapabilityListener('windowcoverings_set', this.onCapabilityWindowCoveringsSet.bind(this))
    }
    
    // Get MQTT connection handle.
    this.setUnavailable(Homey.__('mqtt.waiting'));
    await this.connect();

    // Register device with app.
    Homey.app.registerTasmotaDevice(this);

    // Start message loop.
    this.messageLoop();
  }

  getId() {
    return this.getData().id;
  }

  getModule() {
    return this.getStore().module;
  }

  getVersion() {
    return this.getStore().version;
  }

  getTopic() {
    return this.getSettings().topic;
  }

  async connect() {
    try {
      this.conn = await this.getDriver().getConnectionForDevice(this);
    } catch(e) {
      this.log('unable to get MQTT connection from driver');
      this.setUnavailable(Homey.__('mqtt.connection_error'));
      return;
    }

    // Still waiting for device.
    this.setUnavailable(Homey.__('device.waiting'));

    // Wait for device to return status.
    let status = await this.conn.wait();

    // We now know the device is online.
    this.setAvailable();
    this.log('device came online');

    // Update settings to reflect the values passed by the device.
    this.setSettings({
      powerOnState : String(status.PowerOnState),
      ledState     : String(status.LedState),
      topic        : status.Topic,
    });

    // Update on/off status
    if (this.getClass() == 'socket') {
      if (this.hasCapability('onoff.1')) {
        this.onPowerXReceived(1, !!status.Power1);
      }
      if (this.hasCapability('onoff.2')) {
        this.onPowerXReceived(2, !!status.Power2);
      }
      if (this.hasCapability('onoff.3')) {
        this.onPowerXReceived(3, !!status.Power3);
      }
      if (this.hasCapability('onoff.4')) {
        this.onPowerXReceived(4, !!status.Power4);
      }
    }

    // Maintain online/offline status.
    this.conn.on('online', () => {
      this.log('device came online');
      this.setAvailable();
    }).on('offline', () => {
      this.log('device went offline');
      this.setUnavailable(Homey.__('device.connection_lost'));
    });
  }

  sendCommand(command, payload) {
    this.conn.sendCommand(command, payload);
    return this;
  }

  async messageLoop() {
    while (true) {
      let { command, payload } = await this.conn.nextMessage();
      this.log('message received:', command, payload);

      if (this.getClass() == 'socket') {
        this.log('checking for socket device');
        if (command === 'state') {
          this.log('checking state command for socket device');
          if(payload['POWER1'] && this.hasCapability('onoff.1')) {
            this.onPowerXReceived(1, payload['POWER1']);
          }
          else if(payload['POWER2'] && this.hasCapability('onoff.2')) {
            this.onPowerXReceived(2, payload['POWER2']);
          }
          else if(payload['POWER3'] && this.hasCapability('onoff.3')) {
            this.onPowerXReceived(3, payload['POWER3']);
          }
          else if(payload['POWER4'] && this.hasCapability('onoff.4')) {
            this.onPowerXReceived(4, payload['POWER4']);
          }
        }
        else if (command === 'power1' && this.hasCapability('onoff.1')) {
          this.onPowerXReceived(1, payload);
        }
        else if (command === 'power2' && this.hasCapability('onoff.2')) {
          this.onPowerXReceived(2, payload);
        }
        else if (command === 'power3' && this.hasCapability('onoff.3')) {
          this.onPowerXReceived(3, payload);
        }
        else if (command === 'power4' && this.hasCapability('onoff.4')) {
          this.onPowerXReceived(4, payload);
        }
      }
      else if (this.getClass() == 'blinds' && this.hasCapability('windowcoverings_set')) {
        this.log('checking for blinds device');
        if (command == 'shutter1') {
          this.onShutter1PositionReceived(payload);
        }
        else if (command == 'sensor' && payload['Shutter1'] && payload['Shutter1']['Position']) {
          this.onShutter1PositionReceived(payload['Shutter1']['Position']);
        }
        else if (command == 'result' && payload['Shutter1'] && payload['Shutter1']['Position']) {
          this.onShutter1PositionReceived(payload['Shutter1']['Position']);
        }
      }
    }
  }
  
  onPowerXReceived(switchNr, data) {
    this.log('power' + switchNr + ' received:', data);
    this.setCapabilityValue('onoff.' + switchNr, data === 'ON');
  }

  onShutter1PositionReceived(data) {
    this.log('shutter1 position received:', data);
    this.setCapabilityValue('windowcoverings_set', parseFloat(data) / 100);
  }

  async onCapabilityOnoff1(value) {
    this.sendCommand('power1', value ? 'on' : 'off');
    return true;
  }

  async onCapabilityOnoff2(value) {
    this.sendCommand('power2', value ? 'on' : 'off');
    return true;
  }

  async onCapabilityOnoff3(value) {
    this.sendCommand('power3', value ? 'on' : 'off');
    return true;
  }

  async onCapabilityOnoff4(value) {
    this.sendCommand('power4', value ? 'on' : 'off');
    return true;
  }
  
  async onCapabilityWindowCoveringsSet(value) {
     if (value <= 0)
	this.sendCommand('shutterclose');
     else if (value >= 1)
	this.sendCommand('shutteropen');
     else
	this.sendCommand('shutterposition', String(value * 100));
    return true;
  }
  
  onDeleted() {
    this.log('being deleted, cleaning up');
    Homey.app.unregisterTasmotaDevice(this);
    this.conn && this.conn.end();
  }

  async onSettings(oldSettings, newSettings, changedKeys, callback) {
    // Check if any MQTT credentials have changed, in which case we need to
    // make sure they are valid before accepting them.
    if (changedKeys.find(k => k.startsWith('mqtt'))) {
      try {
        let conn = await this.getDriver().getConnectionForDevice(this, {
          retry    : false,
          settings : newSettings
        });

        // End old client.
        this.conn && this.conn.end();

        // Start using new client.
        this.conn = conn;
      } catch(e) {
        return callback(Error(Homey.__('mqtt.connection_error')));
      }
    }

    if (changedKeys.includes('powerOnState')) {
      try {
        let result = await this.conn.sendCommand('poweronstate', newSettings.powerOnState).waitFor('result.poweronstate');
        // Make sure the device reports back the new setting value.
        if (String(result) !== newSettings.powerOnState) {
          throw Error('VALUE_MISMATCH');
        }
      } catch(e) {
        return callback(e);
      }
    }

    if (changedKeys.includes('ledState')) {
      try {
        let result = await this.conn.sendCommand('ledstate', newSettings.ledState).waitFor('result.ledstate');
        // Make sure the device reports back the new setting value.
        if (String(result) !== newSettings.ledState) {
          throw Error('VALUE_MISMATCH');
        }
      } catch(e) {
        return callback(e);
      }
    }

    // Accept new settings.
    return callback();
  }
}
