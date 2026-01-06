# GitHub Pages Deployment Guide

## Issue: firebase-config.js is Missing

The `firebase-config.js` file is excluded from Git (in `.gitignore`) for security reasons. However, **GitHub Pages needs this file to work**.

## Solution: Add firebase-config.js to Repository

For GitHub Pages deployment, you need to add your `firebase-config.js` file to the repository:

### Option 1: Force Add (Recommended for Public Repos with Public API Keys)

Since Firebase web API keys are safe to expose publicly, you can add the file:

```bash
git add -f firebase-config.js
git commit -m "Add firebase-config.js for GitHub Pages"
git push
```

### Option 2: Manual Upload via GitHub

1. Go to your repository on GitHub
2. Click "Add file" → "Create new file"
3. Name it: `firebase-config.js`
4. Copy the contents from your local `firebase-config.js`
5. Click "Commit new file"

### Option 3: Use GitHub Secrets (Advanced)

For a more secure approach, you could set up a build process that injects the config, but this requires additional setup.

## After Adding the File

1. Wait a few minutes for GitHub Pages to rebuild
2. Refresh your site: `https://thomas-ryan-crosby.github.io/maintenance-tracker/`
3. The app should now work!

## Security Note

Firebase web API keys are **safe to expose publicly**. They're designed to be used in client-side code. The security comes from Firestore security rules, not from hiding the API key.

## Verify Firestore Rules

Make sure your Firestore rules allow read/write access:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Firestore Database → Rules
4. Use test mode rules (for now):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

