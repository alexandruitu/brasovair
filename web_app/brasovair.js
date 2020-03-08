import 'ol/ol.css';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import { fromLonLat, transform } from 'ol/proj';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import { Heatmap as HeatmapLayer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import Overlay from 'ol/Overlay';


//var stopInterval = 3600;

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

var startInterval = getNOOfSecondsFrom12AM();

var urad_url = "https://m9sdldu09a.execute-api.us-east-1.amazonaws.com/uradbvair";
var urad_url_pm25 = "https://data.uradmonitor.com/api/v1/devices/82000169/pm25/"+startInterval+"/";
var urad_url_pm10 = "https://data.uradmonitor.com/api/v1/devices/82000169/pm10/"+startInterval+"/";
var urad_url_temperature = "https://data.uradmonitor.com/api/v1/devices/82000169/temperature/"+startInterval+"/";
var sensor_data = [];
//var color_palette = ["#52B947", "#F3EC19", "#F47D1E", "#ED1D24", "#7E2B7D"];
var blur = document.getElementById('blur');
var radius = document.getElementById('radius');
var pmHeatmapScaller = 'pm25';
var htmlTextOverlays = [];
var openLayersOverlays = [];
var pm25Vals = [];
var pm10Vals = [];
var pmTemperatureVals = [];

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
		yValueFormatString: "#,##### ug/m3",
		dataPoints: pm25Vals
  },
  {
    type: "spline",
    name: "PM 10",
		yValueFormatString: "#,##### ug/m3",
		dataPoints: pm10Vals
  },
  {
    type: "spline",
    name: "Temperature",
    axisYType: "secondary",
		yValueFormatString: "#,##### C",
		dataPoints: pmTemperatureVals
	}]
});


function addPM25Data(data) {
	for (var i = 0; i < data.length; i++) {
		pm25Vals.push({
			x: new Date(data[i].time*1000),
			y: data[i].pm25
		});
  }
  chart.render();
}

function addPM10Data(data) {
	for (var i = 0; i < data.length; i++) {
		pm10Vals.push({
			x: new Date(data[i].time*1000),
			y: data[i].pm10
    });

	}
}
function addTemperatureData(data) {
	for (var i = 0; i < data.length; i++) {
		pmTemperatureVals.push({
			x: new Date(data[i].time*1000),
			y: data[i].temperature
		});
	}
  chart.render();
}
$.ajaxSetup({
  headers : {
    'X-User-hash': 'global',
    'X-User-id': 'www'
  }
});

$.getJSON(urad_url_pm25, addPM25Data);
$.getJSON(urad_url_pm10, addPM10Data);
$.getJSON(urad_url_temperature, addTemperatureData);


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

function flyTo(location, done) {
  var duration = 1000;
  var zoom = view.getZoom()+1;
  var parts = 1;
  var called = false;
  function callback(complete) {
    --parts;
    if (called) {
      return;
    }
    if (parts === 0 || !complete) {
      called = true;
      //done(complete);
    }
  }
  view.animate({
    center: location,
    duration: duration
  }, callback);
  view.animate({
    zoom: zoom - 1,
    duration: duration / 2
  }, {
    zoom: zoom,
    duration: duration / 2
  }, callback);
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

function addPMValtoMap(index, pmValue, coord) {

  htmlTextOverlays[index].innerHTML = pmValue;
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
      sensorFeature.setStyle(sensorStyle);
      addPMValtoMap(idx, sensor[pmHeatmapScaller], coordinates);
      idx++;
      //console.log(heatmap.getGradient());
      sensorFeaturesSources.addFeature(sensorFeature);
    }
  };

  map.on('click', function (event) {
    // extract the spatial coordinate of the click event in map projection units
    var coord = event.coordinate;
    var degrees = transform(coord, 'EPSG:3857', 'EPSG:4326');
    overlay.getElement().innerHTML = [degrees[1], degrees[0]];
    overlay.setPosition(coord);
    map.addOverlay(overlay);
    //console.log(coord);
  });

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

  el('track').addEventListener('change', function () {
    
    geolocation.setTracking(this.checked);
    if (this.checked == false){
      map.getView().setCenter(fromLonLat([25.60, 45.674]));
      map.getView().setZoom(13);
    }

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
    flyTo(coordinates);  

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
