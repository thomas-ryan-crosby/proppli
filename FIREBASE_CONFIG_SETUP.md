# Firebase Configuration Setup Guide

## Overview

This project uses environment-specific Firebase configurations:
- **Production**: `firebase-config.production.js` - Used on www.proppli.com
- **Staging**: `firebase-config.staging.js` - Used on staging.proppli.com
- **Development**: `firebase-config.development.js` - Used on localhost

## Setup Instructions

### Step 1: Get Firebase Configuration

For each Firebase project (production, staging, development):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., `proppli-production`)
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app yet:
   - Click the **Web** icon (`</>`)
   - Register app with nickname (e.g., "proppli-web")
   - Click **Register app**
6. Copy the `firebaseConfig` object values

### Step 2: Update Configuration Files

Open each config file and replace the placeholder values:

#### Production Config (`firebase-config.production.js`)
```javascript
const firebaseConfig = {
    apiKey: "AIza...",           // Replace YOUR_PRODUCTION_API_KEY
    authDomain: "...",            // Replace YOUR_PRODUCTION_AUTH_DOMAIN
    projectId: "proppli-production", // Replace YOUR_PRODUCTION_PROJECT_ID
    storageBucket: "...",         // Replace YOUR_PRODUCTION_STORAGE_BUCKET
    messagingSenderId: "...",     // Replace YOUR_PRODUCTION_MESSAGING_SENDER_ID
    appId: "1:..."                // Replace YOUR_PRODUCTION_APP_ID
};
```

#### Staging Config (`firebase-config.staging.js`)
```javascript
const firebaseConfig = {
    apiKey: "AIza...",           // Replace YOUR_STAGING_API_KEY
    authDomain: "...",            // Replace YOUR_STAGING_AUTH_DOMAIN
    projectId: "proppli-staging", // Replace YOUR_STAGING_PROJECT_ID
    storageBucket: "...",         // Replace YOUR_STAGING_STORAGE_BUCKET
    messagingSenderId: "...",     // Replace YOUR_STAGING_MESSAGING_SENDER_ID
    appId: "1:..."                // Replace YOUR_STAGING_APP_ID
};
```

#### Development Config (`firebase-config.development.js`)
```javascript
const firebaseConfig = {
    apiKey: "AIza...",           // Replace YOUR_DEVELOPMENT_API_KEY
    authDomain: "...",            // Replace YOUR_DEVELOPMENT_AUTH_DOMAIN
    projectId: "proppli-development", // Replace YOUR_DEVELOPMENT_PROJECT_ID
    storageBucket: "...",         // Replace YOUR_DEVELOPMENT_STORAGE_BUCKET
    messagingSenderId: "...",     // Replace YOUR_DEVELOPMENT_MESSAGING_SENDER_ID
    appId: "1:..."                // Replace YOUR_DEVELOPMENT_APP_ID
};
```

### Step 3: Configure Authorized Domains

In each Firebase project:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add the following domains:

**Production Project:**
- `www.proppli.com`
- `proppli.com`
- `localhost` (for testing)

**Staging Project:**
- `staging.proppli.com`
- `localhost` (for testing)

**Development Project:**
- `localhost`
- `127.0.0.1`

### Step 4: Verify Configuration

1. Open `index.html` in a browser (localhost)
2. Open browser console (F12)
3. You should see:
   - `✅ Development Firebase initialized` (on localhost)
   - `✅ Config script loaded: firebase-config.development.js (DEVELOPMENT)`
   - `✅ Firebase db is ready, loading app.js...`

### Step 5: Test Each Environment

#### Test Development (Localhost)
1. Open `http://localhost:8000` (or your local server)
2. Check console for development config messages
3. Verify Firebase connection works

#### Test Staging
1. Deploy to staging branch
2. Visit `staging.proppli.com`
3. Check console for staging config messages
4. Verify Firebase connection works

#### Test Production
1. Deploy to main branch
2. Visit `www.proppli.com`
3. Check console for production config messages
4. Verify Firebase connection works

## Environment Detection

The app automatically detects the environment based on the hostname:

- **www.proppli.com** or **proppli.com** → Production config
- **staging.proppli.com** → Staging config
- **localhost** or **127.0.0.1** → Development config
- **Unknown domain** → Development config (fallback)

### Manual Override (for testing)

You can force a specific config using URL parameters:

- `?prod=true` → Force production config
- `?staging=true` → Force staging config
- `?dev=true` → Force development config

Example: `http://localhost:8000?prod=true` will use production config even on localhost.

## Security Notes

### Firebase Web API Keys
- Firebase web API keys are **safe to expose publicly**
- They're designed to be used in client-side code
- Security comes from Firestore Security Rules, not from hiding the API key

### Config Files in Git
**Option A: Include in Git (Recommended)**
- Add config files to repository
- Simplest deployment
- Firebase web keys are safe to expose

**Option B: Exclude from Git**
- Add to `.gitignore`
- Use environment variables in Vercel
- Requires build-time injection

## Troubleshooting

### Error: "Firebase configuration did not initialize properly"
- Check that the config file exists
- Verify all config values are correct (no placeholders)
- Check browser console for specific errors
- Ensure Firebase SDK is loaded before config

### Error: "Firebase config file not found"
- Verify the config file exists in the project root
- Check file name matches exactly (case-sensitive)
- Verify file is not in `.gitignore` if deploying

### Wrong Environment Detected
- Check browser console for hostname detection
- Use URL parameters to force specific config (`?prod=true`, etc.)
- Verify domain is correctly configured

### Firebase Connection Issues
- Check Firestore Security Rules allow access
- Verify Storage Rules allow access
- Check authorized domains in Firebase Console
- Verify network connectivity

## Next Steps

After configuring Firebase:

1. ✅ Set up Firestore Security Rules
2. ✅ Set up Storage Security Rules
3. ✅ Test each environment
4. ✅ Deploy to staging
5. ✅ Deploy to production

---

*For more information, see `PROPPLI_DEPLOYMENT_PLAN.md`*
