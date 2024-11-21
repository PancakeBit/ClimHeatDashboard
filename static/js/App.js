//Import statements for Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const appsettings = {
  databaseURL: "https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

//Store today's date in a variable
const today = new Date();
const day = today.getDate();
const month = today.toLocaleDateString('default', {month: 'long'});
const year = today.getFullYear();

const stringToday = day+month+year;

//App settings for Firebase
const app = initializeApp(appsettings);
const database = getDatabase(app);

async function getBarangayData(date) {
        let barangayData = {};

        for (var i = 0; i < date.length; i++) {
                try {
                let dbRef = ref(database, `Barangay List/${date[i]}`)
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    barangayData[date[i]] = snapshot.val()
                } else {
                    barangayData[date[i]] = "No data available for this date"
                }
            } catch (error) {
                console.error("Error retrieving data:", error);
                throw error;
            }
        }
        return barangayData;
}

function getPastFiveDays() {
    const dateList = [];
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Loop for the past 5 days, including today
    for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i); // Go back by 'i' days

        // Format the date as "DDMonthYYYY"
        const day = String(date.getDate()).padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        const formattedDate = `${day}${month}${year}`;
        dateList.push(formattedDate);
    }

    return dateList;
}


// App.js

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
    // Chart Code
    try {
        //Get the past few days and return them as a string format for the database
        const pastDays = getPastFiveDays();

        let data = await getBarangayData(pastDays)
        let results = {};

        for (const [date, barangays] of Object.entries(data)) {
                if (typeof barangays === 'string') {
                    // Skip days with no data
                    results[date] = { barangay: "No Data Available for this Date", highestTemp: 0 };
                    continue;
                }

                let highestTemp = -Infinity;
                let hottestBarangay = null;

                for (const [barangay, details] of Object.entries(barangays)) {
                    if (details.hottest_temp > highestTemp) {
                        highestTemp = details.hottest_temp;
                        hottestBarangay = barangay;
                    }
                }

                results[date] = {
                    barangay: hottestBarangay,
                    highestTemp
                };
            }

        results = Object.fromEntries(Object.entries(results).reverse());
        console.log(results);

        let colorList = [];
        let tempList = Object.values(results);
        for(var key in tempList) {
            let tempvalue = tempList[key]["highestTemp"];
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
                else {
                    colorList.push("#505050")
                }
        }



        //------------------------------------------------------------CHART CODE STARTS HERE-----------------------------------------------------------------//
         var LineChart = new Chart(ctx, {
          type: 'line',
          labels: ["AAAA"],
          data: {
            tooltipTemplate: "Files",
            labels: Object.keys(results),
            datasets: [{
              data: Object.values(results).map(entry => entry.highestTemp),
              backgroundColor: colorList,
              hoverBorderColor: "rgba(234, 236, 244, 1)",
              fill: false,
              pointStyle: 'circle',
              pointRadius: 10,
              pointHoverRadius: 15,
            }],
          },
          options: {
            maintainAspectRatio: false,
            tooltips: {
              backgroundColor: "rgb(100,100,100)",
              bodyFontColor: "#FFFFFF",
              borderColor: '#dddfeb',
              borderWidth: 1,
              xPadding: 15,
              displayColors: true,
              caretPadding: 10,
              callbacks: {
                title: function(context) {
                        // Retrieve date and corresponding entry
                        const date = context[0].label;
                        const entry = results[date];
                        if (entry && entry.highestTemp > 0) {
                            return `${entry.barangay}`; // Display barangay and temperature
                        } else {
                            return 'No Data Available for this Date';
                        }
                    }
                }
            },
            legend: {
              display: false,
            },
            cutoutPercentage: 20,
            title: {
                display: true,
                text: '10 Day Temperature Report in Celcius'
              },
              scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: 50,
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

    document.getElementById('dateDisplay').textContent = formattedDate;
    // Display the date and time in the PST clock element
    document.getElementById('pst-clock').textContent = `${formattedTime} `;
}

    // Update the time and date every second
    setInterval(updatePhilippineTime, 1000);

    // Initialize the date and time immediately
    updatePhilippineTime();


Chart.defaults.global.defaultFontColor = '#858796';

// Pie Chart Example
var ctx = document.getElementById("barchart");

fetchWeatherForecastData();