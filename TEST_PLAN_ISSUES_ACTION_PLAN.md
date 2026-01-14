# Test Plan Issues - Action Plan

**Date:** January 2025  
**Status:** Planning Phase

---

## Summary

This document outlines the action plan to address all issues identified during test plan execution. Issues are organized by priority and category.

---

## Critical Priority Issues

### 1. Prevent Duplicate User Invitations (Test Case 2.10)
**Issue:** Admin/Super Admin can invite a user that already exists in the system without notification.

**Impact:** High - Data integrity issue, user confusion

**Solution:**
- Add validation in `handleInviteUser` to check if email already exists in:
  - Firebase Auth users
  - Firestore `users` collection
  - Firestore `pendingUsers` collection
- Display clear error message: "A user with this email already exists in the system."
- Prevent invitation creation if user exists

**Files to Modify:**
- `app.js` - `handleInviteUser` function

**Estimated Effort:** 1-2 hours

---

### 2. Fix "Remember Me" Functionality (Test Case 1.2)
**Issue:** System auto-logs in even when "Remember Me" is not checked.

**Impact:** High - Security/UX issue

**Solution:**
- Review Firebase Auth persistence settings
- Ensure `auth.setPersistence()` is called based on "Remember Me" checkbox state
- Use `firebase.auth.Auth.Persistence.SESSION` when unchecked
- Use `firebase.auth.Auth.Persistence.LOCAL` when checked

**Files to Modify:**
- `app.js` - `handleLogin` function

**Estimated Effort:** 1 hour

---

### 3. Improve Password Error Messaging (Test Case 1.3)
**Issue:** Wrong password shows "No Account Found" instead of "Password incorrect".

**Impact:** High - User confusion

**Solution:**
- Improve error handling in `handleLogin` to distinguish between:
  - Wrong password: "Invalid password. Please try again."
  - User not found: "No account found with this email address."
- Use Firebase Auth error codes: `auth/wrong-password` vs `auth/user-not-found`

**Files to Modify:**
- `app.js` - `handleLogin` function

**Estimated Effort:** 30 minutes

---

## High Priority Issues

### 4. Fix Account Access Required Modal (Test Case 1.4)
**Issue:** Modal shows "Sign Out" button, implying user was able to sign in.

**Impact:** Medium-High - UX confusion

**Solution:**
- Remove "Sign Out" button from permission denied modal
- Update modal message to clarify user hasn't signed in yet
- Ensure user is automatically signed out when modal appears

**Files to Modify:**
- `app.js` - `showPermissionDeniedModal` function
- `index.html` - Permission denied modal HTML

**Estimated Effort:** 30 minutes

---

### 5. Send Welcome Email on Signup (Test Case 1.4)
**Issue:** No email sent when user signs up for self-registration.

**Impact:** Medium - User experience

**Solution:**
- Create new Cloud Function: `onUserSignup` (Firestore trigger)
- Trigger when new user profile is created with `isActive: false`
- Send welcome email with:
  - Thank you message
  - Information about admin approval process
  - Contact information if needed
- Use Proppli-branded email template

**Files to Modify:**
- `functions/index.js` - Add new trigger function
- `functions/index.js` - Add email template function

**Estimated Effort:** 2-3 hours

---

### 6. Password Reset - Confirm Password & Show Password (Test Case 1.6)
**Issue:** Password reset doesn't require password confirmation, no show/hide password toggle.

**Impact:** Medium - Security and UX

**Solution:**
- Add "Confirm New Password" field to password reset form
- Add password validation to ensure passwords match
- Add "Show/Hide Password" toggle button to all password fields:
  - Signup form (password, confirm password)
  - Login form (password)
  - Password reset form (new password, confirm password)
- Use eye icon to toggle visibility

**Files to Modify:**
- `index.html` - Add confirm password field and show/hide toggles
- `app.js` - Update `handlePasswordReset` function
- `styles.css` - Style password toggle buttons

**Estimated Effort:** 2 hours

---

### 7. Improve Activation Email Branding (Test Case 2.6)
**Issue:** Activation email lacks proper Proppli branding.

**Impact:** Medium - Brand consistency

**Solution:**
- Review and update activation email template in `functions/index.js`
- Ensure consistent branding with invitation email
- Include Proppli logo, colors, and professional formatting
- Match style with other system emails

**Files to Modify:**
- `functions/index.js` - `sendActivationEmailInternal` function

**Estimated Effort:** 1 hour

---

### 8. Auto-Link User Assignments in Tickets (Test Case 4.2)
**Issue:** Ticket creation requires manual entry of user assignments instead of auto-linking.

**Impact:** Medium - Efficiency and data integrity

