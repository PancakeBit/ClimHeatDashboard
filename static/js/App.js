import React, { useEffect, useState } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

async function fetchCurrentWeatherData(setTemperature, setHumidity, setHeatIndex) {
    const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec';
    const city = 'Quezon City';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        console.log('Fetching current weather data...');
        const response = await fetch(url);
        const data = await response.json();
        console.log('Current weather data:', data);

        const temperature = data.main.temp;
        const humidity = data.main.humidity;
        const heatIndex = calculateHeatIndex(temperature, humidity);

        setTemperature(temperature);
        setHumidity(humidity);
        setHeatIndex(heatIndex);
    } catch (error) {
        console.error('Error fetching current weather data:', error);
    }
}

async function fetchWeatherForecastData(setDataPoints, setCity) {
    const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec';
    const city = 'Quezon City';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        console.log('Fetching weather forecast data...');
        const response = await fetch(url);
        const data = await response.json();
        console.log('Weather forecast data:', data);

        const dataPoints = data.list.map((entry) => ({
            x: new Date(entry.dt * 1000),
            y: entry.main.temp
        }));

        setDataPoints(dataPoints);
        setCity(data.city.name);
    } catch (error) {
        console.error('Error fetching weather forecast data:', error);
    }
}

function calculateHeatIndex(temp, humidity) {
    // Formula for calculating heat index
    const T = temp;
    const R = humidity;
    const HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));

    if (HI >= 80) {
        const HI2 = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R 
                    - 0.00683783 * T * T - 0.05481717 * R * R 
                    + 0.00122874 * T * T * R + 0.00085282 * T * R * R 
                    - 0.00000199 * T * T * R * R;
        return HI2;
    }

    return HI;
}


function updateProgressBar(id, value, text) {
    const progressBar = document.getElementById(id);
    progressBar.style.width = `${value}%`;
    progressBar.setAttribute('aria-valuenow', value);
    progressBar.innerText = text;
}

function App() {
    const [dataPoints, setDataPoints] = useState([]);
    const [city, setCity] = useState('');
    const [temperature, setTemperature] = useState(0);
    const [humidity, setHumidity] = useState(0);
    const [heatIndex, setHeatIndex] = useState(0);

    useEffect(() => {
        fetchCurrentWeatherData(setTemperature, setHumidity, setHeatIndex);
        fetchWeatherForecastData(setDataPoints, setCity);
    }, []);

    useEffect(() => {
        updateProgressBar('temperature-bar', temperature, `${temperature}°C`);
        updateProgressBar('humidity-bar', humidity, `${humidity}%`);
        updateProgressBar('heat-index-bar', heatIndex, `${heatIndex}`);
    }, [temperature, humidity, heatIndex]);

    const options = {
        animationEnabled: true,
        exportEnabled: true,
        theme: "light2",
        title: {
            text: `5-Day Weather Forecast for ${city}`
        },
        axisX: {
            valueFormatString: "DD MMM HH:mm"
        },
        axisY: {
            title: "Temperature (°C)",
            includeZero: true
        },
        data: [{
            type: "column",
            indexLabelFontColor: "#5A5757",
            indexLabelPlacement: "outside",
            dataPoints: dataPoints
        }]
    };

    return (
        <div>
            <CanvasJSChart options={options} />
            <div id="temperature-bar" className="progress-bar" role="progressbar" style={{ width: `${temperature}%` }} aria-valuenow={temperature} aria-valuemin="0" aria-valuemax="100">{}</div>
            <div id="humidity-bar" className="progress-bar" role="progressbar" style={{ width: `${humidity}%` }} aria-valuenow={humidity} aria-valuemin="0" aria-valuemax="100">{}</div>
            <div id="heat-index-bar" className="progress-bar" role="progressbar" style={{ width: `${heatIndex}%` }} aria-valuenow={heatIndex} aria-valuemin="0" aria-valuemax="100">{}</div>
        </div>
    );
}

export default App;
