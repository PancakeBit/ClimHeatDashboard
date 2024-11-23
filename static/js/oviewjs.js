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


let map; // Global map variable
let searchMarker = null; // Variable to store the search marker

// Google Maps initialization
function initMap() {
  const quezonCity = { lat: 14.6760, lng: 121.0437 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: quezonCity,
  });

  // Define cooling spots
  const coolingSpots = [
    { lat: 14.7013, lng: 121.0747, name: "La Mesa Eco Park", description: "A large nature park with shaded areas, trees, and water features—ideal for cooling down." },
    { lat: 14.6507, lng: 121.0480, name: "Quezon Memorial Circle", description: "A major park with shaded walkways, gardens, and ponds, providing a cooler environment." },
    { lat: 14.7301, lng: 121.0613, name: "SM City Fairview", description: "A large shopping mall with air-conditioned areas, offering refuge from the heat." },
    { lat: 14.7281, lng: 121.0599, name: "Ayala Malls Fairview Terraces", description: "Another major shopping center with ample shaded and indoor cooling areas." },
    { lat: 14.7314, lng: 121.0738, name: "Lagro Covered Court", description: "A covered court providing a shaded space for recreation and rest." },
    { lat: 14.7053, lng: 121.0594, name: "Novaliches District Hospital", description: "The hospital can serve as an emergency cooling center during heat waves." },
    { lat: 14.7297, lng: 121.0776, name: "Amparo Nature Park", description: "A green, shaded area with benches and walking paths." },
    { lat: 14.7243, lng: 121.0615, name: "North Fairview Subdivision Park", description: "A community park with shaded areas for relaxation." },
    { lat: 14.6954, lng: 121.0978, name: "Batasan Hills National High School Grounds", description: "School grounds with shaded and open areas, available for use during emergencies." },
    { lat: 14.6756, lng: 121.0574, name: "Commonwealth Market Area", description: "Near various shaded market areas and structures." }
  ];
  

  // Add markers for each barangay
  district6Barangays.forEach(barangay => {
    const marker = new google.maps.Marker({
      position: { lat: barangay.lat, lng: barangay.lng },
      map: map,
      title: barangay.name,
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

  // Add markers for each cooling spot
  // Adding cooling spot markers with specific descriptions
  coolingSpots.forEach(spot => {
    const marker = new google.maps.Marker({
      position: { lat: spot.lat, lng: spot.lng },
      map: map,
      title: spot.name,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" // Custom icon for cooling spots
      }
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div><strong>${spot.name}</strong><br>${spot.description}</div>`
    });

    // Add hover event listeners for cooling spots
    marker.addListener('mouseover', () => {
      infoWindow.open(map, marker);
    });

    marker.addListener('mouseout', () => {
      infoWindow.close();
    });
  });
}

// Search for a specific location
function searchLocation() {
  const searchQuery = document.getElementById("location-search").value.trim();
  
  // If search is empty, clear the marker and exit
  if (!searchQuery) {
    if (searchMarker) {
      searchMarker.setMap(null); // Remove the marker from the map
      searchMarker = null;       // Clear the marker reference
    }
    return;
  }

  const geocoder = new google.maps.Geocoder();

  // Geocode the search query
  geocoder.geocode({ address: searchQuery }, (results, status) => {
    if (status === "OK" && results[0]) {
      const location = results[0].geometry.location;

      // Clear any previous search marker
      if (searchMarker) {
        searchMarker.setMap(null);
      }

      // Add a new marker for the searched location
      searchMarker = new google.maps.Marker({
        map: map,
        position: location,
        title: searchQuery,
      });

      // Center the map on the searched location
      map.setCenter(location);

      // Fetch weather data for the searched location
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat()}&lon=${location.lng()}&units=metric&appid=630c0f7f455572c8c3ef3f3551c5b2ec`)
        .then(response => response.json())
        .then(data => {
          const temp = data.main.temp;
          const humidity = data.main.humidity;
          const heatIndex = calculateHeatIndex(temp, humidity);
          
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div>
                <strong>${searchQuery}</strong><br>
                Temperature: ${temp.toFixed(1)}°C<br>
                Humidity: ${humidity}%<br>
                Heat Index: ${heatIndex}°C
              </div>
            `
          });

          // Show info window on hover
          searchMarker.addListener("mouseover", () => {
            infoWindow.open(map, searchMarker);
          });
          searchMarker.addListener("mouseout", () => {
            infoWindow.close();
          });
        })
        .catch(error => {
          console.error("Error fetching weather data:", error);
        });
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
}

// Example heat index calculation function (add your own if needed)
function calculateHeatIndex(temp, humidity) {
  return (temp + humidity) / 2;
}




// Initialize the map once the page is loaded
window.onload = initMap;

// Function to fetch 5-day weather forecast data from OpenWeather API
async function getWeatherData() {
  const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec'; // Replace with your OpenWeather API key
  const city = 'Quezon City'; // Replace with the desired city
  const geocodingApi = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

  try {
    // Fetch geolocation coordinates for the city
    const geoResponse = await fetch(geocodingApi);
    const geoData = await geoResponse.json();
    if (!geoData.length) throw new Error('Geocoding failed. City not found.');

    const { lat, lon } = geoData[0];
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const airQualityApiUrl = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    // Fetch weather and air quality data
    const [weatherResponse, airQualityResponse] = await Promise.all([
      fetch(weatherApiUrl),
      fetch(airQualityApiUrl),
    ]);

    const weatherData = await weatherResponse.json();
    const airQualityData = await airQualityResponse.json();

    // Filter the forecast data to get 1 forecast per day (e.g., at 12:00 PM)
    const dailyForecast = weatherData.list.filter(item =>
      item.dt_txt.includes('12:00:00')
    );

    renderWeatherForecast(dailyForecast, airQualityData.list);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Function to render the weather and air quality forecast into the HTML
function renderWeatherForecast(forecastData, airQualityData) {
  const forecastContainer = document.getElementById('forecast-container');
  forecastContainer.innerHTML = ''; // Clear any existing content

  forecastData.forEach((day, index) => {
    const date = new Date(day.dt_txt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
    const temp = Math.round(day.main.temp);
    const heatIndex = Math.round(day.main.feels_like);
    const icon = day.weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/wn/${icon}@2x.png`;

    // Air quality data for the same time
    const airQuality = airQualityData[index];
    const airQualityIndex = airQuality ? airQuality.main.aqi : 'N/A';
    const airQualityDescription = getAirQualityDescription(airQualityIndex);

    let heatIndexStyle = '';
    if (heatIndex >= 52) heatIndexStyle = 'color: red;';
    else if (heatIndex >= 42) heatIndexStyle = 'color: orange;';
    else if (heatIndex >= 33) heatIndexStyle = 'color: #FFDB58;';
    else if (heatIndex >= 27) heatIndexStyle = 'color: yellow;';
    else heatIndexStyle = 'color: lightgray;';

    const cardHtml = `
      <div class="col-md-2">
        <div class="card text-center text-light flip-card" style="width: 100%; background: rgba(251, 112, 19, 0.3);">
          <div class="flip-card-inner">
            <!-- Front Side -->
            <div class="flip-card-front">
              <p class="card-text h5 mt-4"><i class="fas fa-calendar-day"></i> ${date}</p>
              <img src="${iconUrl}" class="card-img-top" alt="Weather Icon">
              <div class="card-body">
                <p class="card-text h1" style="${heatIndexStyle}">
                  <i class="fas fa-temperature-high"></i> ${heatIndex}°C
                </p>
                <p class="card-text h6 mb-4">Heat Index</p>
              </div>
            </div>
            <!-- Back Side -->
            <div class="flip-card-back">
              <div class="card-body">
                <p class="card-text h5 mt-4"><i class="fas fa-calendar-day"></i> ${date}</p>
                <p class="card-text h1"><i class="fas fa-wind"></i> ${airQualityIndex}</p>
                <p class="card-text h6 mb-4">${airQualityDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    forecastContainer.innerHTML += cardHtml;
  });

  // Add flipping functionality: Flip all cards when one is clicked
  const allCards = document.querySelectorAll('.flip-card-inner');
  allCards.forEach(cardInner => {
    cardInner.addEventListener('click', () => {
      // Toggle the 'flipped' class for all cards
      allCards.forEach(inner => inner.classList.toggle('flipped'));
    });
  });
}

// Function to get air quality description based on AQI index
function getAirQualityDescription(aqi) {
  switch (aqi) {
    case 1: return 'Good';
    case 2: return 'Fair';
    case 3: return 'Moderate';
    case 4: return 'Poor';
    case 5: return 'Very Poor';
    default: return 'N/A';
  }
}



// Fetch weather data on page load
getWeatherData();

document.querySelectorAll('.flip-card').forEach(card => {
  card.addEventListener('click', () => {
    const inner = card.querySelector('.flip-card-inner');
    inner.classList.toggle('flipped');
  });
});
