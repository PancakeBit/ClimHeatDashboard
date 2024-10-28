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

function calculateHeatIndex(temp, humidity) {
    const T = temp;
    const R = humidity;
    const HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));

    if (HI >= 80) {
        const HI2 = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
        return HI2;
    }

    return HI;
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
    const rows = weatherDataDiv.getElementsByClassName('row');
    const data = [];

    Array.from(rows).forEach(row => {
        const cols = row.getElementsByClassName('col');
        if (cols.length > 0) {
            data.push({
                barangay: cols[0].innerText,
                heatIndex: cols[1].innerText,
                temperature: cols[2].innerText,
                classification: cols[3].innerText,
                description: cols[4].innerText,
            });
        }
    });

    return data;
}

function generatePDF(data, dateRange) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Report for ${dateRange}`, 10, 10);
    data.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.barangay}: ${item.heatIndex}`, 10, 20 + (index * 10));
    });
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
