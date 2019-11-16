const Homey             = require('homey');
const SonoffTasmotaMqtt = require('sonoff-tasmota-mqtt');
const constants         = require('./constants');

module.exports = class TasmotaDriver extends Homey.Driver {
  async onInit() {
    this.log('[init]');
    this.registerFlowTriggers();
    this.registerFlowActions();
    this.connections = {};
  }

  registerFlowTriggers() {
    this.triggers     = {};
    
    // Triggers for socket
    for (let switchNr = 1; switchNr <= 4; switchNr++) {

      [ 'on', 'off' ].forEach(type => {
        let prop     = `switch-${ switchNr }-${ type }`;
        let flowName = `tasmota-for-homey-${ prop }`;

        // Register flow trigger
        this.triggers[prop] = new Homey.FlowCardTriggerDevice(flowName).register();
      });
    }
    
    // Triggers for shutter
    [ 'opened', 'closed' ].forEach(type => {
      let prop     = `shutter-${ type }`;
      let flowName = `tasmota-for-homey-${ prop }`;

      // Register flow trigger
      this.triggers[prop] = new Homey.FlowCardTriggerDevice(flowName).register();
    });
  }

  registerFlowActions() {
    this.actions     = {};
    
    // Actions for socket
    for (let switchNr = 1; switchNr <= 4; switchNr++) {
      [ 'on', 'off', 'toggle' ].forEach(type => {
        let prop     = `switch-${ switchNr }-${ type }`;
        let flowName = `tasmota-for-homey-${ prop }`;

        // Register flow action
        this.actions[prop]= new Homey.FlowCardAction(flowName)
            .register()
            .registerRunListener((args, state) => {
              return args.device.onFlowCardAction(flowName, args, state);
            });
      });
    }
    
    // Actions for shutter
    [ 'open', 'stop', 'close' ].forEach(type => {
      let prop     = `shutter-${ type }`;
      let flowName = `tasmota-for-homey-${ prop }`;

      // Register flow action
      this.actions[prop]= new Homey.FlowCardAction(flowName)
          .register()
          .registerRunListener((args, state) => {
            return args.device.onFlowCardAction(flowName, args, state);
          });
    });
  }

  async getConnectionForDevice(device, { retry = true, settings = null } = {}) {
    const { mqttHost, mqttPort, mqttUser, mqttPassword } = settings || device.getSettings();
    let conn = await this.getConnection(mqttHost, mqttPort, mqttUser, mqttPassword, retry);
    return conn.registerDevice(device.getTopic());
  }

  async getConnection(host, port, username, password, retry = true) {
    let key = [ host, port, username, password ].join('\x00');
    let prefix = 'reusing';
    if (! this.connections[key]) {
      prefix = 'creating new';
      let client = new SonoffTasmotaMqtt(host, { port, username, password });
      this.connections[key] = client.connect({ retry }); // store the promise
    }
    this.log(prefix + ` MQTT connection to ${ host }:${ port }`);
    return await this.connections[key];
  }

  onPair(socket) {
    let conn, mqttCredentials;

    socket.on('pair.init', (data, callback) => {
      return callback(null, {
        mqttHost     : Homey.env.MQTT_HOST,
        mqttPort     : Homey.env.MQTT_PORT,
        mqttUser     : Homey.env.MQTT_USER,
        mqttPassword : Homey.env.MQTT_PASSWORD,
      });
    }).on('mqtt.test', async (data, callback) => {
      this.log(`testing MQTT broker @ ${ data.mqttHost }:${ data.mqttPort }`);
      let err = null;

      try {
        let { mqttHost, mqttPort, mqttUser, mqttPassword } = data;
        let client = new SonoffTasmotaMqtt(mqttHost, {
          port     : mqttPort,
          username : mqttUser,
          password : mqttPassword
        });
        conn = await client.connect({ retry : false });
        mqttCredentials = Object.assign({}, data);
        this.log('connection successful');
      } catch(e) {
        this.log('connection failed', e.message);
        err = { message : e.message };
      }
      return callback(err);
    }).on('device.list', async (data, callback) => {
      if (! conn) {
        return callback({ message : 'invalid pairing sequence' });
      }
      this.log('waiting for new device...');
      let device = conn.registerAnyDevice();

      // Wait for INFO1
      let info1 = await device.waitFor('info1');

      // Wait for STATUS5 (network status)
      let status5 = await device.sendCommand('status', '5').waitFor('status5');

      // Use device MAC as unique identifier.
      let id = status5.StatusNET.Mac;
      this.log('found device with id', id);

      // Check if we've already paired with this device.
      if (! (this.getDevice({ id }) instanceof Error)) {
        this.log('device is already paired');
        conn.unregisterAnyDevice();
        return callback(null, []);
      }
      this.log('device is not yet paired');

      // Build a list of capabilities that the device supports.
      let capabilities = [];

      this.log('checking power 1 support');
      if (await device.hasPowerSupport1()) {
        capabilities.push('onoff.1');
      }

      this.log('checking power 2 support');
      if (await device.hasPowerSupport2()) {
        capabilities.push('onoff.2');
      }

      this.log('checking power 3 support');
      if (await device.hasPowerSupport3()) {
        capabilities.push('onoff.3');
      }

      this.log('checking power 4 support');
      if (await device.hasPowerSupport4()) {
        capabilities.push('onoff.4');
      }

      this.log('checking shutter 1 support');
      if (await device.hasShutterSupport1()) {
        capabilities.push('windowcoverings_set');
      }

      this.log('detected device capabilities:', capabilities.join(', '));

      // Determine name for device (based on its MQTT topic).
      let name = device.getTopic();

      // Unregister listeners.
      conn.unregisterAnyDevice();

      // Compute the class of the device (it changes how it can be handled in homey app)
      let myclass= null;
      if (capabilities.includes('windowcoverings_set')) {
        this.log('got blinds device');
        myclass= 'blinds';
        capabilities= capabilities.filter(capability => {
          return ['windowcoverings_set'].includes(capability);
        });
      }
      else if (capabilities.includes('onoff.1')) {
        this.log('got socket device');
        myclass= 'socket';
        capabilities= capabilities.filter(capability => {
          return ['onoff.1', 'onoff.2', 'onoff.3', 'onoff.4'].includes(capability);
        });
      }
      else {
        this.log('got unsupported device');
        // Not supported
        return callback(null, []);
      }
      
      this.log('device class is ' + myclass + ', and its filtered capabilities are: ' + capabilities.join(', '));
      
      // Return the device data to the frontend.
      return callback(null, [{
        name  : name,
        class : myclass,
        data  : { id },
        store : {
          module  : info1.Module,
          version : info1.Version
        },
        settings : {
          topic         : name,
          fallbackTopic : info1.FallbackTopic,
          groupTopic    : info1.GroupTopic,
          powerOnState  : constants.POWER_ON_STATE_SAVED,
          ledState      : constants.LED_STATE_OFF,
          ...mqttCredentials
        },
        capabilities
      }]);
    }).on('error', err => {
      this.log('pairing socket error', err);
      conn && conn.end();
    }).on('disconnect', () => {
      // Called when pairing dialog is closed.
      this.log('connection closed');
      conn && conn.end();
    });
  }
}
