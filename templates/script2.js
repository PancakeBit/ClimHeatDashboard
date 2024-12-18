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

    function identifyAtRiskIndividuals(bpmData) {
        return bpmData.filter(record => record.heartRate > 50);
    }

    async function gatherReportData() {
        const data = [];
    
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
    
        // Add at-risk people count to each barangay item
        data.forEach(item => {
            item.atRiskPeople = atRiskIndividuals.length;
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
        const totalAtRiskPeople = data[0].atRiskPeople;
    
        // Set up the report title
        const reportTitle = (String(dateRange) || "Report").toUpperCase();
        doc.setFontSize(16);
        doc.text(`${reportTitle} REPORT`, pageWidth / 2, 10, { align: 'center' });
        doc.setFontSize(12);
        yOffset = 20;
    
        // Function to add headers on each page
        function addHeaders() {
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
    
        addHeaders(); // Add headers on the first page
    
        // Loop through the data to populate PDF content (excluding at-risk people count in table)
        data.forEach((item) => {
            const classificationText = item.classification;
            const descriptionText = doc.splitTextToSize(item.description, 100); // Limit to 80 units for wrapping
    
            // Check if adding the current row would exceed page height; add new page if necessary
            if (yOffset + 10 * descriptionText.length > pageHeight - 20) {
                doc.addPage();
                yOffset = 20;
                addHeaders();
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
                labels: ["District 6"],
                datasets: [{
                    label: 'District 6',
                    data: [totalAtRiskPeople],
                    backgroundColor: ['#FF6384']
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
    
        // Convert chart to image and add it to the PDF
        setTimeout(() => {
            const imgData = canvas.toDataURL('image/png');
            
            // Add chart to the PDF on a new page if no space left
            if (yOffset + 100 > pageHeight) {
                doc.addPage();
                yOffset = 20;
            }
    
            doc.addImage(imgData, 'PNG', 10, yOffset, 100, 100); // Position and size the chart
            doc.save(`Weather_Report_${Date.now()}.pdf`);
        }, 1000); // Allow time for chart rendering
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

function updatePagination() {
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


function changePage(newPage) {
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
function displayCurrentPage() {
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

