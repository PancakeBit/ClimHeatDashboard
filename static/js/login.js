import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const appsettings = {
  databaseURL: "https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const app = initializeApp(firebaseConfig);
const auth = firebase.auth();

const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Firebase authentication method to sign in
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            loginStatus.textContent = `Logged in as ${user.email}`;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            loginStatus.textContent = `Error: ${errorMessage}`;
        });
});