# User Workflow Paths and Firebase Data Structure

## Overview
This document describes all user workflow paths, the data that should be created in Firebase, and the expected behavior at each step.

---

## Workflow 1: Admin Invites User (Invited User Flow)

### Step 1: Admin Creates Invitation
**Trigger:** Admin clicks "Invite User" button and fills out the form

**Data Created in Firebase:**
1. **`userInvitations/{invitationId}`** document:
   ```javascript
   {
     email: "user@example.com" (normalized: lowercase, trimmed),
     displayName: "John Doe",
     role: "property_manager" | "admin" | "maintenance" | "viewer",
     assignedProperties: ["propertyId1", "propertyId2"],
     profile: {
       phone: "123-456-7890" | null,
       title: "Property Manager" | null,
       department: "Operations" | null
     },
     invitedBy: "adminUserId",
     invitedAt: serverTimestamp(),
     status: "pending",
     sendEmail: true | false
   }
   ```

**Cloud Function Triggered:**
- `onInvitationCreated` (if `sendEmail: true`) → Sends invitation email with link to `https://proppli.com#signup`

**Expected Behavior:**
- Invitation and pending user documents are created
- Email is sent (if `sendEmail: true`)
- User appears in Users list with "Pending Signup" status

---

### Step 2: User Clicks Invitation Link
**Trigger:** User clicks link in invitation email

**URL:** `https://proppli.com#signup`

**Expected Behavior:**
- Landing page loads
- Hash routing detects `#signup`
- Signup page is displayed (NOT login page)

---

### Step 3: User Signs Up
**Trigger:** User fills out signup form and submits

**Process:**
1. **Set active login flag:** `isUserActivelyLoggingIn = true`
2. **Check for pending invitation BEFORE account creation:** `checkPendingInvitation(email)`
   - If invitation exists, keep it for linking after Auth creation
3. **Create Firebase Auth account:** `auth.createUserWithEmailAndPassword(email, password)`
   - **If `auth/email-already-in-use` error and invitation exists:**
     - Show message: "An account with this email already exists. Please sign in to complete your account setup."
     - Provide links to sign in and forgot password
     - User should sign in instead (see Step 3B below)
4. **Update display name:** `user.updateProfile({ displayName })`
5. **Send email verification:** `user.sendEmailVerification()`
6. **Link to pending invitation (or sync data):** `linkPendingUserToAccount(userId, email)` / `syncUserData(userId, email)`

**Data Created/Updated in Firebase:**

1. **Firebase Authentication:**
   - New user account created with email/password
   - Email verification sent

2. **`users/{userId}`** document (created by `linkPendingUserToAccount`):
   ```javascript
   {
     email: "user@example.com" (normalized: lowercase, trimmed),
     displayName: "John Doe",
     role: "property_manager", // From pendingUser.role
     isActive: true, // CRITICAL: Must be true for invited users
     assignedProperties: ["propertyId1", "propertyId2"], // From pendingUser
     profile: {
       phone: "123-456-7890" | null,
       title: "Property Manager" | null,
       department: "Operations" | null
     },
     createdAt: serverTimestamp(),
     lastLogin: serverTimestamp(), // Set on signup
     createdBy: "adminUserId" // From pendingUser
   }
   ```

3. **`userInvitations/{invitationId}`** document (updated):
   ```javascript
   {
     ...existing fields...,
     status: "accepted",
     acceptedBy: "userId",
     acceptedAt: serverTimestamp()
   }
   ```

**Session Management:**
- Set persistence to `LOCAL` (invited users remain logged in)
- No manual "Remember Me" flags are required

**Expected Behavior:**
- User account created in Firebase Auth
- User profile created in Firestore with `isActive: true`
- User is logged in immediately
- Page reloads and shows application (user is active)
- User can access the system immediately

---

### Step 3B: User Signs In (If Auth Account Already Exists)
**Trigger:** User tries to sign up but gets "email already exists" error, then signs in

**Process:**
1. **User signs in:** `auth.signInWithEmailAndPassword(email, password)`
2. **Auth state change fires:** `onAuthStateChanged` handler
3. **Load user profile:** `loadUserProfile(userId)`
4. **Profile not found:** Firestore profile doesn't exist
5. **Check for pending invitation:** `checkPendingInvitation(email)` → Returns pending user
6. **Link to pending invitation:** `linkPendingUserToAccount(userId, email)`
7. **Set session:** Set persistence to `LOCAL`
8. **Reload page:** Page reloads, user is logged in and active

