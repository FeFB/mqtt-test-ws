var values = {
  qos: 0,
  brokerIP: 'tcp://192.168.15.4:1883',
  amountPayload: 10,
  periodOfPublish: 100,
  timeTest: 20000
};

export class Util {
  static get valuesCable() {
    values.brokerIP = 'tcp://192.168.15.6:1883';
    return values;
  }

  static get valuesWifi() {
    return values;
  }
}
