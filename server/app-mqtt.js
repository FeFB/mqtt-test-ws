import {RxMqtt} from 'reactivex-mqtt';
import {Observable} from 'rxjs';

import {Test} from '../app/Test';
/*
* termux-api was modified to get wifiConnectionInfo from
* TermuxAPI
 */
var api = require('my-termux-api').default;

const PORT = 1883; // The Standard port for MQTT
const LOCAL = 'tcp://192.168.15.4:' + PORT;

var test = new Test(1, LOCAL, 100, 100, 100000);


/*var teste = api.createCommand().wifiConnectionInfo().build().run();

teste.getOutputObject().then(function(wifiInfo) {
  console.log('Connection: ', wifiInfo.rssi);
});
*/