**Data Created/Updated in Firebase:**

1. **`users/{userId}`** document (created by `linkPendingUserToAccount`):
   ```javascript
   {
     email: "user@example.com" (normalized),
     displayName: "John Doe",
     role: "property_manager", // From pendingUser.role
     isActive: true, // CRITICAL: Must be true for invited users
     assignedProperties: ["propertyId1", "propertyId2"],
     profile: { ... },
     createdAt: serverTimestamp(),
     lastLogin: serverTimestamp(),
     createdBy: "adminUserId"
   }
   ```

2. **`userInvitations/{invitationId}`** document (updated):
   ```javascript
   {
     ...existing fields...,
     status: "accepted",
     acceptedBy: "userId",
     acceptedAt: serverTimestamp()
   }
   ```

**Expected Behavior:**
- User signs in successfully
- Profile is automatically linked to pending invitation
- User is logged in and active
- Page reloads and shows application
- User can access the system immediately

---

## Workflow 2: Self-Registration (Regular User Flow)

### Step 1: User Visits Signup Page
**Trigger:** User navigates to signup page (not from invitation)

**URL:** `https://proppli.com#signup` or user clicks "Sign Up" link

**Expected Behavior:**
- Signup page is displayed

---

### Step 2: User Signs Up
**Trigger:** User fills out signup form and submits

**Process:**
1. **Set active login flag:** `isUserActivelyLoggingIn = true`
2. **Check for pending invitation BEFORE account creation:** `checkPendingInvitation(email)` → Returns `null`
3. **Create Firebase Auth account:** `auth.createUserWithEmailAndPassword(email, password)`
4. **Update display name:** `user.updateProfile({ displayName })`
5. **Send email verification:** `user.sendEmailVerification()`
6. **Create default profile:** `createUserProfile(userId, { role: 'viewer', isActive: false })`

**Data Created in Firebase:**

1. **Firebase Authentication:**
   - New user account created with email/password
   - Email verification sent

2. **`users/{userId}`** document (created by `createUserProfile`):
   ```javascript
   {
     email: "user@example.com" (normalized: lowercase, trimmed),
     displayName: "John Doe",
     role: "viewer", // Default role for self-registered users
     isActive: false, // CRITICAL: Requires admin approval
     assignedProperties: [],
     profile: {
       phone: "123-456-7890" | null
     },
     createdAt: serverTimestamp(),
     lastLogin: null // No login yet
   }
   ```

3. **Cloud Function Triggered:**
   - `onUserSignup` → Sends welcome email for all new user profiles

**Session Management:**
- User is signed out: `auth.signOut()`

**Expected Behavior:**
- User account created in Firebase Auth
- User profile created in Firestore with `isActive: false`
- User is signed out
- Success message shown: "Account created successfully! Your account is pending admin approval."
- User must wait for admin to activate account

---

### Step 3: Admin Activates User
**Trigger:** Admin opens user detail modal and clicks "Activate" button

**Process:**
1. Update `users/{userId}` document:
   ```javascript
   {
     ...existing fields...,
     isActive: true // Changed from false
   }
   ```

2. **Cloud Function Triggered:**
   - `onUserActivated` → Sends activation email

**Expected Behavior:**
- User's `isActive` status changes to `true`
- Activation email sent
- User can now log in

---

## Workflow 3: User Login

### Step 1: User Logs In
**Trigger:** User enters credentials and clicks "Sign In"

**Process:**
1. **Set active login flag:** `isUserActivelyLoggingIn = true`
2. **Set persistence:** Based on "Remember Me" checkbox
   - Checked: `LOCAL` persistence
   - Not checked: `SESSION` persistence (clears when the browser session ends)
3. **Sign in:** `auth.signInWithEmailAndPassword(email, password)`
4. **Update last login:** Update `users/{userId}.lastLogin` (non-blocking)

**Session Management:**
- "Remember Me" maps directly to Firebase Auth persistence

**Expected Behavior:**
- User authenticates successfully
- Auth state change fires
- `loadUserProfile(userId)` is called
- If user is active → Application is shown
- If user is inactive → Permission denied modal shown, user signed out

---

### Step 2: Auth State Change Handler
**Trigger:** `onAuthStateChanged` fires after login

