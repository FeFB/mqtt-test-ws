import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';

import {CycleTest} from '../Test';
import {Util} from './Util';
/*
* termux-api was modified to get wifiConnectionInfo from
* TermuxAPI
 */
var api = require('my-termux-api').default;

new CycleTest(10, Util.valuesCable);
