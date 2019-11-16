const Homey = require('homey');

if (Homey.env.SYSLOG_HOST) {
  require('homey-syslog')();
}

module.exports = class TasmotaApp extends Homey.App {
  onInit() {
    this.log('TasmotaApp is running...');

    // Various debugging/development tools.
    Homey.env.INSPECTOR && require('inspector').open(9229, '0.0.0.0');
    Homey.env.UPLOADER  && require('homey-app-upload-lib')(this.manifest);

    // Let devices register themselves with the app (useful in settings).
    this.tasmotaDevices = [];
  }

  registerTasmotaDevice(device) {
    this.tasmotaDevices.push(device);
  }

  unregisterTasmotaDevice(device) {
    let id  = device.getData().id;
    let idx = this.tasmotaDevices.findIndex(d => d.getData().id === id);
    if (idx !== -1) {
      this.tasmotaDevices.splice(idx, 1);
    }
  }

  async apiListTasmotaDevices() {
    return this.tasmotaDevices;
  }
}
