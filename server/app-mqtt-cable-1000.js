import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';

import {CycleTest} from '../Test';
import {Util} from './Util';


Util.setAmountPayload(1000);
Util.setPerPayload(10);

new CycleTest(10, Util.valuesCable);
