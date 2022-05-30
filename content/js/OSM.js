function showmap() {

  // Create Leaflet map on map element.
  var mymap = L.map('map').setView([47.38689, 11.77933], 15);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnRlYy1yOSIsImEiOiJja3lpeW9udGwyaTdzMnhvOG5rOGI1Z2dqIn0.E4UNo_whEBa0cgFpZWCykQ', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1
  }).addTo(mymap);

  var marker = L.marker([47.38689, 11.77933]).addTo(mymap);

  marker.bindPopup("<b>Rothirsch Tech. GmbH</b><br>A tyrolean company.").openPopup();

}
