# Setup Super Admin User

This guide explains how to set up `Ryan@Crosbydevelopment.com` as a super admin user.

## Method 1: Using the Setup Script (Recommended)

### Prerequisites
1. The user must first sign up through the application with email: `Ryan@Crosbydevelopment.com`
2. Node.js and npm installed
3. `dest-service-account.json` file in the project root (for production database)

### Steps

1. **Sign up the user** (if not already done):
   - Go to the application
   - Click "Launch Application"
   - Click "Don't have an account? Sign Up"
   - Sign up with email: `Ryan@Crosbydevelopment.com`
   - Complete the signup process

2. **Run the setup script**:
   ```bash
   npm run setup-super-admin
   ```

3. **Verify the setup**:
   - Go to Firebase Console → Firestore Database
   - Navigate to `users` collection
   - Find the user document (by their email or UID)
   - Verify:
     - `role: "super_admin"`
     - `isActive: true`

## Method 2: Manual Setup in Firestore

If you prefer to set it up manually:

1. **Sign up the user** (if not already done):
   - User must sign up through the application first

2. **Find the user in Firebase Auth**:
   - Go to Firebase Console → Authentication → Users
   - Find the user with email: `Ryan@Crosbydevelopment.com`
   - Note the User UID

3. **Update Firestore user document**:
   - Go to Firebase Console → Firestore Database
   - Navigate to `users` collection
   - Find or create document with the User UID from step 2
   - Set the following fields:
     ```json
     {
       "email": "Ryan@Crosbydevelopment.com",
       "displayName": "Ryan Crosby",
       "role": "super_admin",
       "isActive": true,
       "assignedProperties": [],
       "createdAt": [server timestamp],
       "lastLogin": [server timestamp]
     }
     ```

## Super Admin Permissions

Once set up as `super_admin`, the user will have:
- ✅ Full access to all properties (no property assignment needed)
- ✅ Can create, edit, and delete all users
- ✅ Can access all data (properties, tenants, leases, tickets, etc.)
- ✅ Can modify system settings
- ✅ Bypass all property assignment restrictions

## Verification

After setup, test by:
1. Logging in with `Ryan@Crosbydevelopment.com`
2. Verifying you can see all properties
3. Checking that you can access the User Management page (when implemented)
4. Confirming you can create/edit/delete users

## Troubleshooting

**User not found error:**
- Make sure the user has signed up through the application first
- Check that the email is exactly: `Ryan@Crosbydevelopment.com` (case-sensitive in some contexts)

**Permission denied:**
- Ensure Firestore security rules are deployed
- Check that the user document has `isActive: true`
- Verify the `role` field is set to `"super_admin"` (exact string, case-sensitive)

**Script errors:**
- Verify `dest-service-account.json` exists and is valid
- Check that Firebase Admin SDK is installed: `npm install firebase-admin`
- Ensure you're using the correct service account for the target database
