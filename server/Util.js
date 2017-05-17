var values = {
  qos: 0,
  brokerIP: 'toComplete',
  amountPayload: 10,
  periodOfPublish: 100,
  timeTest: 10000
};

export class Util {
  static get valuesCable() {
    values.brokerIP = 'tcp://192.168.15.9:1883';
    return values;
  }

  static get valuesWifi() {
    values.brokerIP = 'tcp://192.168.15.4:1883';
    return values;
  }

  static get valesAWS() {
    values.brokerIP = 'mqtt://34.208.230.82:1883'
    return values;
  }
}
