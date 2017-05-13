import {RxMqtt} from 'reactivex-mqtt';
var api = require('my-termux-api').default;
const MIN_RSSI = -100;
const MAX_RSSI = -55;

const PORT = 1883; // The Standard port for MQTT
const LOCAL = 'tcp://192.168.15.4:' + PORT;

var client = new RxMqtt(LOCAL);

var teste = api.createCommand().wifiConnectionInfo().build().run();

teste.getOutputObject().then(function(wifiInfo) {
  console.log('Connection: ', wifiInfo.rssi);
});
