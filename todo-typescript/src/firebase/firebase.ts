import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0W9KGqzCCGJhOrBw_uov1bhehVNYgsD4",
  authDomain: "todo-app-2026-68fed.firebaseapp.com",
  projectId: "todo-app-2026-68fed",
  storageBucket: "todo-app-2026-68fed.firebasestorage.app",
  messagingSenderId: "236958720401",
  appId: "1:236958720401:web:3181735b0e9dc204d57a30"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);