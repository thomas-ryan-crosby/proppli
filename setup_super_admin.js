/**
 * Setup Super Admin User
 * 
 * This script sets up a super admin user in Firestore.
 * 
 * Usage:
 * 1. First, the user must sign up through the application with the email: Ryan@Crosbydevelopment.com
 * 2. Then run this script: node setup_super_admin.js
 * 
 * OR manually set in Firestore:
 * 1. Go to Firestore Database
 * 2. Find the user document (by their Firebase Auth UID)
 * 3. Update the document:
 *    - role: "super_admin"
 *    - isActive: true
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account
const serviceAccount = require('./dest-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupSuperAdmin() {
  const email = 'Ryan@Crosbydevelopment.com';
  
  try {
    // Find user by email in Firebase Auth
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`✅ Found user in Firebase Auth: ${user.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`❌ User not found in Firebase Auth. Please sign up first with email: ${email}`);
        console.log('   After signing up, run this script again.');
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    const userId = user.uid;
    
    // Check if user document exists in Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // Update existing user
      await userRef.update({
        role: 'super_admin',
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Updated existing user document to super_admin`);
    } else {
      // Create new user document
      await userRef.set({
        email: email,
        displayName: user.displayName || 'Ryan Crosby',
        role: 'super_admin',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        assignedProperties: [], // Super admin doesn't need property assignments
        profile: {
          phone: null,
          title: 'Super Administrator',
          department: null,
          notes: 'Initial super admin account'
        },
        preferences: {
          defaultProperty: null,
          notifications: {
            email: true,
            ticketUpdates: true,
            leaseExpirations: true
          }
        }
      });
      console.log(`✅ Created new user document with super_admin role`);
    }
    
    // Also set custom claim for super admin (optional, for future use)
    try {
      await admin.auth().setCustomUserClaims(userId, {
        role: 'super_admin',
        isActive: true
      });
      console.log(`✅ Set custom claims for super admin`);
    } catch (error) {
      console.warn(`⚠️ Could not set custom claims: ${error.message}`);
    }
    
    console.log(`\n✅ Super admin setup complete!`);
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: super_admin`);
    console.log(`   Status: active`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    process.exit(1);
  }
}

// Run the setup
setupSuperAdmin();
