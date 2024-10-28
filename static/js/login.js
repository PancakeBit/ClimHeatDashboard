import { * } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { * } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js";

const appsettings = {
  databaseURL: "https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
