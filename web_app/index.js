import 'ol/ol.css';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import {fromLonLat} from 'ol/proj';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import { Heatmap as HeatmapLayer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

var urad_url = "https://m9sdldu09a.execute-api.us-east-1.amazonaws.com/uradbvair";
var sensor_data = [{"deviceid": "82000169", "pm1": 4, "pm25": 6, "pm10": 6, "temperature": "27.37", "latitude": 45.645893, "longitude": 25.599471}, {"deviceid": "1600009C", "pm1": 6, "pm25": 9, "pm10": 12, "temperature": "17.94", "latitude": 45.6718, "longitude": 25.6006}, {"deviceid": "160000A9", "pm1": 9, "pm25": 21, "pm10": 27, "temperature": "17.63", "latitude": 45.6568, "longitude": 25.5917}, {"deviceid": "1600009B", "pm1": 12, "pm25": 17, "pm10": 19, "temperature": "19.21", "latitude": 45.653509, "longitude": 25.56612}, {"deviceid": "160000A7", "pm1": 6, "pm25": 15, "pm10": 19, "temperature": "18.90", "latitude": 45.704032, "longitude": 25.640955}, {"deviceid": "160000C4", "pm1": 3, "pm25": 10, "pm10": 14, "temperature": "23.60", "latitude": 45.670103, "longitude": 25.617966}, {"deviceid": "160000C3", "pm1": 3, "pm25": 11, "pm10": 14, "temperature": "25.11", "latitude": 45.6536, "longitude": 25.599}, {"deviceid": "160000C5", "pm1": 7, "pm25": 17, "pm10": 20, "temperature": "17.39", "latitude": 45.6626667, "longitude": 25.5866871}, {"deviceid": "160000AC", "pm1": 8, "pm25": 21, "pm10": 30, "temperature": "17.71", "latitude": 45.702594, "longitude": 25.456175}, {"deviceid": "82000149", "pm1": 8, "pm25": 10, "pm10": 11, "temperature": "29.29", "latitude": 45.7537, "longitude": 25.633899}];

var blur = document.getElementById('blur');
var radius = document.getElementById('radius');

var view = new View({
  center: fromLonLat([25.60, 45.674]),
  zoom: 13
});

var map = new Map({
  layers: [new TileLayer({ source: new OSM() })],
  target: 'map',
  view: view
});

var positionFeature = new Feature();
var accuracyFeature = new Feature();
var locationFeaturesSources = new VectorSource();
var sensorFeaturesSources = new VectorSource();
var pmFeaturesSources = new VectorSource();
locationFeaturesSources.addFeatures([positionFeature, accuracyFeature]);

var heatmap = new HeatmapLayer({
  map: map,
  source: sensorFeaturesSources,
  blur: parseInt(blur.value, 10),
  radius: parseInt(radius.value, 10)
});

var sensorStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: '#d12e57'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 2
    })
  })
});


var locationStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: '#3399CC'
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

document.addEventListener('DOMContentLoaded', (event) => {
  // makeRequest(urad_url, 'GET').then(function (response) {
  //   sensor_data = response;
  //   console.log(sensor_data);
    for (let sensor of sensor_data) {
      let latlong = [sensor['longitude'], sensor['latitude']];
      let coordinates = fromLonLat(latlong);  
      let sensor_coords = new Point(coordinates);
      let sensorFeature = new Feature();      
      sensorFeature.setGeometryName(sensor['pm25']);
      sensorFeature.setGeometry(sensor_coords);
      sensorFeature.setStyle(sensorStyle);
      //sensorFeature.setGeometryName(sensor['deviceid']);
      //let pm25 = sensor['pm25'];
      //sensorFeature.set('weight', pm25);
      sensorFeaturesSources.addFeature(sensorFeature);      
    };
  //})
});

heatmap.getSource().on('addfeature', function(event) {
  let pm = event.feature.getGeometryName();
  let upperVal = 30;
  if (pm>upperVal){
    pm = upperVal
  }
  var magnitude = parseFloat(pm)/upperVal;
  console.log(magnitude);
  event.feature.set('weight', magnitude);
});

var geolocation = new Geolocation({  
  trackingOptions: { enableHighAccuracy: true},
  projection: view.getProjection()
});

function el(id) {
  return document.getElementById(id);
}

el('track').addEventListener('change', function () {
  geolocation.setTracking(this.checked);

});

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

geolocation.on('change:position', function () {
  let coordinates = geolocation.getPosition();
  //console.log(coordinates);
  positionFeature.setGeometry(coordinates ?
    new Point(coordinates) : null);
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

new VectorLayer({
  map: map,
  source: locationFeaturesSources
});
