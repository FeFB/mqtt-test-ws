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
   * The Object has:
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

    //It is to check how many times a publish was sent
    //Some situation it will send more than requested
    this.sentCount = 0;

    /* This logic can be done with one Map where pckControl[key] = Date.now - pkgControl[key] */
    this.pkgControlSent = new Map(); //Used to save the time that a key payload was sent
    this.pkgControlACK = new Map(); //Used to save the time that a key payload's ACK was received
    this.pkgControlElapsed = new Map(); //Use to calculate the elapsedTime

    //It will alert that the Test Time Out reached.
    this.testTimeOut_ = Observable.interval(this.timeTest).take(1).share();

  }

  /**
   * It starts the test.
   * @param  {function} getObserver It will return the Observer from your Parent class
   * It'd need to be bind(this)
   * @return {void}             nothing
   */
  start(getObserver) {

    //android or linux
    let platform = process.platform;

    //WifiInfo, this library just works on Android (Termux and TermuxAPI)
    if (platform === 'android') {
      this.wifiInfo = api.createCommand().wifiConnectionInfo().build().run();
      if (this.wifiInfo) {

        //It will called when is done
        this.wifiInfo.getOutputObject().then((info) => {
          this.connection_dbm = info.rssi;
          this.connection_level = info.rssi_level;

          this._realStart(getObserver);
        })
      }
    } else {
      this._realStart(getObserver);
    }
  }

  _realStart(getObserver) {
    this._startTest().subscribe(null, null, () => {
      this._startRetrieve(getObserver());
    });
  }
  /**
   * Private methodo that has the information
   * for each payload at a period. It'd use with bind(this)
   * @return {Object} [Objet that has: (topic:String , payload: String/Buffer, options : Objet )]
   */
  _getPayloadInfo() {
    let obj = {
      topic: 'MQTT_TESTE',
      payload: Util.payload,
      options: {
        qos: this.qos
      }
    }
    return obj;
  }

  /**
   * It calculates the elapsed Time for ACK and Time Test
   * @return {void}
   */
  _calculateElapse(endAt) {

    this.endAt = endAt;
    this.elapseTimeTest = this.endAt - this.startAt;

    this.pkgControlSent.forEach((elem, id) => {
      if (this.pkgControlACK.has(id)) {
        let elapsed = this.pkgControlACK.get(id) - this.pkgControlSent.get(id);
        this.pkgControlElapsed.set(id, elapsed);
        //console.log('Id: ' + id + 'Elapsed: ' + elapsed);
      }
    });
  }
  /**
   * It creates the StaticsData Object with all infromation of the test
   * @return {void} [nothing]
   */
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

    this.sd = new StaticsData(this.qos, this.brokerIP, this.amountPayload, this.periodOfPublish, this.timeTest, ackAvg, this.sentCount, this.startAt, this.endAt, this.connection_dbm, this.connection_level);

  }

  /**
   * It is called in every ack received to check if the test is done before the Test TimeOut
   * @param  {Observer} observer [The Observer on the Sent Observable]
   * @return {Void}          [nothing]
   */
  _checkAllPayloadsWasSent(observer) {

    //Check if the test is done before the timeOut
    if (this.pkgControlACK.size === this.amountPayload) {
      //Calculat the elapse time of each ACK
      this._calculateElapse(new Date().getTime());
      this.testTimeOutSub.unsubscribe();
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

  /**
   * If the Time Out is reached this function will
   * collect the date from here.
   * @param  {Observer} observer [Observer On sent Observable]
   * @return {void}          [nothing]
   */
  _endForTimeOut(observer) {
    this._calculateElapse(new Date().getTime());
    this.client.end();
    this._buildStaticData();

    //Set when close connnection is done
    this.client.on('close').subscribe(x => {
      //Complete and retrieve
      observer.complete();
    });
  }

  /**
   * It return a Observable with all the logic
   * for the test (Connect, send publish in period, get the acks etc.)
   * @return {[Observable]} [A stream with the test logic]
   */
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

        //Observe a 'connect sucessful'
        this.client.on('connect').subscribe(x => {

          if (this.state === TEST_START) {
            //Get time when state was TEST_START
            //It avoid that a reconnection reset the startAt
            this.startAt = new Date().getTime();
            //Change state, now the test will run
            this.state = TEST_RUNNING;
            // Start Observable of TimeOut
            this.testTimeOutSub = this.testTimeOut_.subscribe(null, null, () => {
              console.log('TimeOut');
              this._endForTimeOut(observer);
            })
            console.log('Connected,  test state: ' + this.state);
          }

          //observer.next('Connected');
          this.client.publishWithInterval(this.periodOfPublish, this.amountPayload, this._getPayloadInfo.bind(this)).subscribe(null, (err) => console.log(err), () => {
            console.log('PublishWithInterval is done');
          });

          //Detect and record the time that a package was sent.
          this.client.onPacketSend('publish').subscribe((x) => {
            this.sentCount++;
            // Get the packet's id
            let id = x.packet.messageId;
            //Check if the packet already was sent
            if (!this.pkgControlSent.has(id)) {
              //Create in the packetControl
              this.pkgControlSent.set(id, new Date().getTime());

              //QoS == 0 will not receive a puback from Broker, so it will is save
              //when is fired
              if (this.qos === 0) {
                this.pkgControlACK.set(id, new Date().getTime());
                this._checkAllPayloadsWasSent(observer);
              }
            }
          });

          //Get the Time when a Puback arrives (the last one for QoS = 1)
          this.client.onPacketReceive('puback').subscribe(x => {
            let id = x.packet.messageId;
            this.pkgControlACK.set(id, new Date().getTime());
            this._checkAllPayloadsWasSent(observer);
          });

          //Get the time when a PubComp arrives (the last one for QoS = 2)
          this.client.onPacketReceive('pubcomp').subscribe(x => {
            let id = x.packet.messageId;
            this.pkgControlACK.set(id, new Date().getTime());
            this._checkAllPayloadsWasSent(observer);
          });

        });
      } //if end

    });
  }
  /**
   * It creates a Observable to get the information saved in the broker
   * for the test
   * @return {Observable} [A Stream with the Retrieve Logic]
   */
  _startRetrieve(observer) {
      let obj = {
        state: 'WAIT_FOR_RETRIEVE',
        clientId: this.clientId,
        sd : this.sd
      }
      observer.next(obj);
      observer.complete();
  }

}
