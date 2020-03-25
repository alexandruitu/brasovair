import { getJSON, ajaxSetup } from 'jquery';

export function computeCAQI(data) {
  let pm10 = data.map(obj => { return [obj.pm10] });
  let pm10Vals = pm10.reduce((a, b) => parseInt(a, 10) + parseInt(b, 10));

  let avg = pm10Vals / data.length;
  let selectedCAQIlevel = null;
  if (avg > 0 & avg <= 25) {
    jQuery("#very_low").addClass("CAQI-row-highlight");
    jQuery("#low").removeClass("CAQI-row-highlight");
    jQuery("#medium").removeClass("CAQI-row-highlight");
    jQuery("#high").removeClass("CAQI-row-highlight");
    jQuery("#very_high").removeClass("CAQI-row-highlight");
    selectedCAQIlevel = jQuery("#td_very_low");
  };
  if (avg > 25 & avg <= 50) {
    jQuery("#very_low").removeClass("CAQI-row-highlight");
    jQuery("#low").addClass("CAQI-row-highlight");
    jQuery("#medium").removeClass("CAQI-row-highlight");
    jQuery("#high").removeClass("CAQI-row-highlight");
    jQuery("#very_high").removeClass("CAQI-row-highlight");
    selectedCAQIlevel = jQuery("#td_low");
  };
  if (avg > 50 & avg <= 75) {
    jQuery("#very_low").removeClass("CAQI-row-highlight");
    jQuery("#low").removeClass("CAQI-row-highlight");
    jQuery("#medium").addClass("CAQI-row-highlight");
    jQuery("#high").removeClass("CAQI-row-highlight");
    jQuery("#very_high").removeClass("CAQI-row-highlight");
    selectedCAQIlevel = jQuery("#td_medium");
  };
  if (avg > 75 & avg <= 100) {
    jQuery("#very_low").removeClass("CAQI-row-highlight");
    jQuery("#low").removeClass("CAQI-row-highlight");
    jQuery("#medium").removeClass("CAQI-row-highlight");
    jQuery("#high").addClass("CAQI-row-highlight");
    jQuery("#very_high").removeClass("CAQI-row-highlight");
    selectedCAQIlevel = jQuery("#td_high");
  };
  if (avg > 100) {
    jQuery("#very_low").removeClass("CAQI-row-highlight");
    jQuery("#low").removeClass("CAQI-row-highlight");
    jQuery("#medium").removeClass("CAQI-row-highlight");
    jQuery("#high").removeClass("CAQI-row-highlight");
    jQuery("#very_high").addClass("CAQI-row-highlight");
    selectedCAQIlevel = jQuery("#td_very_high");
  };

  var dv = jQuery('#divCAQI');
  jQuery('#divCAQI').show();
  jQuery('#CAQIval').text('Common Air Quality Index (CAQI) -> ' + avg.toFixed(2));
  jQuery('#CAQIval').css("background-color", selectedCAQIlevel.css('backgroundColor'));

};

export function makeRequest(url, method) {
  var request = new XMLHttpRequest();
  return new Promise(function (resolve, reject) {
    request.onreadystatechange = function () {
      if (request.readyState !== 4) return;
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response);
      } else {
        reject({
          status: request.status,
          statusText: request.statusText
        });
      }
    };
    request.open(method || 'GET', url, true);
    request.send();
  });
};

export function getNOOfSecondsFrom12AM() {
  var now = new Date(Date.now());
  var start = new Date(now);
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  var dif = now - start;
  var deltaSecondsUnix = dif / 1000;
  var deltaSeconds = Math.round(Math.abs(deltaSecondsUnix));
  return deltaSeconds;
};

export function getNOOfSecondsSinceLastHour() {
  var now = new Date(Date.now());
  var start = new Date(now);
  start.setHours(start.getHours() - 1);
  start.setMinutes(0);
  start.setSeconds(0);
  var dif = now - start;
  var deltaSecondsUnix = dif / 1000;
  var deltaSeconds = Math.round(Math.abs(deltaSecondsUnix));
  return deltaSeconds;
};

export function createChartObject() {
  var chart = new CanvasJS.Chart("chartContainer", {
    animationEnabled: true,
    theme: "light2",
    backgroundColor: 'azure',
    title: {
      text: "Daily PM values"
    },
    toolTip: {
      shared: true
    },
    axisY: {
      title: "ug/m3",
      titleFontSize: 24
    },
    data: [{
      type: "spline",
      name: "PM 25",
      yValueFormatString: "#,##### ug/m3"
    },
    {
      type: "spline",
      name: "PM 10",
      yValueFormatString: "#,##### ug/m3"
    },
    {
      type: "spline",
      name: "Temperature",
      axisYType: "secondary",
      yValueFormatString: "#,##### C"
    }]
  });
  return chart;
};

export var chart = createChartObject();

function addPM25Data(data) {
  let pm25Vals = data.map(obj => { return { x: new Date(obj.time * 1000), y: obj.pm25 } });
  chart.data[0].set("dataPoints", pm25Vals);
}

function addPM10Data(data) {
  let pm10Vals = data.map(obj => { return { x: new Date(obj.time * 1000), y: obj.pm10 } });
  chart.data[1].set("dataPoints", pm10Vals);
}

function addTemperatureData(data) {
  let pmTemperatureVals = data.map(obj => { return { x: new Date(obj.time * 1000), y: obj.temperature } });
  chart.data[2].set("dataPoints", pmTemperatureVals);
}

ajaxSetup({
  headers: {
    'X-User-hash': 'a235942bff158e1027d455a9d36d2fa3',
    'X-User-id': '6278'
  }
});

export function plotChart(deviceid) {

  let startInterval = getNOOfSecondsFrom12AM();
  //console.log(startInterval)
  let urad_url_pm25 = "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/pm25/" + startInterval + "/";
  let urad_url_pm10 = "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/pm10/" + startInterval + "/";
  let urad_url_temperature = "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/temperature/" + startInterval + "/";

  getJSON(urad_url_pm25, addPM25Data);
  getJSON(urad_url_pm10, addPM10Data);
  getJSON(urad_url_temperature, addTemperatureData);

  startInterval = getNOOfSecondsSinceLastHour();
  // let urad_url_pm25 = "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/pm25/" + startInterval + "/";
  urad_url_pm10 = "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/pm10/" + startInterval + "/";
  getJSON(urad_url_pm10, computeCAQI);
};