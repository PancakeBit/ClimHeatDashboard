//Import statements for Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js"
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js"

const appsettings = {
  databaseURL: "https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const app = initializeApp(appsettings);
const database = getDatabase(app);

//Store today's date in a variable
var today = new Date();
var day = today.getDate();
var month = today.toLocaleDateString('default', {month: 'long'});
var year = today.getFullYear();

var dashboardDate = document.getElementById("date-today");
dashboardDate.innerHTML = day + " " + month + " " + year;
dashboardDate.style.display="block";

const weatherdata = ref(database, day+month+year)

//console.log(day+month+year);

//----------------------------Firebase------------------------------------------------------------------------------
//Get button and add pushToDatabase as a function to it.
//var btn = document.getElementById("pushtodb");
//btn.onclick = pushToDatabase;

//function pushToDatabase() {
//      console.log(push(weatherdata, "32.7"));
//}
//----------------------------Firebase------------------------------------------------------------------------------

//Get Data from OpenWeatherMap

const apikey = "ab3b138474fe3eec33d92c308fd27126";
class weatherData {
    constructor(){
        var longit;
        var latid;
        var temp;
        var description;
    }

    setFrontEndText() {
        try {
            document.getElementById("weatherDescription").innerHTML = toTitleCase(this.temp + "° C, " +this.description);
            const tempResult = this.description;
            console.log(tempResult);
        }
        catch(ee) {
            console.error(ee);
        }
        return 0;
    }
    
}

var firstData = new weatherData();

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
        firstData.latid = position.coords.latitude;
        firstData.longit = position.coords.longitude;
        getWeather();
     }  

function fail()
     {
        // Could not obtain location
     }

async function getWeather() {
    var getWeatherAPI = `https://api.openweathermap.org/data/2.5/weather?lat=${firstData.latid}&lon=${firstData.longit}&units=metric&appid=${apikey}`;
    try {
        const response = await fetch(getWeatherAPI);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
    
        const json = await response.json();
        firstData.temp = json['main']['feels_like'];
        firstData.description = json['weather']['0']['description'];

        firstData.setFrontEndText();
      } 
      
      catch (error) {
        console.error(error.message);
      }
}

function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

initGeolocation();
