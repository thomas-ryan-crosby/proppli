# Authentication System - Critical Information

**Last Updated:** January 2025  
**Status:** Production Ready

---

## Overview

Proppli uses Firebase Authentication for user authentication and Firestore for user profile management. The system supports multiple user workflows including admin invitations, self-registration, and Google Sign-In.

---

## Key Authentication Flows

### 1. Admin Invites User (Invited User Flow)

**Process:**
1. Admin creates invitation → `userInvitations` and `pendingUsers` documents created
2. Invitation email sent via Cloud Function trigger (`onInvitationCreated`)
3. User clicks invitation link → Redirected to `#signup` page
4. User signs up → Firebase Auth account created
5. System checks for pending invitation → Links account with admin-assigned role
6. User is immediately active and logged in

**Critical Points:**
- Invited users are **always active** (`isActive: true`)
- "Remember Me" flag is automatically set
- Persistence is set to `LOCAL`
- User can access application immediately after signup

### 2. Self-Registration Flow

**Process:**
1. User navigates to signup page
2. User fills out form and submits
3. Firebase Auth account created
4. Default profile created with `role: 'viewer'`, `isActive: false`
5. Welcome email sent via Cloud Function (`onUserSignup`)
6. User is signed out and must wait for admin approval

**Critical Points:**
- Self-registered users are **inactive** (`isActive: false`)
- "Remember Me" flag is **NOT** set
- User is signed out after signup
- Admin must activate account before user can log in

### 3. Login Flow

**Process:**
1. User enters credentials and checks/unchecks "Remember Me"
2. Persistence set based on checkbox:
   - Checked: `LOCAL` persistence
   - Not checked: `SESSION` persistence
3. User authenticates with Firebase Auth
4. `loadUserProfile()` called
5. If active → Application shown
6. If inactive → Permission denied modal, user signed out

**Critical Points:**
- "Remember Me" preference stored in `sessionStorage` and `localStorage`
- On page load, if "Remember Me" not checked → User signed out
- `isUserActivelyLoggingIn` flag prevents sign-out during active login

### 4. Google Sign-In Flow

**Process:**
1. User clicks "Sign in with Google"
2. Google OAuth flow completes
3. Firebase Auth account created/updated
4. User profile created/updated in Firestore
5. "Remember Me" automatically set to `true`
6. User logged in immediately

---

## Critical Functions

### Client-Side (`app.js`)

#### `initAuth()`
- Initializes Firebase Auth
- Sets up `onAuthStateChanged` listener
- Handles "Remember Me" check on page load
- Manages session persistence

#### `handleLogin(e)`
- Processes login form submission
- Sets persistence based on "Remember Me" checkbox
- Stores "Remember Me" preference in storage
- Updates last login timestamp

#### `handleSignup(e)`
- Processes signup form submission
- Checks for pending invitation BEFORE creating account
- Creates Firebase Auth account
- Links to pending invitation OR creates default profile
- Handles "email already exists" errors gracefully

#### `loadUserProfile(userId)`
- Loads user profile from Firestore
- Creates default profile if missing (for existing Auth users)
- Checks for pending invitations
- Links pending invitations automatically
- Shows permission denied modal if inactive

#### `checkPendingInvitation(email)`
- Checks if email has pending invitation
- Uses Cloud Function first (works for unauthenticated users)
- Falls back to Firestore query if authenticated
- Returns full pending user data

#### `linkPendingUserToAccount(userId, email)`
- Links Firebase Auth account to pending invitation
- Creates/updates user profile with admin-assigned role
- Sets `isActive: true` for invited users
- Marks pending user as completed

#### `createUserProfile(userId, userData)`
- Creates default user profile in Firestore
- Sets `role: 'viewer'`, `isActive: false`
- Used for self-registered users

#### `handleGoogleSignIn()`
- Initiates Google Sign-In flow
- Creates/updates user profile
- Sets "Remember Me" automatically

#### `showPermissionDeniedModal(message)`
- Shows modal for inactive users
- Prevents access to application
- Signs out user after modal closed

---

## Firestore Security Rules

### Key Rules (`firestore.rules`)

#### Users Collection
- **Read:** Users can read their own profile OR admins can read all
- **Create:** Users can create their own profile with matching email
  - Must include `email` field
  - Can set any `role`/`isActive` if pending invitation exists
  - Default: `role: 'viewer'`, `isActive: false`
- **Update:** Users can update their own profile OR admins can update all
- **Delete:** Only admins can delete

