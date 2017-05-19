import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';

import {CycleTest} from '../Test';
import {Util} from './Util';


Util.setAmountPayload(100);
Util.setPerPayload(50);

new CycleTest(10, Util.valuesCable);
