import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';

import {CycleTestPingPong} from '../Test';
import {Util} from './Util';

new CycleTestPingPong(10, Util.valuesWifi);
