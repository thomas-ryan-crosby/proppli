// Firebase Configuration - PRODUCTION
// Used when deployed to www.proppli.com or proppli.com

const firebaseConfig = {
    apiKey: "AIzaSyA-yh6Oc1OLsN5RCGucAXNcI8H5Wh44-q0",
    authDomain: "proppli.firebaseapp.com",
    projectId: "proppli",
    storageBucket: "proppli.firebasestorage.app",
    messagingSenderId: "1023873401694",
    appId: "1:1023873401694:web:d90498bd9307f8e358c5cf",
    measurementId: "G-GHGNJNLHCX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log('✅ Production Firebase initialized');
