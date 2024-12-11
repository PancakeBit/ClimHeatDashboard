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
    ];

    barangays.forEach(barangay => {
        fetchWeatherData(barangay, apiKey);
    });

    document.getElementById('generateReport').addEventListener('click', () => {
        const dateRange = document.getElementById('dateRange').value || "No Date Range Provided";
        const fileType = document.getElementById('fileType').value;

        // Gather the data to be included in the report
        const reportData = gatherReportData();

        if (fileType === 'pdf') {
            generatePDF(dateRange); // Pass the checked dateRange to generatePDF
        } else if (fileType === 'json') {
            generateJSON(reportData, dateRange);
        } else if (fileType === 'csv') {
            generateCSV(reportData, dateRange);
        }

        // Close the modal after generating the report
        const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
        modal.hide();
    });

    // Fetch weather data
    function defunctfetchWeatherData(barangay, apiKey) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${barangay.lat}&lon=${barangay.lon}&appid=${apiKey}&units=metric`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const temperature = data.main.temp;
                const humidity = data.main.humidity;
                const heatIndex = calculateHeatIndex(temperature, humidity);
                const { classification, description } = getHeatIndexInfo(heatIndex);

                var weatherDataDiv = document.getElementById('weather-data');
                weatherDataDiv.innerHTML += `
                    <div class="col">${barangay.name}</div>
                    <div class="col">${heatIndex.toFixed(2)} °C</div>
                    <div class="col">${temperature.toFixed(2)} °C</div>
                    <div class="col">${classification}</div>
                    <div class="col">${description}</div>
                `;
            })
            .catch(error => console.error('Error fetching weather data:', error));
    }

    // Your Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyA9E2A3a5Vtv01QmZHVqccuPIAX6sPnJXc",
        authDomain: "climheat-5f408.firebaseapp.com",
        projectId: "climheat-5f408",
        storageBucket: "climheat-5f408.firebasestorage.app",
        messagingSenderId: "921785500622",
        appId: "1:921785500622:web:59efedd0bbf5eecbfaa19f"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();

    async function fetchBPMRecords() {
        const snapshot = await db.collection('healthData').get();
        const bpmData = [];
        snapshot.docs.map(doc => bpmData.push(doc.data()));
        return bpmData;
    }
    // Function to convert document ID to a Date object
        async function fetchHeatData(daterange) {
            const now = new Date();
            let dateRange = [];

            // Generate the date range based on the "weekly" or "monthly" option
            if (daterange === "weekly") {
                for (let i = 0; i < 7; i++) {
                    let date = new Date(now);
                    date.setDate(now.getDate() - i);
                    dateRange.push(formatDate(date));
                }
            } else if (daterange === "monthly") {
                for (let i = 0; i < 30; i++) {
                    let date = new Date(now);
                    date.setDate(now.getDate() - i);
                    dateRange.push(formatDate(date));
                }
            } else {
                throw new Error("Invalid date range specified. Use 'weekly' or 'monthly'.");
            }

            // Create an array to hold the results
            const heatData = [];
            // Query Firestore for each date in the dateRange
            for (let date of dateRange) {
                const snapshot = await db.collection("DailyHeatData").doc(date).get();

                if (snapshot.exists) {
                    heatData.push(snapshot.data());
                }
            }

            return heatData;
        }

// Function to format the date as "ddMMMMyyyy" (e.g., "01December2024")
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${month}${day}${year}`;
}


    function identifyAtRiskIndividuals(bpmData) {
        return bpmData.filter(record => record.heartRate > 90);
    }

    async function gatherReportData() {
        const data = [];

        //------------------Important Functions to determine user barangay------------------------------//
        function hav_formula(lat1, lon1, lat2, lon2) {
            const R = 6371; // Radius of the Earth in kilometers
            const toRad = (angle) => angle * (Math.PI / 180); // Convert degrees to radians

            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c; // Distance in kilometers
        }
        function findClosestBarangay(lat, lon) {
            let closestBarangay = null;
            let shortestDistance = Infinity;

            barangays.forEach(barangay => {
                const distance = hav_formula(lat, lon, barangay.lat, barangay.lon);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    closestBarangay = barangay.name;
                }
            });

            return closestBarangay;
        }
        //-----------------------------------------------------//

        // Iterate over all barangay data to collect information across pages
        barangaysData.forEach(barangay => {
            data.push({
                barangay: barangay.name,
                heatIndex: barangay.heatIndex,
                temperature: barangay.temperature,
                classification: barangay.classification,
                description: barangay.description
            });
        });

        // Fetch BPM records and identify at-risk individuals
        const bpmData = await fetchBPMRecords();
        const atRiskIndividuals = identifyAtRiskIndividuals(bpmData);
        data.forEach(item => item.atRiskPeople = 0);
        // Add at-risk people count to each barangay item
        atRiskIndividuals.forEach(item => {
            const name_of_users_barangay = findClosestBarangay(item.latitude, item.longitude);
            try {
                const barangayData = data.find(barangay => barangay.barangay == name_of_users_barangay);
                if (barangayData) {
                    barangayData.atRiskPeople += 1;
                }
            }
            catch (e) {
                //Ignore exception because some entries in health data do not have lat and long, those do not count
            }
        });

        return data;
    }

    async function generatePDF(dateRange) {
        const data = await gatherReportData(); // Fetch data across all pages
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape'); // Set orientation to landscape
        let yOffset = 20;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        // Use the single atRiskPeople value directly from data for District 6
        const NumberOfAtRiskPeople = [];
        const BarangayLabels = [];
        data.forEach(barangay => { if(barangay.atRiskPeople != null && barangay.atRiskPeople >0 ) {
                                        NumberOfAtRiskPeople.push(barangay.atRiskPeople);
                                        BarangayLabels.push(barangay.barangay);
                                    }
                                  });
        // Set up the report title
        const reportTitle = (String(dateRange) || "Report").toUpperCase();
        doc.setFontSize(16);
        doc.text(`${reportTitle} REPORT`, pageWidth / 2, 10, { align: 'center' });
        doc.setFontSize(12);
        yOffset = 20;

        // Function to add headers on each page
        function addDailyHeaders() {
            yOffset += 10;
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 128); // Dark blue for headers
            doc.text("Barangay", 10, yOffset);
            doc.text("Heat Index", 60, yOffset);
            doc.text("Temperature", 100, yOffset);
            doc.text("Classification", 140, yOffset);
            doc.text("Description", 180, yOffset);
            yOffset += 10;
            doc.setTextColor(0, 0, 0); // Reset to black for table data
        }
        function addWeeklyHeaders() {
            yOffset += 10;
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 128); // Dark blue for headers
            doc.text("Barangay", 10, yOffset);
            doc.text("Average Heat Index", 60, yOffset);
            doc.text("Highest Heat Index", 100, yOffset);
            doc.text("Classification", 140, yOffset);
            doc.text("Description", 180, yOffset);
            yOffset += 10;
            doc.setTextColor(0, 0, 0); // Reset to black for table data
        }
        async function returnAirQualityChart() {
                // AIR QUALITY BAR CHART
                    const canvas2 = document.createElement('canvas');
                    canvas2.width = 600;
                    canvas2.height = 300;
                    const ctx2 = canvas2.getContext('2d');
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
                ];

                    let airQualityForEachBarangay = [];
                    let barangay_names = [];

                    const promises = barangays.map(barangay => {
                            const air_url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${barangay.lat}&lon=${barangay.lon}&appid=${apiKey}`;
                            return fetch(air_url)
                                .then(response => response.json())
                                .then(data => {
                                    const query_result = data.list[0].main.aqi;
                                    return { name: barangay.name, airQuality: query_result };
                                });
                        });

                        try {
                            const results = await Promise.all(promises);
                            results.forEach(result => {
                                barangay_names.push(result.name);
                                airQualityForEachBarangay.push(result.airQuality);
                            });
                    }
                    catch (error) {
                    console.error('Error:', error);
                    }

                   // ---------------------------- DATA CUSTOMIZATION FOR CHART STARTS HERE --------------------------------- //
                        const bar_colors = [
                                '#1eeb3d', // Good - Light Green
                                '#f2db29', // Fair - Yellow
                                '#f2aa18', // Moderate - Orange
                                '#821e05', // Poor - Red
                                '#d12106' // Very Poor - Bright Red
                              ]
                        // Air quality levels as string values
                        const airQualityLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

                        // Convert air quality ratings to corresponding labels
                        const air_quality_background_colors = airQualityForEachBarangay.map(value => bar_colors[value - 1]);

                        // Chart.js vertical bar chart
                        new Chart(ctx2, {
                          type: 'bar',
                          data: {
                            labels: barangay_names, // X-axis labels (barangay names)
                            datasets: [{
                              label: 'Air Quality Rating',
                              data: airQualityForEachBarangay,
                              backgroundColor: air_quality_background_colors,
                              borderWidth: 1
                            }]
                          },
                            options: {
                                    responsive: false, // Turn off responsiveness
                                    maintainAspectRatio: false, // Allow exact width/height settings
                                    scales: {
                                      x: {
                                        title: {
                                          display: true,
                                          text: 'Barangays'
                                        }
                                      },
                                      y: {
                                        title: {
                                          display: true,
                                          text: 'Air Quality Levels'
                                        },

                                        ticks: {
                                          callback: function(value, index, values) {
                                            return airQualityLevels[value - 1]; // Map air quality index to string
                                          },
                                          stepSize: 1,
                                        },
                                          labels: ["Good", "Fair", "Moderate", "Poor", "Very Poor"],
                                          min: 0,
                                          max: 5, // Ensure scale matches air quality index range
                                      }
                                    },
                                    plugins: {
                                        title: { display: true, text: 'Air Quality of Each Barangay' },
                                      legend: {
                                        display: false // Hide legend
                                      },
                                      tooltip: {
                                        callbacks: {
                                          title: function(context) {
                                            return `Barangay: ${context[0].label}`;
                                          },
                                          label: function(context) {
                                            const rating = airQualityLevels[context.raw - 1];
                                            return `Air Quality: ${rating}`;
                                          }
                                        }
                                      }
                                    }
                                  }
                        });
                return canvas2;
        }

        // DAILY WEATHER REPORT
        if(dateRange === 'daily') {        // Loop through the data to populate PDF content (excluding at-risk people count in table)
        addDailyHeaders(); // Add headers on the first page
                // For each item in data, write to document
                data.forEach((item) => {
                    const classificationText = item.classification;
                    const descriptionText = doc.splitTextToSize(item.description, 100); // Limit to 80 units for wrapping

                    // Check if adding the current row would exceed page height; add new page if necessary
                    if (yOffset + 10 * descriptionText.length > pageHeight - 20) {
                        doc.addPage();
                        yOffset = 20;
                        addDailyHeaders();
                    }

                    // Add text to the PDF, ensuring alignment in each column
                    doc.text(item.barangay, 10, yOffset);
                    doc.text(String(item.heatIndex), 60, yOffset);
                    doc.text(String(item.temperature), 100, yOffset);
                    doc.text(classificationText, 140, yOffset);
                    doc.text(descriptionText, 180, yOffset);

                    yOffset += 10 * descriptionText.length;
                });

                // Create a pie chart with a single slice labeled "District 6" showing the total count of at-risk people
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: BarangayLabels,
                        datasets: [{
                            label: 'District 6',
                            data: NumberOfAtRiskPeople,
                            backgroundColor: [
                            '#FF6384',
                            "#21130d",
                            "#1e81b0",
                            "#eeeee4",
                            "#e28743",
                            "#76b5c5",
                            "#873e23",
                            "#abdbe3",
                            "#1F541B",
                            "#154c79",
                            "#F1688C", ]
                        }]
                    },
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'bottom' },
                            title: { display: true, text: 'At-risk People in Quezon City' },
                            datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (value) => value }
                        }
                    },
                    plugins: [ChartDataLabels]
                });

                const canvas2 = await returnAirQualityChart();
                // Convert chart to image and add it to the PDF
                setTimeout(() => {
                    const imgData = canvas.toDataURL('image/png');
                    // Add chart to the PDF on a new page if no space left
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(imgData, 'PNG', 10, yOffset, 150, 150); // Position and size the chart
                    yOffset += 150;

                    const airqualimg = canvas2.toDataURL('image/png');
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(airqualimg, 'PNG', 10, yOffset, 250, 150);

                    doc.save(`Weather_Report_${Date.now()}.pdf`);
                }, 1000); // Allow time for chart rendering}
            }

        // WEEKLY WEATHER REPORT
        else if(dateRange === 'weekly') {
            addWeeklyHeaders(); // First add the headers
            const AllHeat = await fetchHeatData("weekly");
            const barangayStats = {};

            // Cycle through all days and get the average of each Barangay
            AllHeat.forEach((day) => {
                // Nested loop, cycle through each Barangay
                // Use Object.entries to loop through barangays in the day object
            Object.entries(day).forEach(([barangay, heat]) => {
                // Initialize the barangay's stats if not already present
                if (!barangayStats[barangay]) {
                    barangayStats[barangay] = {
                        totalTemp: 0,
                        count: 0,
                        highestTemp: -Infinity,
                        lowestTemp: Infinity
                    };
                 }
                        // Update stats for the barangay
                barangayStats[barangay].totalTemp += heat.hottest_temp;
                barangayStats[barangay].count += 1;
                barangayStats[barangay].highestTemp = Math.max(barangayStats[barangay].highestTemp, heat.hottest_temp);
                barangayStats[barangay].lowestTemp = Math.min(barangayStats[barangay].lowestTemp, heat.hottest_temp);
            });
                        });

            const finalStats = {};
            Object.entries(barangayStats).forEach(([barangay, stats]) => {
                finalStats[barangay] = {
                    averagetemp: Math.round((stats.totalTemp / stats.count) * 100) / 100, // Round to nearest tenth
                    highesttemp: stats.highestTemp,
                    lowesttemp: stats.lowestTemp
                };
            });

                data.forEach((item) => {
                const classificationText = getHeatIndexInfo(finalStats[item.barangay].averagetemp).classification;
                const descriptionText = doc.splitTextToSize(getHeatIndexInfo(finalStats[item.barangay].averagetemp).description, 100); // Limit to 80 units for wrapping

                // Check if adding the current row would exceed page height; add new page if necessary
                if (yOffset + 10 * descriptionText.length > pageHeight - 20) {
                    doc.addPage();
                    yOffset = 20;
                    addWeeklyHeaders(); // If there is a new page while still writing out the text, add the headers again
                }

                // Add text to the PDF, ensuring alignment in each column
                doc.text(item.barangay, 10, yOffset);
                doc.text(String(finalStats[item.barangay].averagetemp), 60, yOffset);
                doc.text(String(finalStats[item.barangay].highesttemp), 100, yOffset);
                doc.text(classificationText, 140, yOffset);
                doc.text(descriptionText, 180, yOffset);

                yOffset += 10 * descriptionText.length;
            });

                    // Collect all relevant data and assign them to their own arrays
                    const barangayNames = Object.keys(finalStats);
                    const averageTemps = barangayNames.map(name => finalStats[name].averagetemp);
                    const highestTemps = barangayNames.map(name => finalStats[name].highesttemp);
                    const lowestTemps = barangayNames.map(name => finalStats[name].lowesttemp);

            const heat_canvas = document.createElement('canvas');
                  heat_canvas.width = 600;
                  heat_canvas.height = 300;
            const heatcontext = heat_canvas.getContext('2d');

            const temperatureChart = new Chart(heatcontext, {
                type: 'bar',
                data: {
                    labels: barangayNames,
                    datasets: [
                        {
                            label: 'Average Temperature (°C)',
                            data: averageTemps,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Highest Temperature (°C)',
                            data: highestTemps,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Lowest Temperature (°C)',
                            data: lowestTemps,
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                            legend: { display: true, position: 'bottom' },
                            title: { display: true, text: 'Weekly Heat Index Data' },
                            datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (value) => value },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        return `${context.dataset.label}: ${context.raw}°C`;
                                    }
                                }
                            },
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Barangays',
                            },
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Temperature (°C)'
                            }
                        }
                    }
                }
            });


            // Create a pie chart with a single slice labeled "District 6" showing the total count of at-risk people
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: BarangayLabels,
                        datasets: [{
                            label: 'District 6',
                            data: NumberOfAtRiskPeople,
                            backgroundColor: [
                            '#FF6384',
                            "#21130d",
                            "#1e81b0",
                            "#eeeee4",
                            "#e28743",
                            "#76b5c5",
                            "#873e23",
                            "#abdbe3",
                            "#1F541B",
                            "#154c79",
                            "#F1688C", ]
                        }]
                    },
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'bottom' },
                            title: { display: true, text: 'At-risk People in Quezon City' },
                            datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (value) => value }
                        }
                    },
                    plugins: [ChartDataLabels]
                });

                const canvas2 = await returnAirQualityChart();
                // Convert chart to image and add it to the PDF
                setTimeout(() => {
                    const heat_canvas_data = heat_canvas.toDataURL('image/png');
                    // Add chart to the PDF on a new page if no space left
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(heat_canvas_data, 'PNG', 10, yOffset, 250, 150); // Position and size the chart
                    yOffset += 150;

                    const imgData = canvas.toDataURL('image/png');
                    // Add chart to the PDF on a new page if no space left
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(imgData, 'PNG', 10, yOffset, 150, 150); // Position and size the chart
                    yOffset += 150;

                    const airqualimg = canvas2.toDataURL('image/png');
                    // Add chart to the PDF on a new page if no space left
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(airqualimg, 'PNG', 10, yOffset, 250, 150);

                    doc.save(`Weather_Report_${Date.now()}.pdf`);
                }, 1000); // Allow time for chart rendering}

        }

        // MONTHYL WEATHER REPORT
        else if(dateRange === 'monthly') {
            addWeeklyHeaders(); // First add the headers
            const AllHeat = await fetchHeatData("monthly");
            const barangayStats = {};

            // Cycle through all days and get the average of each Barangay
            AllHeat.forEach((day) => {
                // Nested loop, cycle through each Barangay
                // Use Object.entries to loop through barangays in the day object
            Object.entries(day).forEach(([barangay, heat]) => {
                // Initialize the barangay's stats if not already present
                if (!barangayStats[barangay]) {
                    barangayStats[barangay] = {
                        totalTemp: 0,
                        count: 0,
                        highestTemp: -Infinity,
                        lowestTemp: Infinity
                    };
                 }
                        // Update stats for the barangay
                barangayStats[barangay].totalTemp += heat.hottest_temp;
                barangayStats[barangay].count += 1;
                barangayStats[barangay].highestTemp = Math.max(barangayStats[barangay].highestTemp, heat.hottest_temp);
                barangayStats[barangay].lowestTemp = Math.min(barangayStats[barangay].lowestTemp, heat.hottest_temp);
            });
                        });

            const finalStats = {};
            Object.entries(barangayStats).forEach(([barangay, stats]) => {
                finalStats[barangay] = {
                    averagetemp: Math.round((stats.totalTemp / stats.count) * 100) / 100, // Round to nearest tenth
                    highesttemp: stats.highestTemp,
                    lowesttemp: stats.lowestTemp
                };
            });

                data.forEach((item) => {
                const classificationText = getHeatIndexInfo(finalStats[item.barangay].averagetemp).classification;
                const descriptionText = doc.splitTextToSize(getHeatIndexInfo(finalStats[item.barangay].averagetemp).description, 100); // Limit to 80 units for wrapping
                // Check if adding the current row would exceed page height; add new page if necessary
                if (yOffset + 10 * descriptionText.length > pageHeight - 20) {
                    doc.addPage();
                    yOffset = 20;
                    addWeeklyHeaders(); // If there is a new page while still writing out the text, add the headers again
                }

                // Add text to the PDF, ensuring alignment in each column
                doc.text(item.barangay, 10, yOffset);
                doc.text(String(finalStats[item.barangay].averagetemp), 60, yOffset);
                doc.text(String(finalStats[item.barangay].highesttemp), 100, yOffset);
                doc.text(classificationText, 140, yOffset);
                doc.text(descriptionText, 180, yOffset);

                yOffset += 10 * descriptionText.length;
            });

                    // Collect all relevant data and assign them to their own arrays
                    const barangayNames = Object.keys(finalStats);
                    const averageTemps = barangayNames.map(name => finalStats[name].averagetemp);
                    const highestTemps = barangayNames.map(name => finalStats[name].highesttemp);
                    const lowestTemps = barangayNames.map(name => finalStats[name].lowesttemp);

            const heat_canvas = document.createElement('canvas');
                  heat_canvas.width = 600;
                  heat_canvas.height = 300;
            const heatcontext = heat_canvas.getContext('2d');

            const temperatureChart = new Chart(heatcontext, {
                type: 'bar',
                data: {
                    labels: barangayNames,
                    datasets: [
                        {
                            label: 'Average Temperature (°C)',
                            data: averageTemps,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Highest Temperature (°C)',
                            data: highestTemps,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Lowest Temperature (°C)',
                            data: lowestTemps,
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                            legend: { display: true, position: 'bottom' },
                            title: { display: true, text: 'Monthly Heat Index Data' },
                            datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (value) => value }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Barangays',
                            },
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Temperature (°C)'
                            }
                        }
                    }
                }
            });


            // Create a pie chart with a single slice labeled "District 6" showing the total count of at-risk people
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: BarangayLabels,
                        datasets: [{
                            label: 'District 6',
                            data: NumberOfAtRiskPeople,
                            backgroundColor: [
                            '#FF6384',
                            "#21130d",
                            "#1e81b0",
                            "#eeeee4",
                            "#e28743",
                            "#76b5c5",
                            "#873e23",
                            "#abdbe3",
                            "#1F541B",
                            "#154c79",
                            "#F1688C", ]
                        }]
                    },
                    options: {
                        responsive: false,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'bottom' },
                            title: { display: true, text: 'At-risk People in Quezon City' },
                            datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (value) => value }
                        }
                    },
                    plugins: [ChartDataLabels]
                });

                const canvas2 = await returnAirQualityChart();
                // Convert chart to image and add it to the PDF
                setTimeout(() => {
                    const heat_canvas_data = heat_canvas.toDataURL('image/png');
                    // Add chart to the PDF on a new page if no space left
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(heat_canvas_data, 'PNG', 10, yOffset, 250, 150); // Position and size the chart
                    yOffset += 150;

                    const imgData = canvas.toDataURL('image/png');
                    // Add chart to the PDF on a new page if no space left
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(imgData, 'PNG', 10, yOffset, 150, 150); // Position and size the chart
                    yOffset += 150;

                    const airqualimg = canvas2.toDataURL('image/png');
                    // Add chart to the PDF on a new page if no space left
                    if (yOffset + 100 > pageHeight) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    doc.addImage(airqualimg, 'PNG', 10, yOffset, 250, 150);

                    doc.save(`Weather_Report_${Date.now()}.pdf`);
                }, 1000); // Allow time for chart rendering}

        }
    }





    function generateCSV(data, dateRange) {
        const csvContent = [
            "Barangay,Heat Index,Temperature,Classification,Description,At-risk People",
            ...data.map(item => `${item.barangay},${item.heatIndex},${item.temperature},${item.classification},${item.description},${item.atRiskPeople}`)
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Weather_Report_${dateRange || Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function generateJSON(data, dateRange) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Weather_Report_${dateRange || Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});


function getHeatIndexInfo(heatIndex) {
    if (heatIndex >= 52) {
        return {
            classification: "Extreme Danger",
            description: "Heat stroke is imminent."
        };
    } else if (heatIndex >= 42) {
        return {
            classification: "Danger",
            description: "Heat cramps and heat exhaustion are likely; heat stroke is probable with continued exposure."
        };
    } else if (heatIndex >= 33) {
        return {
            classification: "Extreme Caution",
            description: "Heat cramps and heat exhaustion are possible. Continuing activity could lead to heat stroke."
        };
    } else if (heatIndex >= 27) {
        return {
            classification: "Caution",
            description: "Fatigue is possible with prolonged exposure and activity. Continuing activity could lead to heat cramps."
        };
    } else {
        return {
            classification: "Normal",
            description: "No immediate health risks."
        };
    }
}


function generateCSV(data, dateRange) {
    const csvRows = [];
    csvRows.push(['Barangay', 'Heat Index', 'Temperature', 'Classification', 'Description']); // Header

    data.forEach(item => {
        csvRows.push([item.barangay, item.heatIndex, item.temperature, item.classification, item.description]);
    });

    const blob = new Blob([csvRows.map(row => row.join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${dateRange}.csv`;
    link.click();
}


    // Function to calculate heat index
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


    let currentPage = 1;
    const rowsPerPage = 4;
    let barangaysData = []; // To store barangays data with weather info

    // Fetch weather data as before
    function fetchWeatherData(barangay, apiKey) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${barangay.lat}&lon=${barangay.lon}&appid=${apiKey}&units=metric`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                barangaysData.push({
                    name: barangay.name,
                    heatIndex: calculateHeatIndex(data.main.temp, data.main.humidity).toFixed(2),
                    temperature: data.main.temp.toFixed(2),
                    classification: getHeatIndexInfo(calculateHeatIndex(data.main.temp, data.main.humidity)).classification,
                    description: getHeatIndexInfo(calculateHeatIndex(data.main.temp, data.main.humidity)).description
                });
                displayCurrentPage();
            })
            .catch(error => console.error('Error fetching weather data:', error));
    }

 // Display rows based on the current page
function displayCurrentPage() {
    const weatherDataDiv = document.getElementById('weather-data');
    weatherDataDiv.innerHTML = `
        <div class="col bg-dark text-light">Barangay</div>
        <div class="col bg-dark text-light">Heat Index</div>
        <div class="col bg-dark text-light">Temperature</div>
        <div class="col bg-dark text-light">Effect Based Classification</div>
        <div class="col bg-dark text-light">Description</div>
    `;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const currentBarangays = barangaysData.slice(start, end);

    currentBarangays.forEach(barangay => {
        weatherDataDiv.innerHTML += `
            <div class="col">${barangay.name}</div>
            <div class="col">${barangay.heatIndex} °C</div>
            <div class="col">${barangay.temperature} °C</div>
            <div class="col">${barangay.classification}</div>
            <div class="col">${barangay.description}</div>
        `;
    });

    updatePagination();
}

function defunctupdatePagination() {
    const totalPages = Math.ceil(barangaysData.length / rowsPerPage);
    document.getElementById('prev-page').classList.toggle('disabled', currentPage === 1);
    document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);

    // Get pagination links
    const paginationItems = document.querySelectorAll('.pagination .page-item');

    paginationItems.forEach(item => {
        const pageNum = parseInt(item.getAttribute('data-page'));

        if (pageNum) { // Only apply to actual page numbers, not "Prev" or "Next"
            if (pageNum === currentPage) {
                item.classList.add('active'); // Add active class to current page
            } else {
                item.classList.remove('active'); // Remove active class from other pages
            }
        }
    });
}


function defunctchangePage(newPage) {
    const totalPages = Math.ceil(barangaysData.length / rowsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayCurrentPage();  // Update display
        updatePagination();     // Update pagination active state
    }
}




// Global variable to store filtered results
let filteredBarangays = [];

// Function to handle search input
document.getElementById('searchBar').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    const weatherDataDiv = document.getElementById('weather-data');

    // If search bar is empty, reset filteredBarangays to the full dataset
    if (!filter) {
        filteredBarangays = barangaysData; // Reset to original data
        currentPage = 1;                   // Reset to first page
        displayCurrentPage();
        return;
    }

    // Filter barangays based on the input value and store results in filteredBarangays
    filteredBarangays = barangaysData.filter(barangay =>
        barangay.name.toLowerCase().includes(filter)
    );

    // Reset to the first page of filtered results and display
    currentPage = 1;
    displayCurrentPage();
});

// Function to display the current page of either original or filtered data
function defunctdisplayCurrentPage() {
    const weatherDataDiv = document.getElementById('weather-data');
    weatherDataDiv.innerHTML = `
        <div class="col bg-dark text-light">Barangay</div>
        <div class="col bg-dark text-light">Heat Index</div>
        <div class="col bg-dark text-light">Temperature</div>
        <div class="col bg-dark text-light">Effect Based Classification</div>
        <div class="col bg-dark text-light">Description</div>
    `;

    // Use filtered data if it exists, otherwise use full data
    const dataToDisplay = filteredBarangays.length ? filteredBarangays : barangaysData;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const currentBarangays = dataToDisplay.slice(start, end);

    currentBarangays.forEach(barangay => {
        weatherDataDiv.innerHTML += `
            <div class="col">${barangay.name}</div>
            <div class="col">${barangay.heatIndex} °C</div>
            <div class="col">${barangay.temperature} °C</div>
            <div class="col">${barangay.classification}</div>
            <div class="col">${barangay.description}</div>
        `;
    });

    updatePagination(dataToDisplay);
}

// Updated updatePagination function to use data length dynamically
function updatePagination(dataToDisplay) {
    const totalPages = Math.ceil(dataToDisplay.length / rowsPerPage);
    document.getElementById('prev-page').classList.toggle('disabled', currentPage === 1);
    document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);

    // Get pagination links and update active state
    const paginationItems = document.querySelectorAll('.pagination .page-item');
    paginationItems.forEach(item => {
        const pageNum = parseInt(item.getAttribute('data-page'));
        if (pageNum) {
            if (pageNum === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });
}

function changePage(newPage) {
    const totalPages = Math.ceil((filteredBarangays.length ? filteredBarangays : barangaysData).length / rowsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayCurrentPage();
    }
}

