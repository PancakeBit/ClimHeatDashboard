import { getDataFromFirebase } from './firebaseconnections.js';

//Store today's date in a variable
var today = new Date();
var day = today.getDate();
var month = today.toLocaleDateString('default', {month: 'long'});
var year = today.getFullYear();

var dashboardDate = document.getElementById("date-today");
dashboardDate.innerHTML = day + " " + month + " " + year;
dashboardDate.style.display="block";

//console.log(day+month+year);



//Get Data from OpenWeatherMap
const apikey = "ab3b138474fe3eec33d92c308fd27126";

//Class data structure of the current weather data for clear get, set, and methods requiring current weather data
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
        return toTitleCase(this.description);
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

async function getWeather() {
    const getWeatherAPI = `https://api.openweathermap.org/data/2.5/weather?lat=${currentWeather.latid}&lon=${currentWeather.longit}&units=metric&appid=${apikey}`;
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

function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

function setFrontEndText() {
    document.getElementById("weatherTemp").innerHTML = currentWeather.getTemp();
    document.getElementById("weatherDescription").innerHTML = currentWeather.getDesc();
    document.getElementById("cityName").innerHTML = currentWeather.getCity();
    document.getElementById("humidity").innerHTML = currentWeather.getHumid();
}

function sortTempData(tempdata) {
    let temps = Object.entries (tempdata);
    temps.sort(([, valueA], [, valueB]) => valueB - valueA);
    const sortedJson = Object.fromEntries(temps);

    return sortedJson;
}

async function fillTable(tableId, jsonData) {
    const sortedtemps = sortTempData(jsonData);
    var tableHTML = "<thead>";
    tableHTML += '<tr>';
    tableHTML += '<th scope="col">Barangay</th>'
    tableHTML += '<th scope="col">Area</th>'
    tableHTML += '<th scope="col">Heat Index</th>'
    tableHTML += '<tr>';
    tableHTML += "</thead>";
    
    tableHTML += "<tbody>";
    for (var eachItem in sortedtemps) {
      tableHTML += "<tr>";
      tableHTML += "<td>" + eachItem + "</td>";
      tableHTML += "<td>Bridgetown</td>"
      tableHTML += "<td>" + jsonData[eachItem] + "</td>";
      tableHTML += "</tr>";
    }
    tableHTML += "</tbody>";
    document.getElementById(tableId).innerHTML = tableHTML;
}

//Initialize Geolocation and grabbing weather data from OpenWeatherMap
initGeolocation();

//Get Data from Firebase and then use that data to fill the table
getDataFromFirebase().then(data => {
    fillTable("table.highesttemp", data)
    })
  .catch(error => console.error("Error:", error));