**Process:**
1. **Load user profile:** `loadUserProfile(userId)`
2. **Check if active:** If `currentUserProfile.isActive === true` → Show application
3. **If inactive:** Show permission denied modal, sign out

**Expected Behavior:**
- Active users → Application shown
- Inactive users → Permission denied modal, signed out

---

## Workflow 4: Page Load (Existing Session)

### Scenario A: User Has "Remember Me" Checked
**Trigger:** User visits site with existing Firebase Auth session

**Process:**
1. Firebase Auth automatically restores session
2. `onAuthStateChanged` fires
3. Load user profile
4. If active → Show application

**Expected Behavior:**
- User is automatically logged in
- Application is shown (if user is active)

---

### Scenario B: User Does NOT Have "Remember Me" Checked
**Trigger:** User visits site after SESSION persistence ended (e.g., browser closed)

**Process:**
1. Firebase Auth session may or may not exist (depends on SESSION persistence)
2. If session exists:
   - `onAuthStateChanged` fires
   - Load user profile
   - If active → Show application
3. If no session:
   - `onAuthStateChanged` fires with `user === null`
   - Show landing page

**Expected Behavior:**
- User is signed out (if session existed)
- Landing page is shown
- User must log in again

---

## Data Structure Summary

### Collections

1. **`users/{userId}`**
   - **Purpose:** User profiles in Firestore
   - **Created by:** User signup or admin invitation
   - **Key fields:**
     - `email` (normalized)
     - `displayName`
     - `role` (viewer, maintenance, property_manager, admin, super_admin)
     - `isActive` (true/false)
     - `assignedProperties` (array of property IDs)
     - `profile` (object with phone, title, department)
     - `createdAt`, `lastLogin`, `createdBy`

2. **`userInvitations/{invitationId}`**
   - **Purpose:** Invitation records (for email sending)
   - **Created by:** Admin invitation
   - **Key fields:**
     - `email` (normalized)
     - `displayName`
     - `role`
     - `assignedProperties`
     - `status: "pending"` → changes to `"accepted"` after signup
     - `sendEmail: true/false`

### Firebase Authentication
- **Purpose:** User authentication
- **Created by:** User signup (self-registration or invited)
- **Key properties:**
  - `uid` (used as document ID in `users` collection)
  - `email`
  - `emailVerified`
  - `displayName`

---

## Critical Rules

1. **Invited Users:**
   - `users.isActive` MUST be `true` after signup
   - Persistence SHOULD be `LOCAL` after signup

2. **Self-Registered Users:**
   - `users.isActive` MUST be `false` after signup
   - User MUST be signed out after signup

3. **"Remember Me" Behavior:**
   - Checked → `LOCAL` persistence
   - Not checked → `SESSION` persistence
   - No forced sign-out on page load

4. **Auto-Created Profiles (Allowed):**
   - If a Firebase Auth user exists but no `users/{userId}` document is found, the app may create a default profile
   - Default profile MUST be `role: 'viewer'`, `isActive: false`
   - User MUST be signed out and shown a pending-approval message until an admin activates the account

4. **Email Normalization:**
   - All emails MUST be normalized: `email.toLowerCase().trim()`
   - Used consistently across all collections and checks

5. **Permission Errors:**
   - If profile creation fails → Sign out user
   - Show user-friendly error message
   - Do NOT create fallback profile

---

## Common Issues and Solutions

### Issue: Permission denied when creating profile
**Cause:** Firestore rules blocking profile creation
**Solution:** Ensure rules allow users to create their own profile with matching email

### Issue: User profile not found after signup
**Cause:** Profile creation failed silently
**Solution:** Check Firestore rules and ensure proper error handling

### Issue: Invited user shows as inactive
**Cause:** `isActive` not set to `true` in profile
**Solution:** Ensure `pendingUser.isActive` is `true` and is copied to user profile

---

## Testing Checklist

- [ ] Admin can invite user
- [ ] Invitation email is sent with correct link
- [ ] Invited user can sign up
- [ ] Invited user is logged in immediately after signup
- [ ] Invited user profile has `isActive: true`
- [ ] Self-registered user is signed out after signup
- [ ] Self-registered user profile has `isActive: false`
- [ ] Admin can activate self-registered user
- [ ] User with "Remember Me" stays logged in after browser restart
- [ ] User without "Remember Me" is logged out after browser close
- [ ] Hash routing works for `#signup` and `#login`
- [ ] Landing page shows on initial load (no hash)
