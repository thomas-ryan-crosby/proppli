# Deploy Firestore Security Rules

## Quick Deployment Steps

### Method 1: Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project: `proppli-production` (or staging/development as needed)

2. **Navigate to Firestore Rules**
   - Click **Firestore Database** in the left sidebar
   - Click the **Rules** tab at the top

3. **Copy and Paste Rules**
   - Open `FIRESTORE_SECURITY_RULES.md` in this project
   - Find the code block starting with `rules_version = '2';`
   - Copy the entire rules block (from `rules_version` to the closing `}`)
   - Paste into the Firebase Console Rules editor

4. **Publish Rules**
   - Click **Publish** button
   - Rules will be active immediately

### Method 2: Firebase CLI (If you have it installed)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Use default file names

4. **Create `firestore.rules` file**:
   - Copy the rules from `FIRESTORE_SECURITY_RULES.md`
   - Paste into `firestore.rules` file

5. **Deploy rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Rules to Deploy

The complete rules are in `FIRESTORE_SECURITY_RULES.md`. Here's a summary of what they do:

- ✅ Require authentication for all operations
- ✅ Role-based access control (super_admin, admin, property_manager, maintenance, viewer)
- ✅ Property assignment restrictions
- ✅ Super admin full access override
- ✅ User management permissions
- ✅ Collection-specific access rules

## Important Notes

1. **Deploy to All Environments**: 
   - Deploy to `proppli-production`
   - Deploy to `proppli-staging` (if using)
   - Deploy to `proppli-development` (if using)

2. **Test After Deployment**:
   - Try logging in with different user roles
   - Verify users can only access assigned properties
   - Test that super admin has full access

3. **Backup Current Rules**:
   - Before deploying, copy your current rules to a backup file
   - In case you need to rollback

## Verification

After deploying, verify the rules are active:

1. Go to Firestore Database → Rules tab
2. Check the "Last published" timestamp
3. Test with a non-admin user to ensure restrictions work
4. Test with super admin to ensure full access works

## Troubleshooting

**Rules not working?**
- Check that rules were published (look for "Last published" timestamp)
- Verify user documents have correct `role` and `isActive` fields
- Check browser console for specific error messages

**Permission denied errors?**
- Ensure user document exists in `users` collection
- Verify `isActive: true` on user document
- Check that `role` field is set correctly (case-sensitive)

**Super admin not working?**
- Verify user has `role: "super_admin"` (exact string, case-sensitive)
- Check that `isActive: true`
- Ensure rules include the super admin override at the end
