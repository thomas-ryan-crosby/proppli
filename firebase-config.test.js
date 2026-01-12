// Firebase Configuration - TEST/DEVELOPMENT DATABASE
// This file is used for the phase1-development branch and local testing
// DO NOT use this configuration in production (main branch)
//
// Project: maintenance-tracker-test
// 
// To get your configuration:
// 1. Go to Firebase Console → maintenance-tracker-test project
// 2. Project Settings (gear icon) → Your apps
// 3. Copy the firebaseConfig object values below

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJ4JXSQrOgY5-ZkYJL2L2Qr3g1W2zGwik",
    authDomain: "maintenance-tracker-test.firebaseapp.com",
    projectId: "maintenance-tracker-test",
    storageBucket: "maintenance-tracker-test.firebasestorage.app",
    messagingSenderId: "1018645970988",
    appId: "1:1018645970988:web:2f38d2fcde53c81d681189"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log('🔥 Firebase initialized with TEST/DEVELOPMENT database');

