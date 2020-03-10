import 'ol/ol.css';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import { fromLonLat, transform, toLonLat } from 'ol/proj';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import { Heatmap as HeatmapLayer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import {getJSON, ajaxSetup} from 'jquery';

function getNOOfSecondsFrom12AM(){
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

var urad_url = "https://m9sdldu09a.execute-api.us-east-1.amazonaws.com/uradbvair";
var sensor_data = [];
var blur = document.getElementById('blur');
var radius = document.getElementById('radius');
var pmHeatmapScaller = 'avg_pm25';
var htmlTextOverlays = [];
var openLayersOverlays = [];
// var pm25Vals = [];
// var pm10Vals = [];
// var pmTemperatureVals = [];

function createChartObject(){
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
      name: "pm25",
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

var chart = createChartObject();

function addPM25Data(data) {
  let pm25Vals = data.map(obj => { return { x: new Date(obj.time*1000), y: obj.pm25}});
  chart.data[0].set("dataPoints", pm25Vals);
}

function addPM10Data(data) {
  let pm10Vals = data.map(obj => { return { x: new Date(obj.time*1000), y: obj.pm10}});
  chart.data[1].set("dataPoints", pm10Vals);
}
function addTemperatureData(data) {
  let pmTemperatureVals = data.map(obj => { return { x: new Date(obj.time*1000), y: obj.temperature}});
  chart.data[2].set("dataPoints", pmTemperatureVals);
}
ajaxSetup({
  headers : {
    'X-User-hash': 'global',
    'X-User-id': 'www'
  }
});

function plotChart(deviceid){
 
  let startInterval = getNOOfSecondsFrom12AM();
  let urad_url_pm25 =         "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/pm25/" + startInterval+"/";
  let urad_url_pm10 =         "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/pm10/" + startInterval+"/";
  let urad_url_temperature =  "https://data.uradmonitor.com/api/v1/devices/" + deviceid + "/temperature/" + startInterval+"/";

  getJSON(urad_url_pm25, addPM25Data);
  getJSON(urad_url_pm10, addPM10Data);
  getJSON(urad_url_temperature, addTemperatureData);
};

function populateDOMwithOverlays(){

  for (var idx = 0; idx<sensor_data.length; idx++){
    var newPM = document.createElement('div');
    newPM.style = "background-color: transparent;  font-weight: bold; opacity: 0.9";
  
    var overlayPM = new Overlay({
      element: newPM,
      positioning: 'bottom-center'
    });
    htmlTextOverlays.push(newPM);
    openLayersOverlays.push(overlayPM);
  
  }
}

var view = new View({
  center: fromLonLat([25.60, 45.674]),
  zoom: 13
});

var map = new Map({
  layers: [new TileLayer({ source: new OSM() })],
  target: 'map',
  view: view
});

function flyTo(location, zoom) {

  view.animate({
    center: location,
    zoom:   zoom
});
}

//location related
var positionFeature = new Feature();
var accuracyFeature = new Feature();
var locationFeaturesSources = new VectorSource();
locationFeaturesSources.addFeatures([positionFeature, accuracyFeature]);

var sensorFeaturesSources = new VectorSource();

var overlay = new Overlay({
  element: document.getElementById('overlay'),
  positioning: 'bottom-center'
});


var heatmap = new HeatmapLayer({
  map: map,
  source: sensorFeaturesSources,
  blur: parseInt(blur.value, 10),
  radius: parseInt(radius.value, 10)
  //gradient: color_palette
});

var locationStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: '#52B947'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 2
    })
  })
});

positionFeature.setStyle(locationStyle);

