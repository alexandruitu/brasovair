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
import Overlay from 'ol/Overlay';
import { plotChart, makeRequest, chart } from './utils.js';

var urad_url = "https://m9sdldu09a.execute-api.us-east-1.amazonaws.com/uradbvair";
var sensor_data = [];
var pmHeatmapScaller = 'avg_pm25';
var htmlTextOverlays = [];
var openLayersOverlays = [];

function populateDOMwithOverlays() {

  for (var idx = 0; idx < sensor_data.length; idx++) {
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
    zoom: zoom
  });
}

//location related
var positionFeature = new Feature();
var accuracyFeature = new Feature();
var locationFeaturesSources = new VectorSource();
locationFeaturesSources.addFeatures([positionFeature, accuracyFeature]);

var sensorFeaturesSources = new VectorSource();

var overlay = new Overlay({
  element: el('overlay'),
  positioning: 'bottom-center'
});

var heatmap = new HeatmapLayer({
  map: map,
  source: sensorFeaturesSources,
  blur: 15,
  radius: 12
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

function addPMValtoMap(index, pmValue, coord, deviceid) {

  var curHtmlLabel = htmlTextOverlays[index];
  curHtmlLabel.innerHTML = pmValue;
  curHtmlLabel.id = deviceid;
  curHtmlLabel.addEventListener('mouseover', function () {
    let htmlEl = overlay.getElement();
    htmlEl.innerHTML = this.id;
    htmlEl.style.cursor = "wait";
    overlay.setPosition(coord);
    map.addOverlay(overlay);
  })
  curHtmlLabel.addEventListener('click', function () {
    plotChart(this.id);
    chart.render();
    chart.title.set("text", 'Dailiy Values for ' + this.id);

  })

  curHtmlLabel.addEventListener('mouseleave', function () {
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

document.addEventListener('DOMContentLoaded', (event) => {
  makeRequest(urad_url, 'GET').then(function (response) {
    sensor_data = JSON.parse(response);
    populateDOMwithOverlays();
    updateHeatmap();
    jQuery('#divCAQI').hide();
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
  var info = jQuery('info');
  info.innerHTML = error.message;
  info.style.display = '';
});


geolocation.on('change:accuracyGeometry', function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

el('track').addEventListener('change', function () {

  geolocation.setTracking(this.checked);
  if (this.checked == false) {
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
