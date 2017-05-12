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

var Wireless = require('wireless');
/**
 * The Test Class responsible to connect MQTT, get times and listeners.
 */

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
    this.qos = qos;
    this.brokerIP = brokerIP;
    this.amountPayload = amountPayload;
    this.periodOfPublish = periodOfPublish;
    this.timeTest = timeTest

    this.msgSentCount = 0; // It holds the ACK received

    /* This logic can be done with one Map where pckControl[key] = Date.now - pkgControl[key] */
    this.pkgControlSent = new Map(); //Used to save the time that a key payload was sent
    this.pkgControlACK = new Map(); //Used to save the time that a key payload's ACK was received
    this.pkgControlElapsed = new Map(); //Use to calculate the elapsedTime

    this.testTimeOut_ = Observable.interval(this.timeTest).take(1).share(); //It will alert that the Test Time Out reached.
    this.timeCount_ = Observable.interval(1000).takeUntil(this.testTimeOut_); //It will update some useInterface
    this.sendPayloadTimer_ = Observable.interval(this.periodOfPublish)
      .take(this.amountPayload)
      .takeUntil(this.testTimeOut_);
    //this.client_ = new RxMqtt(this.brokerIP);
    this.start();

    var iface = process.argv[2];
    console.log(iface);

    if(!iface) {
      console.log('Usage ' + process.argv[1] + " wlan0");
    }
    var wireless = new Wireless({
      iface: "wlp4s0",
    	updateFrequency: 12, // Optional, seconds to scan for networks
      vanishThreshold: 7 // Optional, how many scans before network considered gone
    });

    wireless.enable(function(error) {
        if (error) {
            console.log("[ FAILURE] Unable to enable wireless card. Quitting...");
            return;
        }

        console.log("[PROGRESS] Wireless card enabled.");
        console.log("[PROGRESS] Starting wireless scan...");

        wireless.start();
    });

    // Found a new network
    wireless.on('appear', function(network) {
        var quality = Math.floor(network.quality / 70 * 100);

        var ssid = network.ssid || '<HIDDEN>';

        var encryption_type = 'NONE';
        if (network.encryption_wep) {
            encryption_type = 'WEP';
        } else if (network.encryption_wpa && network.encryption_wpa2) {
            encryption_type = 'WPA&WPA2';
        } else if (network.encryption_wpa) {
            encryption_type = 'WPA';
        } else if (network.encryption_wpa2) {
            encryption_type = 'WPA2';
        }

        console.log("[  APPEAR] " + ssid + " [" + network.address + "] " + quality + "% " + network.strength + " dBm " + encryption_type);

    });

  }

  start() {

    this.clientID = Util.clientID + "_" + new Date();
    this.RxClient = new RxMqtt(this.brokerIP, {
      clientId: this.clientID
    });

    this.RxClient.on('connect').subscribe(x => {
      console.log('Client Connected');
      this.sendPayloadTimer_.subscribe(x => {
        this.RxClient.client.publish('Oi', 'Tcha', {
          qos: 1
        });
      });
    });

    this.RxClient.onPacketSend('publish').subscribe(
      x => {
        let id = x.packet.messageId;
        this.pkgControlSent.set(id, new Date().getTime());
      }
    );

    this.RxClient.onPacketReceive('puback').subscribe(x => {
      let id = x.packet.messageId;
      this.pkgControlACK.set(id, new Date().getTime());
    });

    this.testTimeOut_.subscribe(null, null, () => {
      console.log('TimeOut from Subscriber');
      this.pkgControlSent.forEach((elem, payloadId) => {
        if (this.pkgControlACK.has(payloadId)) {
          let elapsed = this.pkgControlACK.get(payloadId) - this.pkgControlSent.get(payloadId);
          this.pkgControlElapsed.set(payloadId, elapsed);
        }
    });
    console.log('Size of ACK: ' + this.pkgControlACK.size);
    });
  }
}
