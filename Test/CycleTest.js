import {
  Test
} from './Test';

var json2csv = require('json2csv');
var fs = require('fs');
var api = require('my-termux-api').default;

export class CycleTest {

  constructor(testAmount, setOfTest) {

    this.results = new Array();
    this.countTest = 1;
    this.testAmount = testAmount;
    this.setOfTest = setOfTest;
    this._start();
  }

  _start() {
    let observer = {
      next: (x) => {
        //console.log(x);
        this.results.push(x);
      },
      error: null,
      complete: () => {
        console.log('Donee: ' + this.countTest);
        if (this.countTest < (this.testAmount)) {
          console.log('Creating Test Object');
          new Test(this.setOfTest).start(observer);
          this.countTest++;
        } else {
          this._saveDb();
        }
      }
    }
    console.log('Creating Test Object');
    new Test(this.setOfTest).start(observer);

  }

  _saveDb() {
    var fields = ['broker_ip', 'qos', 'connection_dbm', 'connection_level', 'payload_test', 'payloadSaw_sent',
      'payload_broker', 'payload_broker', 'periodOfPublish', 'avgAck_time', 'timeOut', 'timeDone'
    ];
    var csv = json2csv({
      data: this.results,
      fields: fields
    });

    fs.writeFile('../storage/emulated/0/csv/file.csv', csv, function(err) {
      if (err)
        throw err;
      console.log('file saved');
        let platform = process.platform;
    });



  }
}
