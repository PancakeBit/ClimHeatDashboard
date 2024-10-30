// App.js
import React, { useEffect, useState } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { db } from './firebase'; // Import Firestore
import { collection, addDoc, query, where, getDocs, Timestamp, runTransaction, doc } from "firebase/firestore"; // Import Firestore methods

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
    const T = temp;
    const R = humidity;
    const HI = parseFloat((0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094))).toFixed(2));

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

async function storeData(city, temperature, humidity, heatIndex) {
    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: false });

    console.log('Checking for existing records...');

    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    try {
        await runTransaction(db, async (transaction) => {
            const q = query(
                collection(db, 'heatIndex'),
                where('location', '==', city),
                where('timestamp', '>=', Timestamp.fromDate(oneMinuteAgo))
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log('No existing record found. Storing new data to Firestore:', {
                    heatIndex,
                    humidity,
                    location: city,
                    temperature
                });

                const newDocRef = doc(collection(db, 'heatIndex'));

                await transaction.set(newDocRef, {
                    heatIndex,
                    humidity,
                    location: city,
                    temperature,
                    timestamp: Timestamp.fromDate(timestamp)
                });

                console.log('Weather data stored successfully');
            } else {
                console.log('Record already exists for this location within the last minute.');
            }
        });
    } catch (error) {
        console.error('Error storing weather data:', error);
    }
}

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

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

    useEffect(() => {
        const interval = setInterval(() => {
            storeData(city, temperature, humidity, heatIndex);
        }, 60000); // 1 minute for testing

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [city, temperature, humidity, heatIndex]);

    const chartData = {
        labels: dataPoints.map(point => point.label),
        datasets: [
            {
                label: 'Temperature (°C)',
                data: dataPoints.map(point => point.temperature),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Humidity (%)',
                data: dataPoints.map(point => point.humidity),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
            {
                label: 'Heat Index',
                data: dataPoints.map(point => point.heatIndex),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            }
        ]
    };

    const chartOptions = {
        plugins: {
            title: {
                display: true,
                text: `5-Day Temperature Forecast for ${city}`
            },
        },
        responsive: true,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Value'
                }
            }
        }
    };

    return (
        <div>
            <Bar data={chartData} options={chartOptions} />
            <div id="temperature-bar" className="progress-bar" role="progressbar" style={{ width: `${temperature}%` }} aria-valuenow={temperature} aria-valuemin="0" aria-valuemax="100">{}</div>
            <div id="humidity-bar" className="progress-bar" role="progressbar" style={{ width: `${humidity}%` }} aria-valuenow={humidity} aria-valuemin="0" aria-valuemax="100">{}</div>
            <div id="heat-index-bar" className="progress-bar" role="progressbar" style={{ width: `${heatIndex}%` }} aria-valuenow={heatIndex} aria-valuemin="0" aria-valuemax="100">{}</div>
        </div>
    );
}



// Function to get the current date and time in the Philippines (GMT+8)
function updatePhilippineTime() {
    // Options for formatting the date
    const dateOptions = { 
        timeZone: 'Asia/Manila', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };

    // Options for formatting the time
    const timeOptions = { 
        timeZone: 'Asia/Manila', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };

    // Get the current date and time in Manila timezone
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
    const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(now);

    // Display the date and time in the PST clock element
    document.getElementById('pst-clock').textContent = `${formattedTime} || ${formattedDate} `;
}

    // Update the time and date every second
    setInterval(updatePhilippineTime, 1000);

    // Initialize the date and time immediately
    updatePhilippineTime();


    class weatherData {
        constructor(){
            var longit;
            var latid;
            var temp;
            var description;
            var humidity;
            var city;
        }

        //get Description for front end text
    getTemp() {
        return this.temp + "°C";
}
getDesc() {
    return this.description;
}

getCity() {
    return this.city;
}
getHumid() {
    return this.humidity;
}

//Setters for every function
setDesc(desc) {
    this.description = desc;
}
setLongit(num) {
    this.longit = num;
}
setLatid(num) {
    this.latid = num;
}
setTemp(num) {
    this.temp = num;
}
setCity(name) {
    this.city = name;
}
setHumid(num) {
    this.humidity = num;
}
}
    var currentWeather = new weatherData();

    //Initialize Geolocation and grabbing weather data from OpenWeatherMap
function initGeolocation()
{
   if( navigator.geolocation )
   {
      // Call getCurrentPosition with success and failure callbacks
      navigator.geolocation.getCurrentPosition( success, fail );
   }
   else
   {
      alert("Sorry, your browser does not support geolocation services.");
   }
}
function success(position)
{
   currentWeather.setLatid(position.coords.latitude);
   currentWeather.setLongit(position.coords.longitude);
   getWeather();
}

function fail()
{
   // Could not obtain location
}
function setFrontEndText() {
document.getElementById("weatherTemp").innerHTML = currentWeather.getTemp();
document.getElementById("weatherDescription").innerHTML = currentWeather.getDesc();
document.getElementById("cityName").innerHTML = currentWeather.getCity();
document.getElementById("humidity").innerHTML = currentWeather.getHumid();
}
async function getWeather() {
const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec';
const getWeatherAPI = `https://api.openweathermap.org/data/2.5/weather?lat=${currentWeather.latid}&lon=${currentWeather.longit}&units=metric&appid=${apiKey}`;
try {
   const response = await fetch(getWeatherAPI);
   if (!response.ok) {
     throw new Error(`Response status: ${response.status}`);
   }

   const json = await response.json();
   currentWeather.setTemp(json['main']['feels_like']);
   currentWeather.setDesc(json['weather']['0']['description']);
   currentWeather.setCity(json['name']);
   currentWeather.setHumid(json['main']['humidity']);
 }

 catch (error) {
   console.error(error.message);
 }

 setFrontEndText();
}
initGeolocation();




export default App;