// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9E2A3a5Vtv01QmZHVqccuPIAX6sPnJXc",
  authDomain: "climheat-5f408.firebaseapp.com",
  databaseURL: "https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "climheat-5f408",
  storageBucket: "climheat-5f408.appspot.com",
  messagingSenderId: "921785500622",
  appId: "1:921785500622:web:59efedd0bbf5eecbfaa19f",
  measurementId: "G-1XR9JVHVKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore (app);

export { db };