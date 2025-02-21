const apiKey = "5b9222aec68ffe967f4d7d759189ace9";
const routeApiKey = "5b3ce3597851110001cf6248bb5f9b86116c45a683361a273dea8aad";
const tomtomApiKey = "GMWkSIz8bU6yAQbK2tFZZA6KIcGlfEKt";

let map = L.map("map").setView([12.8797, 121.774], 6);
let marker, routeLayer, trafficLayer;

// Initialize Map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Add TomTom Traffic Layer
trafficLayer = L.tileLayer(
  `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${tomtomApiKey}`,
  { attribution: '&copy; <a href="https://www.tomtom.com">TomTom</a> contributors' }
).addTo(map);

async function fetchWeatherByLocation() {
  let location = document.getElementById("locationInput").value.trim().replace(/Barangay /i, "");
  if (!location) return alert("Please enter a location");

  try {
    const geoData = await fetchGeoLocation(location);
    if (!geoData) return alert("Location not found in the Philippines. Please try again.");
    
    updateMapAndFetchWeather(geoData.lat, geoData.lon, geoData.name);
  } catch (error) {
    alert("Error fetching location data");
  }
}

function useCurrentLocation() {
  if (!navigator.geolocation) return alert("Geolocation is not supported by your browser");
  
  navigator.geolocation.getCurrentPosition(
    (position) => updateMapAndFetchWeather(position.coords.latitude, position.coords.longitude, "Your Current Location"),
    () => alert("Unable to retrieve your location")
  );
}

async function updateMapAndFetchWeather(lat, lon, locationName) {
  map.setView([lat, lon], 10);
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon], { draggable: true }).addTo(map).bindPopup(locationName).openPopup();
  
  try {
    const weatherData = await fetchWeather(lat, lon);
    displayWeather(weatherData, locationName);
  } catch (error) {
    alert("Error fetching weather data");
  }
}

async function calculateRoute() {
  const destination = document.getElementById("destinationInput").value.trim();
  if (!destination) return alert("Please enter a destination");

  try {
    const geoData = await fetchGeoLocation(destination);
    if (!geoData) return alert("Destination not found. Please try again.");
    if (!marker) return alert("Please select a starting location on the map.");

    const startCoords = marker.getLatLng();
    const routeData = await fetchRoute(startCoords, geoData);
    if (!routeData) return alert("Error fetching route data");

    updateRouteLayer(routeData);
  } catch (error) {
    alert("Error fetching route data: " + error.message);
  }
}

async function fetchGeoLocation(location) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)},PH&limit=1&appid=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.length ? data[0] : null;
}

async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const response = await fetch(url);
  return await response.json();
}

function displayWeather(data, locationName) {
  document.getElementById("location").textContent = `Location: ${locationName || data.name}`;
  document.getElementById("description").textContent = `Weather: ${data.weather[0].description}`;
  document.getElementById("temperature").textContent = `Temperature: ${(data.main.temp - 273.15).toFixed(2)} °C`;
  document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
  document.getElementById("wind-speed").textContent = `Wind Speed: ${data.wind.speed} m/s`;
  
  const weatherIcon = document.getElementById("weather-icon");
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
  weatherIcon.style.display = "block";
}

async function fetchRoute(startCoords, destination) {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${routeApiKey}&start=${startCoords.lng},${startCoords.lat}&end=${destination.lon},${destination.lat}`;
  const response = await fetch(url);
  return await response.json();
}

function updateRouteLayer(data) {
  if (routeLayer) map.removeLayer(routeLayer);
  
  routeLayer = L.geoJSON(data, {
    style: (feature) => {
      const trafficSpeed = feature.properties.summary.average_speed;
      let color = "green";
      if (trafficSpeed < 30) color = "red";
      else if (trafficSpeed < 60) color = "yellow";
      return { color, weight: 5 };
    },
  }).addTo(map);
}

map.on("click", (e) => updateMapAndFetchWeather(e.latlng.lat, e.latlng.lng, "Selected Location"));
