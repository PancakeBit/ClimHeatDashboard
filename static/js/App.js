// App.js
console.log("AAAAA");

async function fetchCurrentWeatherData(setTemperature, setHumidity, setHeatIndex) {
    const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec';
    const city = 'Quezon City';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

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

function calculateHeatIndex(temp, humidity) {
    const T = temp * 9 / 5 + 32; // Convert to Fahrenheit
    const R = humidity; // Humidity remains unchanged
    let HI = -42.379 + 2.04901523 * T + 10.14333127 * R -
             0.22475541 * T * R - 0.00683783 * T * T -
             0.05481717 * R * R + 0.00122874 * T * T * R +
             0.00085282 * T * R * R - 0.00000199 * T * T * R * R;

    HI = (HI - 32) * 5 / 9; // Convert back to Celsius
    return parseFloat(HI.toFixed(1)); // Return the heat index rounded to one decimal place
}

async function fetchWeatherForecastData() {
    const apiKey = '630c0f7f455572c8c3ef3f3551c5b2ec';
    const city = 'Quezon City';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        console.log('Fetching weather forecast data...');
        const response = await fetch(url);
        const data = await response.json();

        let daily_data = {};
        for(var key in data['list']) {
            const dateStr = data['list'][key]['dt_txt'].split(" ")[0];
            if (!daily_data[dateStr] || data['list'][key].main.feels_like > daily_data[dateStr].main.feels_like) {
            daily_data[dateStr] = data['list'][key];
            }
        }

        console.log('Weather forecast data:', daily_data);
        const tempList = Object.values(daily_data).map(entry => calculateHeatIndex(entry.main.temp, entry.main.humidity))
        let colorList = [];
        for(key in tempList) {
            let tempvalue = tempList[key];
            console.log(tempvalue);
                if (tempvalue < 27.00) {
                    colorList.push("#999999");
                    }
                else if (tempvalue > 27.00 && tempvalue < 32.00) {
                    colorList.push("#ffff00");
                    }
                else if (tempvalue > 32.00 && tempvalue < 41.00) {
                    colorList.push('#F3BA0A');
                    }
                else if (tempvalue > 41.00 && tempvalue < 42.00) {
                    colorList.push('#f3890a');
                    }
                else if (tempvalue > 42.00 && tempvalue < 52.00) {
                    colorList.push("#F37716");
                    }
                else if (tempvalue > 52) {
                    colorList.push("#EF580B");
                    }
        }

        //------------------------------------------------------------CHART CODE STARTS HERE-----------------------------------------------------------------//
         var myPieChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(daily_data),
            datasets: [{
              data: tempList,
              backgroundColor: colorList,
              hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
              hoverBorderColor: "rgba(234, 236, 244, 1)",
            }],
          },
          options: {
            maintainAspectRatio: false,
            tooltips: {
              backgroundColor: "rgb(225,225,225)",
              bodyFontColor: "#858796",
              borderColor: '#dddfeb',
              borderWidth: 1,
              xPadding: 15,
              displayColors: true,
              caretPadding: 10,
            },
            legend: {
              display: false
            },
            cutoutPercentage: 20,
            title: {
                display: true,
                text: '5 Day Temperature Forecast in Celcius'
              },
              scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: 40,
                        }
                    }]
                },
          },
        });
        //------------------------------------------------------------END CHARTCODE-----------------------------------------------------------------//
        //setDataPoints(dataPoints);
        //setCity(data.city.name);

    } catch (error) {
        console.error('Error fetching weather forecast data:', error);
    }
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


Chart.defaults.global.defaultFontColor = '#858796';

// Pie Chart Example
var ctx = document.getElementById("barchart");

fetchWeatherForecastData();