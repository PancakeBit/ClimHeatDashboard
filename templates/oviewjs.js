// Barangays in District 6 of Quezon City
const district6Barangays = [
  { name: "Batasan Hills", lat: 14.6867, lng: 121.0961 },
  { name: "Commonwealth", lat: 14.6739, lng: 121.0858 },
  { name: "Holy Spirit", lat: 14.6761, lng: 121.0778 },
  { name: "Payatas", lat: 14.7114, lng: 121.1031 },
  { name: "Bagong Silangan", lat: 14.6997, lng: 121.1119 },
  { name: "Sauyo", lat: 14.7036, lng: 121.0594 },
  { name: "Talipapa", lat: 14.6894, lng: 121.0372 },
  { name: "Tandang Sora", lat: 14.6711, lng: 121.0372 },
  { name: "Pasong Tamo", lat: 14.6642, lng: 121.0594 },
  { name: "Culiat", lat: 14.6572, lng: 121.0483 },
  { name: "Matandang Balara", lat: 14.6711, lng: 121.1008 }
];

// Function to calculate heat index
function calculateHeatIndex(temperature, humidity) {
  const t = temperature * 9/5 + 32; // Convert to Fahrenheit
  const rh = humidity;
  let hi = -42.379 + 2.04901523*t + 10.14333127*rh - 0.22475541*t*rh - 6.83783e-3*t*t - 5.481717e-2*rh*rh + 1.22874e-3*t*t*rh + 8.5282e-4*t*rh*rh - 1.99e-6*t*t*rh*rh;
  hi = (hi - 32) * 5/9; // Convert back to Celsius
  return hi.toFixed(1);
}

// Google Maps initialization
function initMap() {
  const quezonCity = { lat: 14.6760, lng: 121.0437 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: quezonCity,
  });

  // Add markers for each barangay
  district6Barangays.forEach(barangay => {
    const marker = new google.maps.Marker({
      position: { lat: barangay.lat, lng: barangay.lng },
      map: map,
      title: barangay.name
    });

    const infoWindow = new google.maps.InfoWindow();

    // Fetch real-time weather data for each barangay
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${barangay.lat}&lon=${barangay.lng}&units=metric&appid=630c0f7f455572c8c3ef3f3551c5b2ec`)
      .then(response => response.json())
      .then(data => {
        const temp = data.main.temp;
        const humidity = data.main.humidity;
        const heatIndex = calculateHeatIndex(temp, humidity);
        
        infoWindow.setContent(`
          <div>
            <strong>${barangay.name}</strong><br>
            Temperature: ${temp.toFixed(1)}°C<br>
            Humidity: ${humidity}%<br>
            Heat Index: ${heatIndex}°C
          </div>
        `);
      })
      .catch(error => {
        console.error('Error fetching weather data:', error);
        infoWindow.setContent(`<div><strong>${barangay.name}</strong><br>Weather data unavailable</div>`);
      });

    // Add hover event listeners
    marker.addListener('mouseover', () => {
      infoWindow.open(map, marker);
    });

    marker.addListener('mouseout', () => {
      infoWindow.close();
    });
  });

  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${quezonCity.lat}&lon=${quezonCity.lng}&units=metric&appid=630c0f7f455572c8c3ef3f3551c5b2ec`)
    .then(response => response.json())
    .then(data => {
      const description = data.weather[0].description;
      const temp = data.main.temp;
      const humidity = data.main.humidity;
      const heatIndex = calculateHeatIndex(temp, humidity);

      document.getElementById("weather-description").innerText = `Description: ${description}`;
      document.getElementById("temperature").innerText = `Temperature: ${temp.toFixed(1)}°C`;
      document.getElementById("humidity").innerText = `Humidity: ${humidity}%`;
      document.getElementById("heat-index").innerText = `Heat Index: ${heatIndex}°C`;
    })
    .catch(error => console.error('Error fetching weather data:', error));
}

// Initialize the map once the page is loaded
window.onload = initMap;

// Function to fetch 5-day weather forecast data from OpenWeather API
async function getWeatherData() {
  const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec'; // Replace with your OpenWeather API key
  const city = 'Quezon City'; // Replace with the desired city
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Filter the forecast data to get 1 forecast per day (e.g., at 12:00 PM)
    const dailyForecast = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    // Render the forecast data
    renderWeatherForecast(dailyForecast);
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Function to render the weather forecast into the HTML
function renderWeatherForecast(forecastData) {
  const forecastContainer = document.getElementById('forecast-container');
  forecastContainer.innerHTML = ''; // Clear any existing content

  forecastData.forEach(day => {
    const date = new Date(day.dt_txt).toLocaleDateString('en-US', {   
      month: 'long',   // e.g., "October"
      day: 'numeric' 
    });
    const temp = Math.round(day.main.temp); // Temperature in °C
    const heatIndex = Math.round(day.main.feels_like); // Feels-like temperature
    const icon = day.weather[0].icon; // Weather icon
    const iconUrl = `http://openweathermap.org/img/wn/${icon}@2x.png`; // Icon URL
  
    // Set text color conditionally based on heat index value
    let heatIndexStyle = ''; // Default to empty for inline styles

    if (heatIndex >= 52) {
      heatIndexStyle = 'color: red;'; // Red for heat index >= 52
    } else if (heatIndex >= 42 && heatIndex < 52) {
      heatIndexStyle = 'color: orange;'; // Inline orange color for heat index between 42 and 51
    } else if (heatIndex >= 33 && heatIndex < 42) {
      heatIndexStyle = 'color: #FFDB58;'; // Mustard color (#FFDB58) for heat index between 33 and 41
    } else if (heatIndex >= 27 && heatIndex < 33) {
      heatIndexStyle = 'color: yellow;'; // Yellow for heat index between 27 and 32
    } else {
      heatIndexStyle = 'color: lightgray;'; // Default color for heat index below 27
    }

    // Use the heatIndexStyle in the HTML
    const cardHtml = `
      <div class="col-md-2">
        <div class="card text-center text-light" style="width: 100%; background: rgba(251, 112, 19,0.3);">
          <p class="card-text h5 mt-4">${date}</p>
          <img src="${iconUrl}" class="card-img-top" alt="Weather Icon">
          <div class="card-body">
            <p class="card-text h1" style="${heatIndexStyle}">${heatIndex}°C</p>
            <p class="card-text h6 mb-4">Heat Index</p>
          </div>
        </div>
      </div>
    `;

    // Append the cardHtml to your container
    forecastContainer.innerHTML += cardHtml;
  });
}

// Fetch weather data on page load
getWeatherData();

     // Function to get the current time in the Philippines (GMT+8)
     function updatePhilippineTime() {
      const options = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      const now = new Intl.DateTimeFormat('en-US', options).format(new Date());
      document.getElementById('pst-clock').textContent = now;
  }

  // Update the time every second
  setInterval(updatePhilippineTime, 1000);

  // Initialize the time immediately
  updatePhilippineTime();
