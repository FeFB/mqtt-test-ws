'use strict';

var _reactivexMqtt = require('reactivex-mqtt');

var api = require('my-termux-api').default;

const PORT = 1883; // The Standard port for MQTT
const LOCAL = 'tcp://192.168.15.4:' + PORT;

var client = new _reactivexMqtt.RxMqtt(LOCAL);

api.createCommand().toast().setText('Can you see me?').shortDuration().build().run();