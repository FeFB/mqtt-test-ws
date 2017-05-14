import {
  Test
} from './Test';

var json2csv = require('json2csv');
var fs = require('fs');
var api = require('my-termux-api').default;

const STATE_QOS_ZERO = 'Qos_zero';
const STATE_QOS_ONE = 'Qos_one';
const STATE_QOS_TWO = 'Qos_two';
export class CycleTest {

  constructor(testAmount, setOfTest) {

    this.results = new Array();
    this.countTest = 1;
    this.testAmount = testAmount;
    this.setOfTest = setOfTest;

    this._startQos_zero();

    this.observer = {
      next: (x) => this.results.push(x),
      error: null,
      complete: () => {
        console.log('Done: ' + this.countTest + ' of QoS: ' + this.setOfTest.qos);
        if(this.countTest < this.testAmount) {
          console.log('New Test');
          new Test(this.setOfTest).start(this.observer);
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

  _startQos_zero() {

    this.state = STATE_QOS_ZERO;
    console.log('Creating Test Object');
    new Test(this.setOfTest).start(this.observer);

  }


  _startQos_one() {
    //set state
    this.state = STATE_QOS_ONE;
    //reset count
    this.countTest = 1;
    // set QoS = 1
    this.setOfTest.qos = 1;
    // Star Test
    new Test(this.setOfTest).start(this.observer);


  }

  _startQos_two(){
    //set state
    this.state = STATE_QOS_TWO;
    //reset count
    this.countTest = 1;
    // set QoS = 1
    this.setOfTest.qos = 2;
    // Star Test
    new Test(this.setOfTest).start(this.observer);
  }

  _saveDb() {
    var fields = ['broker_ip', 'qos', 'connection_dbm', 'connection_level', 'payload_test', 'payloadSaw_sent',
      'payload_broker', 'payload_broker', 'periodOfPublish', 'avgAck_time', 'timeOut', 'timeDone'
    ];
    var csv = json2csv({
      data: this.results,
      fields: fields
    });

    fs.writeFile('../storage/shared/csv/file.csv', csv, function(err) {
      if (err)
        throw err;
      console.log('file saved');
        let platform = process.platform;
    });



  }
}
