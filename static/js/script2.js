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

    // Event listener for report generation
    document.getElementById('generateReport').addEventListener('click', () => {
        const dateRange = document.getElementById('dateRange').value;
        const fileType = document.getElementById('fileType').value;

        // Gather the data to be included in the report
        const reportData = gatherReportData();

        if (fileType === 'pdf') {
            generatePDF(reportData, dateRange);
        } else if (fileType === 'json') {
            generateJSON(reportData, dateRange);
        } else if (fileType === 'csv') {
            generateCSV(reportData, dateRange);
        }

        // Close the modal after generating the report
        const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
        modal.hide();
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
            const { classification, description } = getHeatIndexInfo(heatIndex);

            var weatherDataDiv = document.getElementById('weather-data');

            weatherDataDiv.innerHTML += `
                <div class="col">${barangay.name}</div>
                <div class="col">${heatIndex.toFixed(2)} °C</div>
                <div class="col">${temperature.toFixed(2)} °C</div>
                <div class="col">${classification}</div>
                <div class="col">${description}</div>
            `;

            weatherDataDiv.appendChild(barangayDiv);
        })
        .catch(error => console.error('Error fetching weather data:', error));
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

function gatherReportData() {
    const weatherDataDiv = document.getElementById('weather-data');
    const cols = Array.from(weatherDataDiv.getElementsByClassName('col')).slice(5); // Skip the header

    const data = [];
    for (let i = 0; i < cols.length; i += 5) {
        // Ensure there are enough columns to form a complete data row
        if (i + 4 < cols.length) {
            data.push({
                barangay: cols[i].innerText.trim(),
                heatIndex: cols[i + 1].innerText.trim(),
                temperature: cols[i + 2].innerText.trim(),
                classification: cols[i + 3].innerText.trim(),
                description: cols[i + 4].innerText.trim()
            });
        }
    }

    return data;
}




function generatePDF(data, dateRange) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yOffset = 20;

    // Set the report title and date range
    doc.text(`Report for ${dateRange}`, 10, 10);

    // Add table headers
    doc.text("No.", 10, yOffset);
    doc.text("Barangay", 20, yOffset);
    doc.text("Heat Index", 60, yOffset);
    doc.text("Temperature", 100, yOffset);
    doc.text("Classification", 140, yOffset);
    doc.text("Description", 180, yOffset);

    yOffset += 10;

    // Loop through the data to populate PDF content
    data.forEach((item, index) => {
        doc.text(`${index + 1}`, 10, yOffset);
        doc.text(item.barangay, 20, yOffset);
        doc.text(item.heatIndex, 60, yOffset);
        doc.text(item.temperature, 100, yOffset);
        doc.text(item.classification, 140, yOffset);
        doc.text(item.description, 180, yOffset);
        yOffset += 10;
    });

    // Save the generated PDF
    doc.save('report.pdf');
}


function generateJSON(data, dateRange) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${dateRange}.json`;
    link.click();
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

    function updatePagination() {
        const totalPages = Math.ceil(barangaysData.length / rowsPerPage);
        document.getElementById('prev-page').classList.toggle('disabled', currentPage === 1);
        document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);
    }

    function changePage(newPage) {
        const totalPages = Math.ceil(barangaysData.length / rowsPerPage);
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            displayCurrentPage();
        }
    }

    function updatePagination() {
        const totalPages = Math.ceil(barangaysData.length / rowsPerPage);
        document.getElementById('prev-page').classList.toggle('disabled', currentPage === 1);
        document.getElementById('next-page').classList.toggle('disabled', currentPage === totalPages);
    
        // Get pagination links
        const paginationItems = document.querySelectorAll('.pagination .page-item');
    
        // Loop through each pagination item and set the active class
        paginationItems.forEach((item, index) => {
            const pageNum = index + 1; // Pagination starts from 1
            if (pageNum === currentPage) {
                item.classList.add('active'); // Add active class to current page
            } else {
                item.classList.remove('active'); // Remove active class from other pages
            }
        });
    }
    

// Example function for filtering barangays based on search input
document.getElementById('searchBar').addEventListener('input', function() {
    const filter = this.value.toLowerCase();
    const weatherDataDiv = document.getElementById('weather-data');
    
    // Clear the displayed rows and prepare to show filtered results
    weatherDataDiv.innerHTML = `
        <div class="col bg-dark text-light">Barangay</div>
        <div class="col bg-dark text-light">Heat Index</div>
        <div class="col bg-dark text-light">Temperature</div>
        <div class="col bg-dark text-light">Effect Based Classification</div>
        <div class="col bg-dark text-light">Description</div>
    `;

    // Filter barangays based on the input value
    barangaysData.forEach(barangay => {
        if (barangay.name.toLowerCase().includes(filter)) {
            weatherDataDiv.innerHTML += `
                <div class="col">${barangay.name}</div>
                <div class="col">${barangay.heatIndex} °C</div>
                <div class="col">${barangay.temperature} °C</div>
                <div class="col">${barangay.classification}</div>
                <div class="col">${barangay.description}</div>
            `;
        }
    });

});
    