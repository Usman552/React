import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCmDJYtfmqnIj9ALS3buJyM6FigJ2_1rs0",
    authDomain: "expense-tracker-dbb33.firebaseapp.com",
    projectId: "expense-tracker-dbb33",
    storageBucket: "expense-tracker-dbb33.firebasestorage.app",
    messagingSenderId: "734323087584",
    appId: "1:734323087584:web:9cdf2d5a96e710b12b1885",
    measurementId: "G-70VGL74FKJ"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);