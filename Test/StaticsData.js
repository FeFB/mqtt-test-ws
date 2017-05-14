var json2csv = require('json2csv');
var fs = require('fs');

/*
 * Class that manage the information about the test
 */

export class StaticsData {
  /**
   * [Cosntructor Used to build the object that will hold all the information about the test]
   * @param  {int} qos             [QoS Level for the test.]
   * @param  {String} brokerIP     [Broker's address used.]
   * @param  {int} amountPayload   [The Amount Payload requested]
   * @param  {int} periodOfPublish [Period in millisecond to send a payload]
   * @param  {int} timeTest        [TimeTest to completed the test]
   * @param  {Double} ackAvg       [The Avarage time of a ACK in mS]
   * @param  {int} payloadSent     [The amount of payload sent]
   * @param  {long} startAt        [The start Time of test]
   * @param  {long} endAt          [The end Time of test]
   */
  constructor(qos, brokerIP, amountPayload, periodOfPublish, timeTest, ackAvg, payloadSent, startAt, endAt, conn_dbm = 0, conn_level = 0) {
    this.qos = qos;
    this.brokerIP = brokerIP;
    this.amountPayload = amountPayload;
    this.periodOfPublish = periodOfPublish;
    this.timeTest = timeTest
    this.avgTimePayload = ackAvg;
    this.amtPayloadSent = payloadSent;
    this.startAt = startAt;
    this.endAt = endAt;
    this.elapsedTime = this.endAt - this.startAt;
    this.connection_dbm = conn_dbm;
    this.connection_level = conn_level;

  }
  /**
   * Return the values of all the props of the Object
   * @return {[String]} [Return the values of all the props of the Object]
   */
  toString() {

    return 'QoS: ' + this.qos + '\nBroker IP: ' + this.brokerIP + '\nAmount Payload: ' + this.amountPayload + '\nPeriod Of Publish: ' + this.periodOfPublish + '\nTime Test: ' + this.timeTest + '\nAVG Time Payload: ' + this.avgTimePayload + '\nAmount Payload Sent: ' + this.amtPayloadSent + '\nConnection level:' + this.connLevel + '\nStart At: ' + this.startAt + '\nEnd At: ' + this.endAt + '\nElapsed time: ' + this.elapsedTime + '\nPayload AmntBroker: ' + this.payloadAmntBroker + '\nError Amnt Broker: ' + this.errorAmntBroker + '\nConnects Amnt Broker: ' + this.connectsAmntBroker + '\nStartAt Broker: ' + this.startAtBroker + '\nEndAt Broker: ' + this.endAtBroker;
  }
  /**
   * It is called to get currentTime and, if supported, the connectionLevel
   * @return {void}
   */
  start() {
    this.connLevel = ((navigator.connection)
      ? navigator.connection.downlinkMax
      : 'noSupport');
    //this.connLevel = navigator.connection.downlinkMax;
    this.startAt = new Date().getTime()
  }
  /**
   * It is called to set the currentTime of the end test.
   * @return {void}
   */
  end() {
    this.endAt = new Date().getTime();
    this.elapsedTime = this.endAt - this.startAt;
  }

  /**
   * It get a string with limiters, and it splits and set each variable related.
   * @param {String} payload [A String with limiters]
   */
  setDataFromBroker(payload) {
    let payVec = payload.toString().split('#');
    this.payloadAmntBroker = payVec[0];
    this.errorAmntBroker = payVec[1];
    this.connectsAmntBroker = payVec[2];
    this.startAtBroker = payVec[8];
    this.endAtBroker = payVec[9];

  //  this.setCsv();
  }


  getObjForCsv() {

    let myValues = {
      "broker_ip": this.brokerIP,
      "qos": this.qos,
      "connection_dbm": this.connection_dbm,
      "connection_level": this.connection_level,
      "payload_test": this.amountPayload, // The amount requested on the test
      "payloadSaw_sent": this.amtPayloadSent, // The amount that client tried to send
      "payload_broker": this.payloadAmntBroker, // The amount that the broker received
      "periodOfPublish": this.periodOfPublish, // The period of each payload
      "avgAck_time": this.avgTimePayload, // The avarage of ack time
      "timeOut": this.timeTest, // The Time Out setted on the test
      "timeDone": this.elapsedTime // The elapsed time that test finish

    }

    //console.log(myValues);
    return myValues;
  }

  setCsv() {
    var fields = ['broker_ip', 'qos', 'connection_dbm', 'connection_level', 'payload_test', 'payloadSaw_sent',
                  'payload_broker', 'payload_broker', 'periodOfPublish', 'avgAck_time', 'timeOut', 'timeDone'];

    var csv = json2csv({data: this.getCsv(), fields: fields});

    fs.writeFile('file.csv', csv, function(err) {
      if (err)
        throw err;
      console.log('file saved');
    });
  }

}