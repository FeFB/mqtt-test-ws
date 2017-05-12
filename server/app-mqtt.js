import{RxMqtt} from 'reactivex-mqtt';


const PORT = 1883; // The Standard port for MQTT
const LOCAL = 'tcp://localhost:' + PORT;

var client = new RxMqtt(LOCAL);
