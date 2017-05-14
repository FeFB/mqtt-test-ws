import {
  RxMqtt
} from 'reactivex-mqtt';
import {
  Observable,
  Subject
} from 'rxjs';
import {
  Util
} from './Util';

import {
  StaticsData
} from './StaticsData';

var Wireless = require('wireless');
/**
 * The Test Class responsible to connect MQTT, get times and listeners.
 */
const START_TEST = 'start';

export class Test {
  /**
   * Make a new Test Constructor
   * @param  {int} qos             [QoS Level for the test.]
   * @param  {String} brokerIP     [Broker's address used.]
   * @param  {int} amountPayload   [The Amount Payload requested]
   * @param  {int} periodOfPublish [Period in millisecond to send a payload]
   * @param  {int} timeTest        [TimeTest to completed the test]
   */
  constructor(qos, brokerIP, amountPayload, periodOfPublish, timeTest) {
    this.state = START_TEST;

    this.qos = qos;
    this.brokerIP = brokerIP;
    this.amountPayload = amountPayload;
    this.periodOfPublish = periodOfPublish;
    this.timeTest = timeTest


    /* This logic can be done with one Map where pckControl[key] = Date.now - pkgControl[key] */
    this.pkgControlSent = new Map(); //Used to save the time that a key payload was sent
    this.pkgControlACK = new Map(); //Used to save the time that a key payload's ACK was received
    this.pkgControlElapsed = new Map(); //Use to calculate the elapsedTime

    //It will alert that the Test Time Out reached.
    this.testTimeOut_ = Observable.interval(this.timeTest).take(1).share();

    //It will update some useInterfacef
    this.timeCount_ = Observable.interval(1000).takeUntil(this.testTimeOut_);

    //this.start();
    this.startObs().subscribe(x => {
      console.log(x);
    }, null, () => console.log('Complete'));

  }


  getPayloadInfo() {
    let obj = {
      topic: 'MQTT_TESTE',
      payload: 'Oi',
      options: {
        qos: this.qos
      }
    }
    return obj;
  }

  /**
   * it Calculate the elapse Time for ACK and Time Test
   * @return {void}
   */
  _calculateElapse() {

    this.endAt = new Date().getTime();
    this.elapseTimeTest = this.endAt - this.startAt;

    this.pkgControlSent.forEach((elem, id) => {
      if (this.pkgControlACK.has(id)) {
        let elapsed = this.pkgControlACK.get(id) - this.pkgControlSent.get(id).time;
        this.pkgControlElapsed.set(id, elapsed);
        //console.log('Id: ' + id + 'Elapsed: ' + elapsed);
      }
    });
  }

  _buildStaticData() {

    let ackAvg = 0;
    let acc = 0;

    this.pkgControlElapsed.forEach(elem => {
      acc = acc + elem;
    })
    // Ensure that will not have divison with zero
    ackAvg = ((acc === 0) ? 0 : (acc / this.pkgControlElapsed.size));

    this.sd = new StaticsData(this.qos, this.brokerIP, this.amountPayload, this.periodOfPublish,
      this.timeTest, ackAvg, this.pkgControlSent.size, this.startAt, this.endAt);

    console.log(this.sd.toString());
  }

  checkAllPayloadsWasSent(observer) {

    //Check if the test is done before the timeOut
    if (this.pkgControlACK.size === this.amountPayload) {
      //Calculat the elapse time of each ACK
      this._calculateElapse();

      //buld StaticsData()
      this._buildStaticData();
      //Set when close connnection is done
      this.client.on('close').subscribe(x => {
        //Complete and retrieve
        this.testTimeOutSub.unsubscribe();
        observer.complete();
      });

      this.client.end();
    }
  };



  startObs() {
    return Observable.create((observer) => {

      if (this.state === START_TEST) {
        // Create a Mqtt Connection with the brokerIP
        this.client = new RxMqtt(this.brokerIP);

        // Start Observable of TimeOut
        this.testTimeOutSub = this.testTimeOut_.subscribe(null, null, () => {
          console.log('Done');
          this._calculateElapse();
          observer.complete();
        });

        //Observe a 'connect sucessful'
        this.client.on('connect').subscribe(x => {

          observer.next(x);
          //Time that test Start
          this.startAt = new Date().getTime();

          this.client.publishWithInterval(this.periodOfPublish, this.amountPayload, this.getPayloadInfo.bind(this)).subscribe(null, (err) => console.log(err), () => {
            console.log('All publish request was sent');
          });

          //Detect and record the time that a package was sent.
          this.client.onPacketSend('publish').subscribe((x) => {
            // Get the packet's id
            let id = x.packet.messageId;
            //Check if the packet already was sent
            if (this.pkgControlSent.has(id)) {
              //If alread sent, update the times variable.
              let packet = this.pkgControlSent.get(id);
              packet.times = packet.times++;
              //Update packetControl variable
              this.pkgControlSent.set(id, packet);
            } else {
              //Create in the packetControl
              this.pkgControlSent.set(id, {
                time: new Date().getTime(), //time sent
                times: 1, //first time
              });
            }

            if (this.qos === 0) {
              this.pkgControlACK.set(id, new Date().getTime());
              this.checkAllPayloadsWasSent(observer);
            }

          });

          //Get the Time when a Puback arrives (the last one for QoS = 1)
          this.client.onPacketReceive('puback').subscribe(x => {
            let id = x.packet.messageId;
            this.pkgControlACK.set(id, new Date().getTime());
            this.checkAllPayloadsWasSent(observer);
          });

          //Get the time when a PubComp arrives (the last one for QoS = 2)
          this.client.onPacketReceive('pubcomp').subscribe(x => {
            let id = x.packet.messageId;
            this.pkgControlACK.set(id, new Date().getTime());
            this.checkAllPayloadsWasSent(observer);
          });
        });
      } //if end

    });
  }

}
