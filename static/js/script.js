document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec'; // Replace with your OpenWeather API key

    const barangays = [
        { name: 'Apolonio Samson', lat: 14.6559, lon: 121.0077 },
        { name: 'Baesa', lat: 14.6669, lon: 121.0120 },
        { name: 'Balong Bato', lat: 14.6662, lon: 121.0041 },
        { name: 'Culiat', lat: 14.6710, lon: 121.0550 },
        { name: 'New Era', lat: 14.6649, lon: 121.0607 },
        { name: 'Pasong Tamo', lat: 14.6794, lon: 121.0593 },
        { name: 'Sangandaan', lat: 14.6739, lon: 121.0177 },
        { name: 'Sauyo', lat: 14.6951, lon: 121.0493 },
        { name: 'Talipapa', lat: 14.6855, lon: 121.0263 },
        { name: 'Tandang Sora', lat: 14.6819, lon: 121.0421 },
        { name: 'Unang Sigaw', lat: 14.6601, lon: 121.0013 }
        // Add more barangays with their coordinates
    ];

    barangays.forEach(barangay => {
        fetchWeatherData(barangay, apiKey);
    });
});

function fetchWeatherData(barangay, apiKey) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${barangay.lat}&lon=${barangay.lon}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const temperature = data.main.temp;
            const humidity = data.main.humidity;
            const heatIndex = calculateHeatIndex(temperature, humidity);

            const weatherDataDiv = document.getElementById('weather-data');
            const barangayDiv = document.createElement('div');
            barangayDiv.classList.add('row', 'w-100');

            barangayDiv.innerHTML = `
                <div class="col">${barangay.name}</div>
                <div class="col">${heatIndex.toFixed(2)} °C</div>
                <div class="col">${temperature} °C</div>
                <div class="col">${data.weather[0].description}</div>
            `;

            weatherDataDiv.appendChild(barangayDiv);
        })
        .catch(error => console.error('Error fetching weather data:', error));
}

function calculateHeatIndex(temp, humidity) {
    // Formula for calculating heat index
    const T = temp;
    const R = humidity;
    const HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));

    if (HI >= 80) {
        const HI2 = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
        return HI2;
    }

    return HI;
}
