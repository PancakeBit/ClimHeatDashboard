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

//Get button and add pushToDatabase as a function to it.
try {
    var btn = document.getElementById("pushtodb");
    btn.onclick = pushHighestTempToday;
}
catch (error) {
    console.error("Probably forgot to change the name of the Button ID, do that")
    console.log(error);
}
//----------------------------Firebase------------------------------------------------------------------------------
//App settings for Firebase and APIkey of openweathermap
const app = initializeApp(appsettings);
const database = getDatabase(app);
const weatherdata = ref(database, "Barangay List/"+day+month+year);
const apikey = "ab3b138474fe3eec33d92c308fd27126";

//Store coordinates of every Baranggay in District 6
//These exact coordinates taken from each barangay/city hall on Google Maps
const barangay_coords = {
    "Apolonio Samson" : {"lat": 14.655309849980318, "long": 121.01159460020295},
    "Baesa" : {"lat": 14.674639944800129, "long": 121.0134206679377},
    "Balong Bato" : {"lat": 14.608380618029102, "long": 121.02352749585779},
    "Culiat" : {"lat": 14.667972601513892, "long": 121.05667298120255},
    "New Era" : {"lat": 14.664747890509634, "long": 121.05958063621685},
    "Pasong Tamo" : {"lat": 14.674773358844922, "long": 121.0481886197324},
    "Sangandaan" : {"lat": 14.674146140551445, "long": 121.02062810933921},
    "Sauyo" : {"lat": 14.689499112512255, "long": 121.03361599901578},
    "Talipapa" : {"lat": 14.687678705704203, "long": 121.02534595907845},
    "Tandang Sora" : {"lat": 14.681888013966427, "long": 121.03228609832858},
    "Unang Sigaw" : {"lat": 14.658603132201728, "long": 120.99962414018988},
}

/* STORING OTHER BARANGAYS HERE FOR TESTING PURPOSES

*/


export async function getDataFromFirebase() {
  try {
    const snapshot = await get(weatherdata); // retrieving the data
    if (snapshot.exists()) {
      return snapshot.val(); // return data as JSON
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // throw error to be handled by the calling function
  }
}


//Push Highest Temps for Each Barangay to Database
function pushHighestTempToday() {
    getDataFromFirebase()
    .then(data => {
      console.log(data);
      if(data === undefined) {
        getHighestTempsForBarangays().then(
          function(result) {
              set(weatherdata, result);
          });
      }
      else {
        console.log("Data for today's date has already been filled");
        }
      })
    .catch(error => console.error("Error:", error));
}
//----------------------------Firebase------------------------------------------------------------------------------
async function getHighestTempsForBarangays() {
    var temperatures_for_each = {};
    for (var key in barangay_coords) {
        //initalize hottest temp and time for each barangay
        var hottest_time = 0;
        var hottest_temp = 0;

    //Get forecast for the next 24 hours
    var getWeatherAPI = `https://api.openweathermap.org/data/2.5/forecast?lat=${barangay_coords[key]['lat']}&lon=${barangay_coords[key]['long']}&units=metric&cnt=8&appid=${apikey}`;
    try {
        //Try and wait for API response
        const response = await fetch(getWeatherAPI);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        //Once response is okay, proceed
        const json = await response.json();
        var listofdays = json['list'];

        //For each barangay, find the hottest temp and time for that temp
        for (var day in listofdays) {
            if(listofdays[day]['main']['feels_like'] > hottest_temp) {
                hottest_temp = listofdays[day]['main']['feels_like'];
                hottest_time = day;
            }
        } //END LOOPING THROUGH DAYS
      }
      catch (error) {
        console.error(error.message);
      }

      //Once highest temperature for barangay is found, append to JSON var
      temperatures_for_each[key] = hottest_temp;
    } //END LOOPING THROUGH BARANGAYS
    return temperatures_for_each;
}


async function getWeather() {
    var getWeatherAPI = `https://api.openweathermap.org/data/2.5/forecast?lat=${currentWeather.latid}&lon=${currentWeather.longit}&units=metric&cnt=12&appid=${apikey}`;
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
}