**Solution:**
- Auto-populate "Requested By" with current logged-in user
- Change "Requested By" to dropdown of system users (not free text)
- Auto-populate "Assigned To" based on property assignment (if applicable)
- Change "Assigned To" to dropdown of system users
- Auto-populate "Completed By" with current logged-in user when completing ticket
- Ensure all user fields only allow selection from existing users

**Files to Modify:**
- `app.js` - `handleCreateTicket` function
- `app.js` - `handleCompleteTicket` function
- `index.html` - Update ticket form fields to dropdowns
- `app.js` - Load users list for dropdown population

**Estimated Effort:** 3-4 hours

---

## Medium Priority Issues

### 9. Fix Spelling Error - "Properly" (Test Case 1.1)
**Issue:** "Properly" is misspelled (likely should be "Proppli").

**Impact:** Low - Brand consistency

**Solution:**
- Search codebase for "Properly" (case-insensitive)
- Replace with "Proppli" where appropriate
- Check landing page, emails, and all user-facing text

**Files to Modify:**
- `index.html` - Landing page
- `functions/index.js` - Email templates
- Any other files with the misspelling

**Estimated Effort:** 30 minutes

---

### 10. Add Google Sign-In Option (Test Case 1.2)
**Issue:** Google authentication is enabled in Firebase but not available in UI.

**Impact:** Medium - Feature completeness

**Solution:**
- Add "Sign in with Google" button to login page
- Implement Google sign-in handler using Firebase Auth
- Handle account linking for existing users
- Ensure user profile is created/updated appropriately
- Update UI to show Google sign-in option

**Files to Modify:**
- `index.html` - Add Google sign-in button
- `app.js` - Add `handleGoogleSignIn` function
- `styles.css` - Style Google sign-in button

**Estimated Effort:** 2-3 hours

---

### 11. Add User Role Permissions Help (Test Case 2.1)
**Issue:** Users page needs help/documentation explaining what each role can do.

**Impact:** Low-Medium - User education

**Solution:**
- Add "Role Permissions" info button/icon on Users page
- Create modal or expandable section explaining:
  - Super Admin: Full system access
  - Admin: User management, all properties
  - Property Manager: Assigned properties only
  - Maintenance: Ticket access only
  - Viewer: Read-only access to assigned properties
- Include visual hierarchy or table showing permissions

**Files to Modify:**
- `index.html` - Add help button and modal
- `app.js` - Add function to show role permissions modal
- `styles.css` - Style help modal

**Estimated Effort:** 2 hours

---

### 12. Close Modal After Saving User Changes (Test Case 2.5)
**Issue:** User detail modal doesn't close after saving changes.

**Impact:** Low - UX improvement

**Solution:**
- After successful save in edit mode, close the user detail modal
- Show success message (toast or inline)
- Refresh user list if needed

**Files to Modify:**
- `app.js` - User edit save handler

**Estimated Effort:** 30 minutes

---

### 13. Improve Properties Tab Design (Test Case 2.5)
**Issue:** Properties tab in user detail modal needs better design.

**Impact:** Low - UX improvement

**Solution:**
- Review current Properties tab layout
- Improve visual design:
  - Better spacing
  - Clearer checkboxes
  - Property cards or list view
  - Search/filter for many properties
- Ensure responsive design

**Files to Modify:**
- `index.html` - Properties tab HTML
- `styles.css` - Properties tab styling
- `app.js` - Properties tab rendering logic

**Estimated Effort:** 2 hours

---

## Implementation Priority Order

### Phase 1: Critical Issues (Immediate)
1. ✅ Prevent Duplicate User Invitations (#1)
2. ✅ Fix "Remember Me" Functionality (#2)
3. ✅ Improve Password Error Messaging (#3)

### Phase 2: High Priority Issues (This Week)
4. ✅ Fix Account Access Required Modal (#4)
5. ✅ Send Welcome Email on Signup (#5)
6. ✅ Password Reset - Confirm Password & Show Password (#6)
7. ✅ Improve Activation Email Branding (#7)
8. ✅ Auto-Link User Assignments in Tickets (#8)

### Phase 3: Medium Priority Issues (Next Week)
9. ✅ Fix Spelling Error (#9)
10. ✅ Add Google Sign-In Option (#10)
11. ✅ Add User Role Permissions Help (#11)
12. ✅ Close Modal After Saving User Changes (#12)
13. ✅ Improve Properties Tab Design (#13)

---

## Estimated Total Effort

- **Critical Issues:** 2.5-3.5 hours
- **High Priority Issues:** 10-13 hours
- **Medium Priority Issues:** 7-9.5 hours
- **Total:** ~20-26 hours

---

## Notes

- All changes should be tested after implementation
- Update test plan with results after fixes
- Consider creating separate feature branches for larger changes
- Ensure all changes are committed and pushed to GitHub after completion

---

*Action Plan Version: 1.0*  
*Last Updated: January 2025*
