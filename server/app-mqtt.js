import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';

import {CycleTest} from '../Test';
/*
* termux-api was modified to get wifiConnectionInfo from
* TermuxAPI
 */
var api = require('my-termux-api').default;

const PORT = 1883; // The Standard port for MQTT
const LOCAL = 'tcp://192.168.15.4:' + PORT;


var values = {
  qos: 2,
  brokerIP: LOCAL,
  amountPayload: 100,
  periodOfPublish: 100,
  timeTest: 90000
}

new CycleTest(5, values);

/*var teste = api.createCommand().wifiConnectionInfo().build().run();

teste.getOutputObject().then(function(wifiInfo) {
  console.log('Connection: ', wifiInfo.rssi);
});
*/
