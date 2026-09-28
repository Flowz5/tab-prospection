import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBGNkvL1bIefyZdkbymbaEHww9knRbFfQ",
  authDomain: "tab-prospection.firebaseapp.com",
  projectId: "tab-prospection",
  storageBucket: "tab-prospection.firebasestorage.app",
  messagingSenderId: "210790027488",
  appId: "1:210790027488:web:dae6ef868bdcf8c164c085",
  measurementId: "G-622K0BDPE2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
