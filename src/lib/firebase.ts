"use client";

import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB06yZDc0fF5KNmxkmjB2qmVq5y0NFYwK_4",
  authDomain: "wedding-app-69c75.firebaseapp.com",
  projectId: "wedding-app-69c75",
  storageBucket: "wedding-app-69c75.appspot.com",
  messagingSenderId: "874337951478",
  appId: "1:874337951478:web:409abe32a7ee500ec5d6d7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get storage instance
const storage = getStorage(app);

export { storage };
