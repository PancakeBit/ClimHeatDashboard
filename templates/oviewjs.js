      // Google Maps initialization
      function initMap() {
        const location = { lat: 14.5995, lng: 120.9842 }; // Example for Quezon City
        const map = new google.maps.Map(document.getElementById("map"), {
          zoom: 12,
          center: location,
        });

        const marker = new google.maps.Marker({
          position: location,
          map: map,
        });

        // Fetch weather data from OpenWeatherMap
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=630c0f7f455572c8c3ef3f3551c5b2ec`)
          .then(response => response.json())
          .then(data => {
            const description = data.weather[0].description;
            const temp = (data.main.temp - 273.15).toFixed(1); // Convert Kelvin to Celsius
            const humidity = data.main.humidity;

            document.getElementById("weather-description").innerText = `Description: ${description}`;
            document.getElementById("temperature").innerText = `Temperature: ${temp}°C`;
            document.getElementById("humidity").innerText = `Humidity: ${humidity}%`;
          })
          .catch(error => console.error('Error fetching weather data:', error));
      }

      // Initialize the map once the page is loaded
      window.onload = initMap;