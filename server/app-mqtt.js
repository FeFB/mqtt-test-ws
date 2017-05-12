import{RxMqtt} from 'reactivex-mqtt';


const PORT = 1883; // The Standard port for MQTT
const LOCAL = 'tcp://192.168.15.4:' + PORT;

var client = new RxMqtt(LOCAL);
