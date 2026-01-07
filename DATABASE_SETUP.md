# Database Setup and Configuration

## Overview

This project uses **two separate Firebase projects** to ensure safe development and testing:

1. **Production Database** - Used by the `main` branch
2. **Test Database** - Used by the `phase1-development` branch and local development

## Database Configuration

### Production Database
- **Project ID**: `maintenance-tracker-760ce`
- **Config File**: `firebase-config.js`
- **Used By**: `main` branch (production deployment on GitHub Pages)
- **Purpose**: Live production data for end users

### Test/Development Database
- **Project ID**: `maintenance-tracker-test`
- **Config File**: `firebase-config.test.js`
- **Used By**: `phase1-development` branch and local development
- **Purpose**: Testing new features without affecting production data

## Automatic Configuration Selection

The application automatically selects the correct database configuration based on:

1. **Environment Detection**:
   - `localhost` or `127.0.0.1` → Uses **test database**
   - Production/GitHub Pages → Uses **production database**

2. **URL Parameters** (for manual override):
   - `?test=true` → Forces test database
   - `?prod=true` → Forces production database

3. **Branch Deployment**:
   - `main` branch on GitHub Pages → Production database
   - `phase1-development` branch → Test database (if deployed separately)

## Setup Instructions

### 1. Production Database (`firebase-config.js`)

This file should contain your **production Firebase project** configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_PRODUCTION_API_KEY",
    authDomain: "maintenancetracker-760ce.firebaseapp.com",
    projectId: "maintenance-tracker-760ce",
    storageBucket: "maintenancetracker-760ce.firebasestorage.app",
    messagingSenderId: "YOUR_PRODUCTION_MESSAGING_SENDER_ID",
    appId: "YOUR_PRODUCTION_APP_ID"
};
```

### 2. Test Database (`firebase-config.test.js`)

This file should contain your **test Firebase project** configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_TEST_API_KEY",
    authDomain: "maintenance-tracker-test.firebaseapp.com",
    projectId: "maintenance-tracker-test",
    storageBucket: "maintenance-tracker-test.firebasestorage.app",
    messagingSenderId: "YOUR_TEST_MESSAGING_SENDER_ID",
    appId: "YOUR_TEST_APP_ID"
};
```

## Firestore Security Rules

### Production Database Rules
- Should be properly secured for production use
- Restrict access based on authentication (when implemented)
- Protect sensitive data

### Test Database Rules
- Can use more permissive rules for development
- Test mode is acceptable during development
- Should still follow security best practices

## Storage Rules

### Production Storage
- Secure rules for file uploads
- Size limits and file type restrictions
- Access control based on authentication

### Test Storage
- Can be more permissive for testing
- Still enforce size limits
- Test file upload functionality

## Branch Workflow

### Working on `phase1-development` Branch

1. **Local Development**:
   - Automatically uses test database when running on `localhost`
   - No configuration needed

2. **Testing**:
   - All changes are tested against test database
   - No risk to production data

3. **Before Merging to `main`**:
   - Test thoroughly with test database
   - Verify all features work correctly
   - Test with production-like data structure

### Working on `main` Branch

1. **Production Deployment**:
   - Always uses production database
   - Never uses test database
   - All data is live production data

2. **Hotfixes**:
   - Can be made directly on `main` branch
   - Uses production database
   - Must be tested carefully

## Manual Override

If you need to manually override the database selection:

### Force Test Database
```
http://localhost:8000/?test=true
```

### Force Production Database
```
http://localhost:8000/?prod=true
```

⚠️ **Warning**: Be careful when forcing production database on localhost - you'll be working with live data!

## Verification

To verify which database you're connected to:

1. Open browser console (F12)
2. Look for the initialization message:
   - `🔥 Firebase initialized with TEST/DEVELOPMENT database` (test)
   - `🔥 Firebase initialized` (production, or no message if using default config)

## Important Notes

⚠️ **Never commit sensitive credentials**:
- Both `firebase-config.js` and `firebase-config.test.js` are in `.gitignore`
- Use `firebase-config.example.js` as a template
- Each developer should create their own config files

✅ **Best Practices**:
- Always test on test database first
- Only merge to `main` after thorough testing
- Keep test and production databases in sync (structure-wise)
- Document any schema changes

## Troubleshooting

### "Firebase config file not found" Error

1. Make sure you've created `firebase-config.js` or `firebase-config.test.js`
2. Copy from `firebase-config.example.js` if needed
3. Fill in your Firebase project credentials

### Wrong Database Being Used

1. Check the console for which config file was loaded
2. Use URL parameters to force the correct database
3. Verify you're on the correct branch

### Data Not Appearing

1. Verify you're connected to the correct database
2. Check Firestore console for the correct project
3. Ensure security rules allow read/write operations

