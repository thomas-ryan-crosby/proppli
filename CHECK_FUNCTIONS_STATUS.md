# Cloud Functions Status Check

## Current Status

### ✅ Functions Code Created
- `functions/index.js` - Email functions code exists
- `functions/package.json` - Dependencies defined
- `firebase.json` - Firebase project configuration exists

### ❌ Firebase CLI Not Installed
Firebase CLI is required to deploy and configure functions.

## Installation Required

### Step 1: Install Firebase CLI

```powershell
npm install -g firebase-tools
```

Or if you prefer using npx (no global install):
```powershell
npx firebase-tools --version
```

### Step 2: Login to Firebase

```powershell
firebase login
```

This will open a browser for authentication.

### Step 3: Initialize/Select Firebase Project

```powershell
firebase use proppli-production
```

Or if not initialized:
```powershell
firebase init functions
```

### Step 4: Install Function Dependencies

```powershell
cd functions
npm install
cd ..
```

### Step 5: Set Configuration

```powershell
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set email.from="noreply@yourdomain.com"
firebase functions:config:set app.url="https://your-app-url.com"
```

### Step 6: Deploy Functions

```powershell
firebase deploy --only functions
```

## Verification Commands

After installation, run these to verify:

```powershell
# Check if functions are deployed
firebase functions:list

# Check configuration
firebase functions:config:get

# View function logs
firebase functions:log

# Test a function (from browser console)
firebase.functions().httpsCallable('sendInvitationEmail')({email: 'test@example.com', displayName: 'Test', role: 'viewer', assignedProperties: []})
```

## Current Functions Status

Based on code review:

### Functions Defined:
1. ✅ `sendInvitationEmail` - Callable function
2. ✅ `sendActivationEmail` - Callable function  
3. ✅ `onInvitationCreated` - Firestore trigger
4. ✅ `onUserActivated` - Firestore trigger

### Configuration Needed:
- ❌ `sendgrid.api_key` - Not set
- ❌ `email.from` - Not set
- ❌ `app.url` - Not set

### Dependencies:
- ❌ `node_modules` - Not installed (need to run `npm install` in functions directory)

## Next Steps

1. Install Firebase CLI globally
2. Login to Firebase
3. Install function dependencies
4. Set configuration values
5. Deploy functions
6. Test email sending

## Alternative: Check in Firebase Console

You can also check function status in Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select your project
3. Go to **Functions** section
4. Check if functions are listed
5. Check **Configuration** tab for environment variables
