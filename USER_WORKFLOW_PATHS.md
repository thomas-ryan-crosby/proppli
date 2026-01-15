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

2. **`pendingUsers/{pendingUserId}`** document:
   ```javascript
   {
     email: "user@example.com" (normalized: lowercase, trimmed),
     displayName: "John Doe",
     role: "property_manager" | "admin" | "maintenance" | "viewer",
     isActive: true, // CRITICAL: Invited users are ACTIVE immediately
     assignedProperties: ["propertyId1", "propertyId2"],
     profile: {
       phone: "123-456-7890" | null,
       title: "Property Manager" | null,
       department: "Operations" | null
     },
     createdAt: serverTimestamp(),
     createdBy: "adminUserId",
     invitationId: "invitationId",
     status: "pending_signup" // Will change to "completed" after signup
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
1. **Set active login flag:** `isUserActivelyLoggingIn = true` (prevents "Remember Me" check from signing out)
2. **Create Firebase Auth account:** `auth.createUserWithEmailAndPassword(email, password)`
3. **Update display name:** `user.updateProfile({ displayName })`
4. **Send email verification:** `user.sendEmailVerification()`
5. **Check for pending invitation:** `checkPendingInvitation(email)`
6. **Link to pending invitation:** `linkPendingUserToAccount(userId, email)`

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

3. **`pendingUsers/{pendingUserId}`** document (updated):
   ```javascript
   {
     ...existing fields...,
     status: "completed", // Changed from "pending_signup"
     linkedUserId: "userId",
     linkedAt: serverTimestamp()
   }
   ```

**Session Management:**
- Set `sessionStorage.setItem('rememberMe', 'true')`
- Set `localStorage.setItem('rememberMe', 'true')`
- Set persistence: `auth.setPersistence(LOCAL)`
- Wait 500ms for profile to save
- Reload page

**Expected Behavior:**
- User account created in Firebase Auth
- User profile created in Firestore with `isActive: true`
- User is logged in immediately
- Page reloads and shows application (user is active)
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
2. **Create Firebase Auth account:** `auth.createUserWithEmailAndPassword(email, password)`
3. **Update display name:** `user.updateProfile({ displayName })`
4. **Send email verification:** `user.sendEmailVerification()`
5. **Check for pending invitation:** `checkPendingInvitation(email)` → Returns `null`
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
   - `onUserSignup` → Sends welcome email (if `isActive: false`)

**Session Management:**
- User is signed out: `auth.signOut()`
- "Remember Me" flags are NOT set

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
1. **Set active login flag:** `isUserActivelyLoggingIn = true` (if "Remember Me" checked)
2. **Set persistence:** Based on "Remember Me" checkbox
   - Checked: `LOCAL` persistence
   - Not checked: `SESSION` persistence
3. **Sign in:** `auth.signInWithEmailAndPassword(email, password)`
4. **Update last login:** Update `users/{userId}.lastLogin` (non-blocking)

**Session Management:**
- If "Remember Me" checked:
  - `sessionStorage.setItem('rememberMe', 'true')`
  - `localStorage.setItem('rememberMe', 'true')`
- If "Remember Me" NOT checked:
  - `sessionStorage.removeItem('rememberMe')`
  - `localStorage.removeItem('rememberMe')`

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
1. **Check if active login:** If `isUserActivelyLoggingIn === true`, skip "Remember Me" check
2. **Check "Remember Me" on page load:** If `isInitialLoad === true` and `isUserActivelyLoggingIn === false`:
   - Check `sessionStorage.getItem('rememberMe')` or `localStorage.getItem('rememberMe')`
   - If not set → Sign user out (they didn't check "Remember Me")
3. **Load user profile:** `loadUserProfile(userId)`
4. **Check if active:** If `currentUserProfile.isActive === true` → Show application
5. **If inactive:** Show permission denied modal, sign out

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
3. `isInitialLoad === true`, `isUserActivelyLoggingIn === false`
4. Check "Remember Me" flag → Found in storage
5. Skip sign-out
6. Load user profile
7. If active → Show application

**Expected Behavior:**
- User is automatically logged in
- Application is shown (if user is active)

---

### Scenario B: User Does NOT Have "Remember Me" Checked
**Trigger:** User visits site, but session expired or "Remember Me" was not checked

**Process:**
1. Firebase Auth session may or may not exist (depends on SESSION persistence)
2. If session exists:
   - `onAuthStateChanged` fires
   - `isInitialLoad === true`, `isUserActivelyLoggingIn === false`
   - Check "Remember Me" flag → NOT found in storage
   - Sign user out
   - Show landing page
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

2. **`pendingUsers/{pendingUserId}`**
   - **Purpose:** Admin-invited users before they sign up
   - **Created by:** Admin invitation
   - **Key fields:**
     - `email` (normalized)
     - `displayName`
     - `role`
     - `isActive: true` (always true for invited users)
     - `assignedProperties`
     - `status: "pending_signup"` → changes to `"completed"` after signup
     - `linkedUserId`, `linkedAt` (set after signup)

3. **`userInvitations/{invitationId}`**
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
   - `pendingUsers.isActive` MUST be `true`
   - `users.isActive` MUST be `true` after signup
   - "Remember Me" flag MUST be set after signup
   - Persistence MUST be set to `LOCAL` after signup

2. **Self-Registered Users:**
   - `users.isActive` MUST be `false` after signup
   - User MUST be signed out after signup
   - "Remember Me" flag MUST NOT be set

3. **"Remember Me" Check:**
   - Only runs on initial page load (`isInitialLoad === true`)
   - Skips if user is actively logging in (`isUserActivelyLoggingIn === true`)
   - Signs out if flag is not found in storage

4. **Email Normalization:**
   - All emails MUST be normalized: `email.toLowerCase().trim()`
   - Used consistently across all collections and checks

5. **Permission Errors:**
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
- [ ] User with "Remember Me" stays logged in on page reload
- [ ] User without "Remember Me" is signed out on page reload
- [ ] Hash routing works for `#signup` and `#login`
- [ ] Landing page shows on initial load (no hash)
