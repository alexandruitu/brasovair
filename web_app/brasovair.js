import 'ol/ol.css';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import { fromLonLat } from 'ol/proj';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import { Heatmap as HeatmapLayer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';

var urad_url = "https://m9sdldu09a.execute-api.us-east-1.amazonaws.com/uradbvair";
var sensor_data = [];
var color_palette = ["#52B947", "#F3EC19", "#F47D1E", "#ED1D24", "#7E2B7D"];
var blur = document.getElementById('blur');
var radius = document.getElementById('radius');
var pmHeatmapScaller = 'pm25';

var view = new View({
  center: fromLonLat([25.60, 45.674]),
  zoom: 13
});

var map = new Map({
  layers: [new TileLayer({ source: new OSM() })],
  target: 'map',
  view: view
});
//location related
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
  //gradient: color_palette
});

var sensorStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: '#d12e57'
    }),
    stroke: new Stroke({
      color: '#F10000',
      width: 2
    })
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#d12e57'
    }),
    text: "bla",
    stroke: new Stroke({
      color: '#F10000',
      width: 3
    })
  })
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

function updateHeatmap() {

  for (let sensor of JSON.parse(sensor_data)) {
    let latlong = [sensor['longitude'], sensor['latitude']];
    let coordinates = fromLonLat(latlong);
    let sensor_coords = new Point(coordinates);
    let sensorFeature = new Feature();
    sensorFeature.setGeometryName(sensor[pmHeatmapScaller]);
    sensorFeature.setGeometry(sensor_coords);
    sensorStyle.setText(sensor[pmHeatmapScaller]);
    sensorFeature.setStyle(sensorStyle);
    //sensorFeature.setGeometryName(sensor['deviceid']);
    //let pm25 = sensor['pm25'];
    //sensorFeature.set('weight', pm25);
    //labelStyle.setText()
    //console.log(heatmap.getGradient());
    sensorFeaturesSources.addFeature(sensorFeature);
  }
};

document.addEventListener('DOMContentLoaded', (event) => {
  makeRequest(urad_url, 'GET').then(function (response) {
    sensor_data = response;
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
  positionFeature.setGeometry(coordinates ?
    new Point(coordinates) : null);
  //positionFeature.getStyle().setText("ALEX");
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
        updateHeatmap(response);
      });
    });
  };
}

new VectorLayer({
  map: map,
  source: locationFeaturesSources
});
