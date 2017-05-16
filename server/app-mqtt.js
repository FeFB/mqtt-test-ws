import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';

import {CycleTest} from '../Test';
import {Util} from './Util';

new CycleTest(10, Util.valuesWifi);
