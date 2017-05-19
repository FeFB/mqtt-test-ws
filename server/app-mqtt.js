import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';

import {CycleTest} from '../Test';
import {Util} from './Util';

Util.setAmountPayload(50);
Util.setPerPayload(100);

new CycleTest(10, Util.valuesWifi);
