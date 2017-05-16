/**
 * This class will manage a bunch of tests
 */

import {
  Test2
} from './Test2';

var json2csv = require('json2csv');
var fs = require('fs');
var api = require('my-termux-api').default;

/* Constants to identify the state of the Cycle */
const STATE_QOS_ZERO = 'Qos_zero';
const STATE_QOS_ONE = 'Qos_one';
const STATE_QOS_TWO = 'Qos_two';


const NEW_TEST_LOG = '=========================\nNew Test';


export class CycleTestPingPong {
  /**
   * Creates a CycleTest object
   * @param  {Int} testAmount [How many times it will do for each QoS]
   * @param  {Object} setOfTest  [It has the information about periodOfPublish, amountPayload, brokerIP, timeTest]
   * @return {CycleTest}            [Object]
   */
  constructor(testAmount, setOfTest) {

    //  ArrayList<StaticsData> It holds the staticsData of each test
    this.results = new Array();
    //  The aux Coun test
    this.countTest = 1;
    //  The Amount that was setted
    this.testAmount = testAmount;

    //The Object with the config of the test
    this.setOfTest = setOfTest;

    //It starts with QoS 0
    this._startQos_zero();

  }

  /**
   * Build the Observer with the logic about each cycle of the test
   * @return {Observer} [It knows what must to do]
   */
  getObserver() {
    return {
      next: (x) => {
        this.results.push(x);
        console.log('Push on this.results');
      },
      error: null,
      complete: () => {
        console.log('Done: ' + this.countTest + ' of QoS: ' + this.setOfTest.qos);
        if (this.countTest < this.testAmount) {
          console.log(NEW_TEST_LOG);
          new Test2(this.setOfTest).start(this.getObserver.bind(this));
          this.countTest++;
        } else {
          if (this.state === STATE_QOS_ZERO) {
            this._startQos_one();
          } else if (this.state === STATE_QOS_ONE) {
            this._startQos_two();
          } else {
            this._saveDb();
          }
        }
      }
    };
  }
  /**
   * It Starts with the QoS 0 test
   * @return {Void} [nothing]
   */
  _startQos_zero() {

    this.state = STATE_QOS_ZERO;
    console.log(NEW_TEST_LOG);
    new Test2(this.setOfTest).start(this.getObserver.bind(this));

  }

  /**
   * It starts the bunch of test with QoS 1
   * @return {Void}   nothing
   */
  _startQos_one() {
    //set state
    this.state = STATE_QOS_ONE;
    //reset count
    this.countTest = 1;
    // set QoS = 1
    this.setOfTest.qos = 1;
    // Star Test
    console.log(NEW_TEST_LOG);
    new Test2(this.setOfTest).start(this.getObserver.bind(this));

  }
  /**
   * It starts the bunch of test with QoS 2
   * @return {Void}   nothing
   */
  _startQos_two() {
    //set state
    this.state = STATE_QOS_TWO;
    //reset count
    this.countTest = 1;
    // set QoS = 1
    this.setOfTest.qos = 2;
    // Star Test
    console.log(NEW_TEST_LOG);
    new Test2(this.setOfTest).start(this.getObserver.bind(this));
  }

  /**
   * It will get the this.results (ArraList<StaticsData>) and mount a csv file
   * @return {Void}   nothing
   */
  _saveDb() {
    //Get OS
    let platform = process.platform;
    let date = new Date();
    let dateKey = date.getDay() + '_' + date.getMonth() + '_' + date.getHours() + ':' + date.getMinutes();

    let nameOfFile = 'MQTT_TEST_pingpong' + dateKey + '_payload_' + this.setOfTest.amountPayload +
      '_per_' + this.setOfTest.periodOfPublish + '.csv';

    let forAndroid = '../storage/shared/csv/' + nameOfFile;

    let file = ((platform === 'android') ? forAndroid : nameOfFile);

    //Columns Names
    var fields = ['broker_ip', 'qos', 'connection_dbm', 'connection_level', 'payloadSaw_sent', 'timeOut'];

    //Buld Json to CSV
    var csv = json2csv({
      data: this.results,
      fields: fields
    });

    //Write, just works on Android

    fs.writeFile(file, csv, function(err) {
      if (err)
        throw err;
      console.log('file saved');
    });

  }
}
