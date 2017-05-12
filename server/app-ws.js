var Wireless = require('wireless');

var iface = process.argv[2];
console.log(iface);

if(!iface) {
  console.log('Usage ' + process.argv[1] + " wlan0");
}
var wireless = new Wireless({
  iface: 'wlp4s0',
	updateFrequency: 12, // Optional, seconds to scan for networks
  vanishThreshold: 7 // Optional, how many scans before network considered gone
});



console.log("[PROGRESS] Enabling wireless card...");

wireless.enable(function(error) {
    if (error) {
        console.log("[ FAILURE] Unable to enable wireless card. Quitting...");
        return;
    }

    console.log("[PROGRESS] Wireless card enabled.");
    console.log("[PROGRESS] Starting wireless scan...");

    wireless.start();
});

var connected = false;

// The SSID of an open wireless network you'd like to connect to
var SSID = 'xfinitywifi';

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
