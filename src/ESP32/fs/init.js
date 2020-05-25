load('api_config.js');
load('api_mqtt.js');
load('api_timer.js');
load('api_dht.js');
load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_dht.js');

let deviceName = Cfg.get('device.id');
let topic = '/devices/' + deviceName + '/events';
print('Topic: ', topic);

let isConnected = false;

let dht = DHT.create(5, DHT.DHT11);

function printToFixed(value, precision) {
  let roundedVal = Math.round(JSON.stringify(value) * JSON.stringify(precision)) / JSON.stringify(precision);

  let fixedVal = JSON.stringify(roundedVal); // Has to be converted to string to use indexof
  let decimalIndex = fixedVal.indexOf('.');

  if (decimalIndex !== -1) {
    fixedVal = fixedVal.slice(0, decimalIndex + (precision + 1));
  } else {
    // fixedVal += "." + "0".repeat(precision);
  }

  return Math.floor(fixedVal); // Return back as an integer 
}

let getInfo = function () {
  return JSON.stringify({
    total_ram: Sys.total_ram() / 1024,
    free_ram: Sys.free_ram() / 1024,
    up_time_minutes: Sys.uptime() / 60,
    temp: dht.getTemp() * 9 / 5 + 32.0,
    hum: dht.getHumidity()
  });
};

Timer.set(
  60 * 1000,
  true,
  function () {
    if (isConnected) {
      publishData();
    }
  },
  null
);

Timer.set(
  5000,
  true,
  function () {
    print('Info:', getInfo());
  },
  null
);

MQTT.setEventHandler(function (conn, ev) {
  if (ev === MQTT.EV_CONNACK) {
    print('CONNECTED');
    isConnected = true;
    publishData();
  }
}, null);

function publishData() {
  let ok = MQTT.pub(topic, getInfo());
  if (ok) {
    print('Published');
  } else {
    print('Error publishing');
  }
}

// Monitor network connectivity.
Net.setStatusEventHandler(function (ev, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);