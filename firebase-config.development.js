// Firebase Configuration - DEVELOPMENT
// Used when running locally (localhost) or for development testing

const firebaseConfig = {
    apiKey: "AIzaSyBXWCvxiYbdQqqAedjynIPdQXiv_1TMNj8",
    authDomain: "proppli-development.firebaseapp.com",
    projectId: "proppli-development",
    storageBucket: "proppli-development.firebasestorage.app",
    messagingSenderId: "88798448934",
    appId: "1:88798448934:web:a8d95a9b48f9a58938c5e7",
    measurementId: "G-SVXB70D8MJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log('✅ Development Firebase initialized');
