import {RxMqtt} from 'reactivex-mqtt';
import {Observable, Subject} from 'rxjs';
import {Util} from './Util';

import {StaticsData} from './StaticsData';

var api = require('my-termux-api').default;

/**
 * The Test2 Class responsible to connect MQTT and does a ping pong test
 */
const TEST_START = 'start';
const TEST_RUNNING = 'running';

export class Test2 {
  /**
   * Make a new Test Constructor
   * The Object has:
   * @param  {int} qos             [QoS Level for the test.]
   * @param  {String} brokerIP     [Broker's address used.]
   * @param  {int} timeTest        [TimeTest to completed the test]
   */
  constructor(obj) {
    this.state = TEST_START;

    this.qos = obj.qos;
    this.brokerIP = obj.brokerIP;
    this.timeTest = obj.timeTest

    //It is to check how many times a publish was sent
    //Some situation it will send more than requested
    this.sentCount = 0;

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
    this._startTest().subscribe(getObserver());
  }

  /**
   * It creates the StaticsData Object with all infromation of the test
   * @return {void} [nothing]
   */
  _buildStaticData() {

    this.sd = new StaticsData(this.qos, this.brokerIP, null, null, this.timeTest, null, this.sentCount, null, null, this.connection_dbm, this.connection_level);

  }

  /**
   * If the Time Out is reached this function will
   * collect the date from here.
   * @param  {Observer} observer [Observer On sent Observable]
   * @return {void}          [nothing]
   */
  _endForTimeOut(observer) {

    this.client.end();
    this._buildStaticData();

    //Set when close connnection is done
    this.client.on('close').subscribe(x => {
      //Complete and retrieve
      observer.next(this.sd.getObjForCsvPingPong());
      observer.complete();
    });
  }

  _publish() {
    this.client.client.publish('MQTT_TESTE', Util.payload, {qos: this.qos});
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
          queueQoSZero: true
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
            if (this.qos === 0) {
              this.client.subscribe('MQTT_TESTE_2');
            }
            this._publish();
            console.log('Connected,  test state: ' + this.state);
          }

          //Detect and record the time that a package was sent.
          this.client.onPacketSend('publish').subscribe((x) => {
            this.sentCount++;
          });

          this.client.on('message').subscribe((x) => {
            this._publish();
          });

          if (this.qos === 1) {
            this.client.onPacketReceive('puback').subscribe(x => this._publish())
          }

          if (this.qos === 2) {
            this.client.onPacketReceive('pubcomp').subscribe(x => this._publish());
          }

        });
      } //if end

    });
  }
}
