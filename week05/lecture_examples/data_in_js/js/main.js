import { chart } from "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js";
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.1.0/+esm';

const mapEl = document.querySelector('#map');
const map = L.map(mapEl);

// Add neighborhoods to map...
const hoodsResponse = await fetch('data/philadelphia-neighborhoods.geojson');
const hoodsCollection = await hoodsResponse.json();
const hoodsLayer = L.geoJSON(hoodsCollection);

hoodsLayer.addTo(map);
map.fitBounds(hoodsLayer.getBounds());

// Add bikeshare stations to map...
const stationsResponse = await fetch('https://gbfs.bcycle.com/bcycle_indego/station_information.json');
const stationsData = await stationsResponse.json();

function gbfsStationToFeature(gbfsStation) {
  return {
    type: 'Feature',
    properties: gbfsStation,
    geometry: {
      type: 'Point',
      coordinates: [gbfsStation.lon, gbfsStation.lat],
    }
  };
}
window.gbfsStationToFeature = gbfsStationToFeature;
window.stationsData = stationsData;

const stations = stationsData.data.stations.map(gbfsStationToFeature);

const stationsLayer = L.geoJSON(stations);
stationsLayer.addTo(map);

// Add tooltip with name and bikeshare density...
for (const hood of hoodsCollection.features) {
  function stationInHood(station) {
    return turf.booleanPointInPolygon(station, hood);
  }

  const hoodStations = stations.filter(stationInHood);

  const areaSqKm = hood.properties['Shape_Area'] / 3280.84 / 3280.84;
  const stationCount = hoodStations.length;
  const stationDensity = stationCount / areaSqKm;

  Object.assign(hood.properties, { areaSqKm, stationCount, stationDensity});
}

hoodsLayer.bindTooltip(layer => {
  const hood = layer.feature;
  const name = hood.properties['LISTNAME'];
  const density = hood.properties.stationDensity.toFixed(2);
  return `${name}<br>${density} stations / sq km`;
});

// Add chart with bikeshare density
const hoods = hoodsCollection.features
  .filter(hood => hood.properties.stationDensity > 0)
  .sort((a, b) => b.properties.stationDensity - a.properties.stationDensity);
const hoodNames = hoods.map(hood => hood.properties ['LISTNAME']);
const hoodDensities = hoods.map(hood => hood.properties.stationDensity);

const chartEl = document.querySelector('.chart canvas');
const data = {
  labels: hoodNames,
  datasets: [{
    label: 'Stations per sq km',
    data: hoodDensities,
  }]
};
const options = {
  indexAxis: 'y',
  aspectRatio: 0.5,
  scales: {
    y: {beginAtZero: true}
  }
};
const chart = new Chart(chartEl, { type: 'bar', data, options})