#### Pending Users Collection
- **Read:** Admins can read all, authenticated users can read their own (by email)
- **Create:** Only admins can create
- **Update/Delete:** Only admins can update/delete

#### Helper Functions
- `isAuthenticated()` - Checks if user is authenticated
- `getUserDoc()` - Gets user document (returns null if doesn't exist)
- `getUserRole()` - Gets user role (returns null if user doc doesn't exist)
- `isAdmin()` - Checks if user is admin or super_admin
- `isUserActive()` - Checks if user is active
- `isSuperAdmin()` - Checks if user is super_admin

---

## Cloud Functions (`functions/index.js`)

### `checkPendingInvitation` (Callable)
- **Purpose:** Check if email has pending invitation (for unauthenticated users)
- **Authentication:** None required
- **Returns:** Full pending user data if invitation exists

### `sendInvitationEmail` (Callable)
- **Purpose:** Send invitation email (backup method)
- **Authentication:** Admin required
- **Note:** Primary email sending handled by Firestore trigger

### `sendActivationEmail` (Callable)
- **Purpose:** Send activation email (backup method)
- **Authentication:** Admin required
- **Note:** Primary email sending handled by Firestore trigger

### `onInvitationCreated` (Firestore Trigger)
- **Trigger:** When `userInvitations` document created with `sendEmail: true`
- **Purpose:** Automatically sends invitation email
- **Email Template:** `invitation`

### `onUserActivated` (Firestore Trigger)
- **Trigger:** When user's `isActive` changes from `false` to `true`
- **Purpose:** Automatically sends activation email
- **Email Template:** `activation`

### `onUserSignup` (Firestore Trigger)
- **Trigger:** When new user profile created with `isActive: false`
- **Purpose:** Automatically sends welcome email to self-registered users
- **Email Template:** `welcome`

---

## Session Management

### "Remember Me" Functionality

**How It Works:**
1. User checks/unchecks "Remember Me" during login
2. Preference stored in `sessionStorage` and `localStorage`
3. Firebase Auth persistence set:
   - Checked: `LOCAL` (persists across sessions)
   - Not checked: `SESSION` (clears when tab closes)
4. On page load, system checks storage:
   - If "Remember Me" not found → User signed out
   - If found → User stays logged in

**Critical Flags:**
- `isUserActivelyLoggingIn` - Prevents sign-out during active login
- `isInitialLoad` - Tracks initial page load vs. subsequent loads

### Persistence Types
- **LOCAL:** Persists across browser sessions (until explicit logout)
- **SESSION:** Only persists for current browser session (clears when tab closes)

---

## Email Configuration

### Firebase Auth Emails (Built-in)
- **Password Reset:** Configured in Firebase Console → Authentication → Templates
- **Email Verification:** Configured in Firebase Console → Authentication → Templates
- **SMTP Required:** Must configure SMTP settings in Firebase Console

### Custom Emails (Cloud Functions)
- **Provider:** SendGrid (via Nodemailer)
- **Configuration:** Set via `firebase functions:config:set`
  - `sendgrid.api_key` - SendGrid API key
  - `email.from` - From email address
  - `app.url` - Application URL

### Email Templates
1. **Invitation:** Sent when admin invites user
2. **Activation:** Sent when admin activates user
3. **Welcome:** Sent when user self-registers

---

## Data Structures

### Firebase Authentication
- `uid` - User ID (used as Firestore document ID)
- `email` - User email (normalized: lowercase, trimmed)
- `emailVerified` - Email verification status
- `displayName` - User display name

### Firestore: `users/{userId}`
```javascript
{
  email: "user@example.com", // Normalized: lowercase, trimmed
  displayName: "John Doe",
  role: "viewer" | "admin" | "property_manager" | "maintenance" | "super_admin",
  isActive: true | false, // CRITICAL: Controls access
  assignedProperties: ["propertyId1", "propertyId2"],
  profile: {
    phone: "123-456-7890" | null,
    title: "Property Manager" | null,
    department: "Operations" | null
  },
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp() | null,
  createdBy: "adminUserId" | null
}
```

### Firestore: `pendingUsers/{pendingUserId}`
```javascript
{
  email: "user@example.com", // Normalized: lowercase, trimmed
  displayName: "John Doe",
  role: "property_manager" | "admin" | "maintenance" | "viewer",
  isActive: true, // CRITICAL: Invited users are always active
  assignedProperties: ["propertyId1", "propertyId2"],
  profile: { ... },
  createdAt: serverTimestamp(),
  createdBy: "adminUserId",
  invitationId: "invitationId",
  status: "pending_signup" | "completed",
  linkedUserId: "userId" | null,
  linkedAt: serverTimestamp() | null
}
```

### Firestore: `userInvitations/{invitationId}`
```javascript
{
  email: "user@example.com", // Normalized: lowercase, trimmed
  displayName: "John Doe",
  role: "property_manager" | "admin" | "maintenance" | "viewer",
  assignedProperties: ["propertyId1", "propertyId2"],
  profile: { ... },
  invitedBy: "adminUserId",
  invitedAt: serverTimestamp(),
  status: "pending" | "accepted",
  sendEmail: true | false
}
```

---

## Critical Rules

### 1. Email Normalization
- **ALL** emails MUST be normalized: `email.toLowerCase().trim()`
- Used consistently across all collections and checks
- Prevents duplicate accounts with different casing

### 2. Invited Users
- `pendingUsers.isActive` MUST be `true`
- `users.isActive` MUST be `true` after signup
- "Remember Me" flag MUST be set after signup
- Persistence MUST be set to `LOCAL` after signup
- User MUST be logged in immediately after signup

### 3. Self-Registered Users
- `users.isActive` MUST be `false` after signup
- User MUST be signed out after signup
- "Remember Me" flag MUST NOT be set
- Welcome email MUST be sent

### 4. "Remember Me" Check
- Only runs on initial page load (`isInitialLoad === true`)
- Skips if user is actively logging in (`isUserActivelyLoggingIn === true`)
- Signs out if flag is not found in storage

### 5. Permission Errors
- If profile creation fails → Sign out user
- Show user-friendly error message
- Do NOT create fallback profile

---

## Common Issues and Solutions

### Issue: Invited user signed out after signup
**Cause:** "Remember Me" check running during signup  
**Solution:** Set `isUserActivelyLoggingIn = true` BEFORE creating account

### Issue: Permission denied when creating profile
**Cause:** Firestore rules blocking profile creation  
**Solution:** Ensure rules allow users to create their own profile with matching email

### Issue: User profile not found after signup
**Cause:** Profile creation failed or race condition  
**Solution:** `loadUserProfile()` automatically creates default profile if missing

### Issue: "Email already exists" error during signup
**Cause:** User already has Firebase Auth account  
**Solution:** System checks for pending invitation and guides user to sign in

### Issue: Duplicate user profiles created
**Cause:** Race condition between `loadUserProfile()` and `handleSignup()`  
**Solution:** Check for existing profile before creating, update instead of creating duplicate

### Issue: User can't log in even with correct credentials
**Cause:** "Remember Me" not checked and session expired  
**Solution:** Check "Remember Me" checkbox OR user will be signed out on page load

### Issue: CORS error when calling Cloud Functions
**Cause:** Cloud Function not properly configured for CORS  
**Solution:** Not critical - email sending handled by Firestore triggers

---

## Deployment Checklist

### Firebase Configuration
- [ ] Firebase project initialized
- [ ] Authentication providers enabled (Email/Password, Google)
- [ ] SMTP configured for Firebase Auth emails
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed

### Cloud Functions Configuration
- [ ] SendGrid API key set: `firebase functions:config:set sendgrid.api_key="..."`
- [ ] From email set: `firebase functions:config:set email.from="..."`
- [ ] App URL set: `firebase functions:config:set app.url="..."`
- [ ] Functions deployed: `firebase deploy --only functions`

### Testing Checklist
- [ ] Admin can invite user
- [ ] Invited user receives email
- [ ] Invited user can sign up and immediately log in
- [ ] Self-registered user is inactive and receives welcome email
- [ ] Admin can activate user
- [ ] Activated user receives activation email
- [ ] "Remember Me" works correctly
- [ ] Google Sign-In works
- [ ] Password reset works
- [ ] Email verification works

---

## Security Considerations

1. **Email Normalization:** Prevents duplicate accounts
2. **Role-Based Access:** Enforced by Firestore rules
3. **Active Status Check:** Inactive users cannot access application
4. **Admin-Only Operations:** User management restricted to admins
5. **Pending Invitation Validation:** Cloud Function validates invitations
6. **Session Management:** "Remember Me" properly enforced

---

## Support and Troubleshooting

For detailed workflow paths, see: `USER_WORKFLOW_PATHS.md`

For test plans, see: `TEST_PLAN.md`

For deployment instructions, see: `DEPLOYMENT.md`

---

*Document maintained by Proppli Development Team*
