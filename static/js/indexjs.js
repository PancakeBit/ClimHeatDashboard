async function fetchWeatherData() {
    const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec';
    const city = 'Cavite';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        console.log('Fetching weather data...');
        const response = await fetch(url);
        const data = await response.json();
        console.log('Weather data:', data);

        const temperature = data.main.temp;
        const humidity = data.main.humidity;
        const heatIndex = calculateHeatIndex(temperature, humidity);

        updateProgressBar('temperature-bar', temperature, `${temperature}°C`);
        updateProgressBar('humidity-bar', humidity, `${humidity}%`);
        updateProgressBar('heat-index-bar', heatIndex, `${heatIndex}`);

        // Assuming highest heat index is a static value for demonstration
        const highestHeatIndex = 75;
        updateProgressBar('highest-heat-index-bar', highestHeatIndex, `${highestHeatIndex}`);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

function calculateHeatIndex(temperature, humidity) {
    // Simplified heat index calculation
    return temperature + humidity / 2;
}

function updateProgressBar(id, value, text) {
    const progressBar = document.getElementById(id);
    progressBar.style.width = `${value}%`;
    progressBar.setAttribute('aria-valuenow', value);
    progressBar.innerText = text;
}

fetchWeatherData();