var makeRequest = function (url, method) {
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

function addPMValtoMap(index, pmValue, coord, deviceid) {

  var curHtmlLabel = htmlTextOverlays[index];
  curHtmlLabel.innerHTML = pmValue;
  curHtmlLabel.id = deviceid;
  curHtmlLabel.addEventListener('mouseover', function(){
    let htmlEl = overlay.getElement(); 
    htmlEl.innerHTML = this.id;
    htmlEl.style.cursor = "wait";
    overlay.setPosition(coord);
    map.addOverlay(overlay);
  })
  curHtmlLabel.addEventListener('click', function(){
    //chart  = createChartObject();
    plotChart(this.id);    
    chart.render();
    chart.title.set("text", 'Dailiy Values for ' + this.id);    
  })

  curHtmlLabel.addEventListener('mouseleave', function(){
    map.removeOverlay(overlay);
  })
  let overlayPM = openLayersOverlays[index];
  overlayPM.setPosition(coord);
  map.addOverlay(overlayPM);
}

  function updateHeatmap() {
    var idx = 0;
    for (let sensor of sensor_data) {
      let latlong = [sensor['longitude'], sensor['latitude']];
      let coordinates = fromLonLat(latlong);
      let sensor_coords = new Point(coordinates);
      let sensorFeature = new Feature();
      sensorFeature.setGeometryName(sensor[pmHeatmapScaller]);
      sensorFeature.setGeometry(sensor_coords);
      sensorFeature.setStyle(locationStyle);
      addPMValtoMap(idx, sensor[pmHeatmapScaller], coordinates, sensor['id']);
      idx++;
      //console.log(heatmap.getGradient());
      sensorFeaturesSources.addFeature(sensorFeature);
    }
  };

  // map.on('click', function (event) {
  //   // extract the spatial coordinate of the click event in map projection units
  //   var coord = event.coordinate;
  //   var degrees = toLonLat(coord);
  //   for (let sensor of sensor_data) {
  //     if ((sensor['longitude'] == degrees[1]) && (sensor['latitude'] == degrees[0])){
  //       alert(sensor['deviceid']);
  //     }
  //   }
  // });

  document.addEventListener('DOMContentLoaded', (event) => {
    blur.style.display = 'none';
    radius.style.display = 'none';
    makeRequest(urad_url, 'GET').then(function (response) {
      sensor_data = JSON.parse(response);
      populateDOMwithOverlays();
      updateHeatmap();
    })
  }
  );

  heatmap.getSource().on('addfeature', function (event) {
    let pm = event.feature.getGeometryName();
    let upperVal = 40;
    if (pm > upperVal) {
      pm = upperVal
    }
    var magnitude = parseFloat(pm) / upperVal;
    //console.log(magnitude);
    event.feature.set('weight', magnitude);
    event.feature.set('radius', pm * 1, 5);
  });

  var geolocation = new Geolocation({
    trackingOptions: { enableHighAccuracy: true },
    projection: view.getProjection()
  });

  function el(id) {
    return document.getElementById(id);
  }

  // update the HTML page when the position changes.
  geolocation.on('change', function () {
    el('accuracy').innerText = geolocation.getAccuracy() + ' [m]';
    el('altitude').innerText = geolocation.getAltitude() + ' [m]';
    el('altitudeAccuracy').innerText = geolocation.getAltitudeAccuracy() + ' [m]';
    el('heading').innerText = geolocation.getHeading() + ' [rad]';
    el('speed').innerText = geolocation.getSpeed() + ' [m/s]';
    
  });

  geolocation.on('error', function (error) {
    var info = document.getElementById('info');
    info.innerHTML = error.message;
    info.style.display = '';
  });


  geolocation.on('change:accuracyGeometry', function () {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  });

  
  el('track').addEventListener('change', function () {
    
    geolocation.setTracking(this.checked);
    if (this.checked == false){
        flyTo(fromLonLat([25.60, 45.674]), 13);  
        positionFeature.setGeometry(null);  
    }

  });

  geolocation.on('change:position', function () {
    let coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ?
      new Point(coordinates) : null);
    flyTo(coordinates, 15);      
  });

  var blurHandler = function () {
    heatmap.setBlur(parseInt(blur.value, 10));
  };
  blur.addEventListener('input', blurHandler);
  blur.addEventListener('change', blurHandler);

  var radiusHandler = function () {
    heatmap.setRadius(parseInt(radius.value, 10));
  };
  radius.addEventListener('input', radiusHandler);
  radius.addEventListener('change', radiusHandler);

  var rad = document.getElementsByName('pmSelector');
  var prev = null;
  if (rad != null) {
    for (var i = 0; i < rad.length; i++) {
      rad[i].addEventListener('change', function () {
        if (this !== prev) {
          prev = this;
        }
        pmHeatmapScaller = this.id;
        heatmap.getSource().clear();
        makeRequest(urad_url, 'GET').then(function (response) {
          sensor_data = JSON.parse(response);
          updateHeatmap();
        });
      });
    };
  }

  new VectorLayer({
    map: map,
    source: locationFeaturesSources
  });
