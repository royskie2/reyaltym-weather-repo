  
      const apiKey = "5b9222aec68ffe967f4d7d759189ace9";
      let map = L.map("map").setView([12.8797, 121.774], 6); // Center map on the Philippines
      let marker;

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Function to fetch weather by input location
      async function fetchWeatherByLocation() {
        let location = document.getElementById("locationInput").value.trim();
        location = location.replace(/Barangay /i, ""); // Remove 'Barangay'

        if (!location) {
          alert("Please enter a location");
          return;
        }

        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          location
        )},PH&limit=1&appid=${apiKey}`;
        try {
          const geoResponse = await fetch(geocodingUrl);
          const geoData = await geoResponse.json();
          if (geoData.length === 0) {
            alert("Location not found in the Philippines. Please try again.");
            return;
          }
          const { lat, lon, name, state } = geoData[0];
          const fullLocationName = `${name}${
            state ? ", " + state : ""
          }, Philippines`.trim();
          updateMapAndFetchWeather(lat, lon, fullLocationName);
        } catch (error) {
          alert("Error fetching location data");
        }
      }

      // Use current location
      function useCurrentLocation() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lon = position.coords.longitude;
              updateMapAndFetchWeather(lat, lon, "Your Current Location");
            },
            () => {
              alert("Unable to retrieve your location");
            }
          );
        } else {
          alert("Geolocation is not supported by your browser");
        }
      }

      // Update map and fetch weather
      async function updateMapAndFetchWeather(lat, lon, locationName) {
  map.setView([lat, lon], 10);
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon], { draggable: true }).addTo(map);
  marker.bindPopup(locationName).openPopup();

  // Fetch weather data
  const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try {
    const response = await fetch(weatherApiUrl);
    const weatherData = await response.json();

    // Update weather details
    document.getElementById("location").textContent = `Location: ${
      locationName || weatherData.name
    }`;
    document.getElementById(
      "description"
    ).textContent = `Weather: ${weatherData.weather[0].description}`;
    document.getElementById("temperature").textContent = `Temperature: ${(
      weatherData.main.temp - 273.15
    ).toFixed(2)} °C`;
    document.getElementById(
      "humidity"
    ).textContent = `Humidity: ${weatherData.main.humidity}%`;
    document.getElementById(
      "wind-speed"
    ).textContent = `Wind Speed: ${weatherData.wind.speed} m/s`;

    // Update the weather icon
    const iconCode = weatherData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
    const weatherIcon = document.getElementById("weather-icon");
    weatherIcon.src = iconUrl;
    weatherIcon.style.display = "block";
  } catch (error) {
    alert("Error fetching weather data");
  }
}

      // Add click event to map
      map.on("click", function (e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        updateMapAndFetchWeather(lat, lon, "Selected Location");
      });
    