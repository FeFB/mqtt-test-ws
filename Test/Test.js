import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';
import {Util} from './Util';

import {StaticsData} from './StaticsData';

var api = require('my-termux-api').default;

/**
 * The Test Class responsible to connect MQTT, get times and listeners.
 */
const TEST_START = 'start';
const TEST_RUNNING = 'running';

export class Test {
  /**
   * Make a new Test Constructor
   * @param  {int} qos             [QoS Level for the test.]
   * @param  {String} brokerIP     [Broker's address used.]
   * @param  {int} amountPayload   [The Amount Payload requested]
   * @param  {int} periodOfPublish [Period in millisecond to send a payload]
   * @param  {int} timeTest        [TimeTest to completed the test]
   */
  constructor(obj) {
    this.state = TEST_START;

    this.qos = obj.qos;
    this.brokerIP = obj.brokerIP;
    this.amountPayload = obj.amountPayload;
    this.periodOfPublish = obj.periodOfPublish;
    this.timeTest = obj.timeTest

    //
    this.sentCount = 0;

    /* This logic can be done with one Map where pckControl[key] = Date.now - pkgControl[key] */
    this.pkgControlSent = new Map(); //Used to save the time that a key payload was sent
    this.pkgControlACK = new Map(); //Used to save the time that a key payload's ACK was received
    this.pkgControlElapsed = new Map(); //Use to calculate the elapsedTime

    //It will alert that the Test Time Out reached.
    this.testTimeOut_ = Observable.interval(this.timeTest).take(1).share();

    //It will update some useInterfacef
    this.timeCount_ = Observable.interval(1000).takeUntil(this.testTimeOut_);


    console.log(process.platform);
    //WifiInfo

    this.wifiInfo = api.createCommand().wifiConnectionInfo().build().run();
    if (this.wifiInfo) {
      this.wifiInfo.getOutputObject().then((info) => {
        console.log(info);
        this.connection_dbm = info.rssi;
        this.connection_level = info.rssi_level;
      })
    }

  }
  start(observer) {
    this._startTest().subscribe(null, null, () => {
      this._startRetrieve().subscribe(observer);
    });
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
    ackAvg = ((acc === 0)
      ? 0
      : (acc / this.pkgControlElapsed.size));

    this.sd = new StaticsData(this.qos, this.brokerIP, this.amountPayload, this.periodOfPublish, this.timeTest,
       ackAvg, this.sentCount, this.startAt, this.endAt, this.connection_dbm, this.connection_level);

    //  console.log(this.sd.toString());
  }

  checkAllPayloadsWasSent(observer) {

    //Check if the test is done before the timeOut
    if (this.pkgControlACK.size === this.amountPayload) {

      this.testTimeOutSub.unsubscribe();
      //Calculat the elapse time of each ACK
      this._calculateElapse();

      //buld StaticsData()
      this._buildStaticData();
      this.client.end();

      //Set when close connnection is done
      this.client.on('close').subscribe(x => {
        //Complete and retrieve
        observer.complete();
      });

    }
  };

  _endForTimeOut(observer) {
    this._calculateElapse();
    this.client.end();
    this._buildStaticData();

    //Set when close connnection is done
    this.client.on('close').subscribe(x => {
      //Complete and retrieve
      observer.complete();
    });
  }

  _startTest() {
    return Observable.create((observer) => {

      if (this.state === TEST_START) {
        //build a ID
        this.clientId = "MQTT_TEST_" + new Date().getTime();
        // Create a Mqtt Connection with the brokerIP
        this.client = new RxMqtt(this.brokerIP, {
          clientId: this.clientId,
          queueQoSZero: false
        });

        // Start Observable of TimeOut
        this.testTimeOutSub = this.testTimeOut_.subscribe(null, null, () => {
          console.log('TimeOut');
          this._endForTimeOut(observer);
        });

        //Observe a 'connect sucessful'
        this.client.on('connect').subscribe(x => {

          if (this.state === TEST_START) {
            //Get time when state was TEST_START
            //It avoid that a reconnection reset the startAt
            this.startAt = new Date().getTime();
            //Change state, now the test will run
            this.state = TEST_RUNNING;
            console.log('Connected,  test state: ' + this.state);
          }

          //observer.next('Connected');
          this.client.publishWithInterval(this.periodOfPublish, this.amountPayload, this.getPayloadInfo.bind(this)).subscribe(null, (err) => console.log(err), () => {
            console.log('PublishWithInterval is done');
          });

          //Detect and record the time that a package was sent.
          this.client.onPacketSend('publish').subscribe((x) => {
            this.sentCount++;
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

            //QoS == 0 will not receive a puback from Broker, so it will is save
            //when is fired
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

          this.client.on('reconnect').subscribe(x => console.log('Reconnect'));
          this.client.on('error').subscribe(x => console.console.log('Error'));

        });
      } //if end

    });
  }

  _startRetrieve() {
    return Observable.create((observer) => {
      // To broker identify that now is a Retrieve Mod
      this.clientId = 'retrieve#' + this.clientId;
      // Create a Mqtt Connection with the brokerIP
      this.client = new RxMqtt(this.brokerIP, {clientId: this.clientId});

      this.client.on('message').subscribe(x => {
        //console.log('' + x.message);
        this.sd.setDataFromBroker(x.message);
        //console.log(this.sd.toString());
        //The Observable is done
        observer.next(this.sd.getObjForCsv());

        this.client.end();
        observer.complete();
      });
    })
  }
}
