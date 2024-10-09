//
// Create a new Leaflet map object to be displayed in the #map div
//
const element = document.querySelector("#map");
const map = L.map(element, { maxZoom: 18 });

//
// Add a base layer to the map
//
const mapboxStyle = "mapbox/dark-v11";
const mapboxKey = "pk.eyJ1IjoidHV0dXRpbmQiLCJhIjoiY20weThlMHN1MDE5ZTJtcHZ6NWZ3cHZ0OSJ9.Lkd2ywOlbefcS46ePd5tuA";

const baseLayer = L.tileLayer(
  `https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/{z}/{x}/{y}{r}?access_token=${mapboxKey}`,
  { zoomOffset: -1, tileSize: 512 }
);
baseLayer.addTo(map);

//
// Load GeoJSON data from a file and add it to the map
//
const response = await fetch("pa_pres_results.geojson");
const data = await response.json();

const getFillColor = (party) => {
  switch (party) {
    case 'REPUBLICAN':
      return 'red';
    case 'DEMOCRAT':
      return 'blue';
    default:
      return 'gray'; // Default color for other parties or undefined values
    }
  };
const getFillOpacity = (candidateVotes, totalVotes) => {
  if (!candidateVotes || !totalVotes) return 0; // Handle cases with missing data
  const percentage = candidateVotes / totalVotes;
  return Math.min(Math.max(percentage, 0), 5); // Clamp the opacity between 0 and 1
};

const dataLayer = L.geoJSON(data, {
  style: (feature) => {
      const { party, candidatevotes, totalvotes } = feature.properties;
      return {
          color: "white", // Polygon border color
          weight: 0.5, // Polygon border width
          fillColor: getFillColor(party), // Polygon fill color
          fillOpacity: getFillOpacity(candidatevotes, totalvotes), // Opacity based on vote percentage
      };
  },
  interactive: true,
});
dataLayer.bindTooltip((layer) => layer.feature.properties.name);
dataLayer.addTo(map);

//
// Fit the map to the bounds of the GeoJSON data
//
map.fitBounds(dataLayer.getBounds());
