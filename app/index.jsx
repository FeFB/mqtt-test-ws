import ReactDOM from 'react-dom';

import {StaticsData, Test} from './Test';


var staticsData = new StaticsData(0, "aeuhauehea", 1000, 10, 1000);
var test = new Test(0, 'ws://localhost:8000', 100, 100, 10000);

//var status = navigator.connection.downlinkMax;

var oi = "OI";

var App = () => (
  <div>
  <h1> Hello, Universe!!!</h1>
    <h2> {staticsData.toString()} </h2>
  </div>
);

ReactDOM.render(
  <App />, document.getElementById('root')
);
