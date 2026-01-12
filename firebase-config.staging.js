// Firebase Configuration - STAGING
// Used when deployed to staging.proppli.com

const firebaseConfig = {
    apiKey: "AIzaSyB91a3IfGIkq4a_WpYlvAug79bG8F9imI0",
    authDomain: "proppli-staging.firebaseapp.com",
    projectId: "proppli-staging",
    storageBucket: "proppli-staging.firebasestorage.app",
    messagingSenderId: "843355254478",
    appId: "1:843355254478:web:996a7fc945c47cebfdea9f",
    measurementId: "G-EJVSSPC3ZP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log('✅ Staging Firebase initialized');
