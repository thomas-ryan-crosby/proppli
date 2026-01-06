# Firestore Security Rules Setup

If the "Save Property" button isn't working, it's likely because Firestore security rules are blocking writes.

## Quick Fix: Allow All Access (For Testing)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **maintenancetracker-760ce**
3. Click **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the rules with:

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

6. Click **Publish**

## What This Does

- Allows read and write access to all documents
- **Warning:** This is for testing only. For production, you should add proper authentication and restrict access.

## Verify It's Working

After updating the rules:
1. Refresh your app
2. Try adding a property again
3. Check the browser console (F12) for any errors

## Production Rules (Future)

Once you add authentication, you can use rules like:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{propertyId} {
      allow read, write: if request.auth != null;
    }
    match /tickets/{ticketId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

