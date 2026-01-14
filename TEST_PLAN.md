# Proppli System Test Plan

**Date:** January 2025  
**Version:** 1.0  
**Status:** Ready for Execution

---

## Test Plan Overview

This comprehensive test plan covers all implemented features in the Proppli property management platform. Each test case includes steps, expected results, and pass/fail criteria.

---

## Test Environment Setup

### Prerequisites
- [ ] Access to production/staging environment
- [ ] Test user accounts with different roles:
  - Super Admin
  - Admin
  - Property Manager
  - Maintenance Staff
  - Viewer
- [ ] Test email addresses for invitation testing
- [ ] Browser console open (F12) for error checking

### Test Data Requirements
- [ ] At least 2-3 test properties
- [ ] Test tenants (if tenant features are being tested)
- [ ] Test leases (if lease features are being tested)

---

## 1. Authentication & Access Control

### Test Case 1.1: Landing Page
**Priority:** Critical  
**Role:** Unauthenticated User

**Steps:**
1. Navigate to application URL
2. Verify landing page displays
3. Verify "Launch Application" button is visible
4. Click "Launch Application" button

**Expected Results:**
- ✅ Landing page displays with Proppli branding
- ✅ "Launch Application" button is visible and clickable
- ✅ Clicking button shows login page (if not authenticated)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.2: User Login
**Priority:** Critical  
**Role:** Any User

**Steps:**
1. Navigate to login page (via landing page or direct `#login` hash)
2. Enter valid email and password
3. Click "Sign In" button
4. Verify user is logged in

**Expected Results:**
- ✅ Login form displays correctly
- ✅ Can enter email and password
- ✅ "Remember Me" checkbox works
- ✅ Login succeeds with valid credentials
- ✅ User is redirected to application
- ✅ User menu shows user's name
- ✅ No console errors

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.3: User Login - Invalid Credentials
**Priority:** High  
**Role:** Any User

**Steps:**
1. Navigate to login page
2. Enter invalid email or password
3. Click "Sign In" button

**Expected Results:**
- ✅ Error message displays: "Invalid email or password"
- ✅ User is not logged in
- ✅ Error message is user-friendly
- ✅ Form remains on login page

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.4: User Signup - Self Registration
**Priority:** High  
**Role:** New User

**Steps:**
1. Navigate to signup page (via link or `#signup` hash)
2. Fill in all required fields:
   - Email (new, not in system)
   - Password (meets requirements)
   - Confirm password (matches)
   - Full Name
   - Phone (optional)
3. Click "Create Account" button

**Expected Results:**
- ✅ Signup form displays correctly
- ✅ Password requirements are visible
- ✅ Form validates required fields
- ✅ Account is created successfully
- ✅ Success message displays
- ✅ User is signed out (pending admin approval)
- ✅ User profile created in Firestore with `role: 'viewer'`, `isActive: false`
- ✅ Email verification sent (if enabled)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.5: User Signup - Password Validation
**Priority:** High  
**Role:** New User

**Steps:**
1. Navigate to signup page
2. Enter password that doesn't meet requirements:
   - Too short (< 8 characters)
   - Missing uppercase
   - Missing lowercase
   - Missing number
   - Missing special character
3. Attempt to submit form

**Expected Results:**
- ✅ Form prevents submission
- ✅ Error message displays: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
- ✅ User can correct password and resubmit

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.6: Password Reset
**Priority:** High  
**Role:** Any User

**Steps:**
1. Navigate to login page
2. Click "Forgot Password?" link
3. Enter registered email address
4. Click "Send Reset Link" button
5. Check email inbox

**Expected Results:**
- ✅ Password reset page displays
- ✅ Can enter email address
- ✅ Success message displays after submission
- ✅ Email is received with password reset link
- ✅ Reset link works and allows password change
- ✅ Can log in with new password

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.7: Inactive User Access
**Priority:** Critical  
**Role:** Inactive User

**Steps:**
1. Log in with user account that has `isActive: false`
2. Verify access is denied

**Expected Results:**
- ✅ Permission denied modal displays
- ✅ User is automatically signed out
- ✅ Clear message: "Your account is pending admin approval"
- ✅ User cannot access application

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.8: User Logout
**Priority:** High  
**Role:** Authenticated User

**Steps:**
1. Log in to application
2. Click user menu (top right)
3. Click "Sign Out"

**Expected Results:**
- ✅ User menu displays correctly
- ✅ "Sign Out" option is visible
- ✅ Clicking "Sign Out" logs user out
- ✅ User is redirected to landing page or login page
- ✅ Session is cleared
- ✅ Cannot access application without logging in again

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 1.9: Direct Signup Link (Hash Routing)
**Priority:** Medium  
**Role:** Invited User

**Steps:**
1. Receive invitation email with signup link
2. Click signup link (should contain `#signup`)
3. Verify signup modal/page opens directly

**Expected Results:**
- ✅ Signup link contains `#signup` hash
- ✅ Clicking link opens signup page/modal directly
- ✅ No need to navigate through website
- ✅ User can sign up immediately

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 2. User Management

### Test Case 2.1: View Users List
**Priority:** Critical  
**Role:** Admin or Super Admin

**Steps:**
1. Log in as admin
2. Navigate to "Users" page
3. Verify users list displays

**Expected Results:**
- ✅ Users page is accessible
- ✅ All users are displayed
- ✅ Pending invitations are displayed with "Pending Signup" status
- ✅ User cards show: name, email, role, status, last login
- ✅ Search/filter functionality works
- ✅ No console errors

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.2: Invite User
**Priority:** Critical  
**Role:** Admin or Super Admin

**Steps:**
1. Navigate to Users page
2. Click "Invite User" button
3. Fill in invitation form:
   - Email (new, not in system)
   - Full Name
   - Role (select from dropdown)
   - Properties (select at least one for non-admin roles)
   - Phone, Title, Department (optional)
   - Check "Send invitation email"
4. Click "Create User & Send Invitation"

**Expected Results:**
- ✅ Invite User modal opens
- ✅ Form displays correctly
- ✅ Role dropdown has all options
- ✅ Properties checkboxes load correctly
- ✅ Form validates required fields
- ✅ Invitation is created successfully
- ✅ `userInvitations` document created in Firestore
- ✅ `pendingUsers` document created in Firestore
- ✅ Invitation email is sent (check email inbox)
- ✅ Success message displays
- ✅ Pending user appears in Users list
- ✅ No duplicate users created

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.3: Invited User Signup
**Priority:** Critical  
**Role:** Invited User

**Steps:**
1. Receive invitation email
2. Click signup link in email
3. Sign up with the invited email address
4. Verify account is linked to invitation

**Expected Results:**
- ✅ Signup link opens signup page directly
- ✅ Can sign up with invited email
- ✅ Account is created successfully
- ✅ User profile is created with admin-assigned role and properties
- ✅ User is active (if invitation had `isActive: true`)
- ✅ User can log in immediately (if active)
- ✅ No duplicate user profiles created
- ✅ Pending user status updated to "completed"
- ✅ Invitation status updated to "accepted"

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.4: View User Details
**Priority:** High  
**Role:** Admin or Super Admin

**Steps:**
1. Navigate to Users page
2. Click "View" button on any user
3. Verify user detail modal displays

**Expected Results:**
- ✅ User detail modal opens
- ✅ All user information displays correctly:
  - Name, email, role, status
  - Phone, title, department
  - Assigned properties
  - Created date, last login
- ✅ Tabs work (Details, Properties, History)
- ✅ Can edit user information
- ✅ Can assign/unassign properties

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.5: Edit User
**Priority:** High  
**Role:** Admin or Super Admin

**Steps:**
1. Open user detail modal
2. Click "Edit" button
3. Modify user information:
   - Display Name
   - Phone
   - Title
   - Department
   - Role
   - Status (Active/Inactive)
4. Click "Save" button

**Expected Results:**
- ✅ Edit mode activates
- ✅ Can modify all editable fields
- ✅ Role dropdown works correctly
- ✅ Status toggle works
- ✅ Changes are saved successfully
- ✅ User list updates immediately
- ✅ Changes persist after page refresh

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.6: Activate User
**Priority:** High  
**Role:** Admin or Super Admin

**Steps:**
1. Navigate to Users page
2. Find user with "INACTIVE" status
3. Click "Activate" button
4. Confirm activation

**Expected Results:**
- ✅ Activation button is visible for inactive users
- ✅ Confirmation dialog appears (if implemented)
- ✅ User status changes to "ACTIVE"
- ✅ Activation email is sent (check email)
- ✅ User can now log in
- ✅ User list updates immediately

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.7: Deactivate User
**Priority:** High  
**Role:** Admin or Super Admin

**Steps:**
1. Navigate to Users page
2. Find active user
3. Click "Deactivate" button (or toggle in edit mode)
4. Confirm deactivation

**Expected Results:**
- ✅ Deactivation option is available
- ✅ Confirmation dialog appears (if implemented)
- ✅ User status changes to "INACTIVE"
- ✅ User is signed out if currently logged in
- ✅ User cannot log in after deactivation
- ✅ User list updates immediately

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.8: Assign Properties to User
**Priority:** High  
**Role:** Admin or Super Admin

**Steps:**
1. Open user detail modal
2. Navigate to "Properties" tab
3. Check/uncheck property checkboxes
4. Click "Save Properties" button

**Expected Results:**
- ✅ Properties tab displays
- ✅ All properties are listed with checkboxes
- ✅ Currently assigned properties are checked
- ✅ Can check/uncheck properties
- ✅ Changes are saved successfully
- ✅ User's `assignedProperties` array updates in Firestore
- ✅ User list updates to show new property count

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.9: User Search and Filtering
**Priority:** Medium  
**Role:** Admin or Super Admin

**Steps:**
1. Navigate to Users page
2. Use search box to search by name or email
3. Use role filter dropdown
4. Use status filter dropdown

**Expected Results:**
- ✅ Search box filters users in real-time
- ✅ Role filter shows only users with selected role
- ✅ Status filter shows only users with selected status
- ✅ Filters can be combined
- ✅ Results update immediately
- ✅ Clear/reset filters works

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2.10: Prevent Duplicate Users
**Priority:** Critical  
**Role:** Admin + New User

**Steps:**
1. Admin invites user with email "test@example.com"
2. User signs up with "test@example.com"
3. User signs up again with "test@example.com" (or "Test@Example.com")
4. Verify no duplicate profiles created

**Expected Results:**
- ✅ First signup creates profile successfully
- ✅ Second signup attempt shows error or prevents duplicate
- ✅ Only ONE user profile exists in Firestore
- ✅ Email normalization works (case-insensitive matching)
- ✅ No duplicate entries in Users list

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 3. Property Management

### Test Case 3.1: View Properties List
**Priority:** Critical  
**Role:** Authenticated User

**Steps:**
1. Log in to application
2. Navigate to "Properties" page
3. Verify properties list displays

**Expected Results:**
- ✅ Properties page is accessible
- ✅ All accessible properties are displayed
- ✅ Property cards show: name, address, type, status
- ✅ Can click on property to view details
- ✅ Property selector works (if on maintenance page)
- ✅ No console errors

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 3.2: Create Property
**Priority:** Critical  
**Role:** Admin or Property Manager

**Steps:**
1. Navigate to Properties page
2. Click "Add Property" button
3. Fill in property form:
   - Property Name (required)
   - Address (required)
   - Property Type (required)
   - Description
   - Other optional fields
4. Click "Save Property" button

**Expected Results:**
- ✅ Add Property modal opens
- ✅ Form displays correctly
- ✅ Property type dropdown works
- ✅ Form validates required fields
- ✅ Property is created successfully
- ✅ Property appears in properties list immediately
- ✅ Property document created in Firestore
- ✅ Can select property in property selector

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 3.3: Edit Property
**Priority:** High  
**Role:** Admin or Property Manager

**Steps:**
1. Navigate to Properties page
2. Click on a property card
3. Click "Edit" button
4. Modify property information
5. Click "Save" button

**Expected Results:**
- ✅ Property detail view opens
- ✅ Edit mode activates
- ✅ Can modify all editable fields
- ✅ Changes are saved successfully
- ✅ Property list updates immediately
- ✅ Changes persist after page refresh

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 3.4: Delete Property
**Priority:** Medium  
**Role:** Admin or Super Admin

**Steps:**
1. Navigate to Properties page
2. Click on a property
3. Click "Delete" button
4. Confirm deletion

**Expected Results:**
- ✅ Delete button is visible (for admins)
- ✅ Confirmation dialog appears
- ✅ Property is deleted successfully
- ✅ Property removed from list
- ✅ Related data handled appropriately (tickets, tenants, etc.)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 3.5: Property Access Control
**Priority:** Critical  
**Role:** Property Manager (with limited property access)

**Steps:**
1. Log in as Property Manager with assigned properties
2. Navigate to Properties page
3. Verify only assigned properties are visible
4. Try to access unassigned property (if possible)

**Expected Results:**
- ✅ Only assigned properties are displayed
- ✅ Cannot see unassigned properties
- ✅ Cannot access unassigned property data
- ✅ Property selector only shows assigned properties
- ✅ Security rules prevent unauthorized access

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 4. Maintenance/Tickets

### Test Case 4.1: View Maintenance Tickets
**Priority:** Critical  
**Role:** Authenticated User

**Steps:**
1. Navigate to "Maintenance" page
2. Select a property from dropdown
3. Verify tickets list displays

**Expected Results:**
- ✅ Maintenance page is accessible
- ✅ Property selector displays
- ✅ Can select property from dropdown
- ✅ Tickets for selected property display
- ✅ Ticket cards show: description, status, priority, dates
- ✅ View toggle works (Active/Completed/Deleted)
- ✅ No console errors

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 4.2: Create Maintenance Ticket
**Priority:** Critical  
**Role:** Admin, Property Manager, or Maintenance

**Steps:**
1. Navigate to Maintenance page
2. Select a property
3. Click "Create Ticket" button
4. Fill in ticket form:
   - Property (pre-selected)
   - Description (required)
   - Priority
   - Requested By
   - Building #, Floor #, Tenant Name (if commercial)
   - Before photo (optional)
5. Click "Create Ticket" button

**Expected Results:**
- ✅ Create Ticket modal opens
- ✅ Form displays correctly
- ✅ Property is pre-selected
- ✅ Commercial fields show/hide based on property type
- ✅ Can upload before photo
- ✅ Form validates required fields
- ✅ Ticket is created successfully
- ✅ Ticket appears in tickets list immediately
- ✅ Ticket document created in Firestore
- ✅ Photo uploaded to Firebase Storage

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 4.3: Edit Maintenance Ticket
**Priority:** High  
**Role:** Admin, Property Manager, or Maintenance

**Steps:**
1. Navigate to Maintenance page
2. Click on a ticket card
3. Click "Edit" button
4. Modify ticket information
5. Click "Save" button

**Expected Results:**
- ✅ Ticket detail view opens
- ✅ Edit mode activates
- ✅ Can modify ticket fields
- ✅ Can update status
- ✅ Changes are saved successfully
- ✅ Ticket list updates immediately
- ✅ Changes persist after page refresh

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 4.4: Complete Maintenance Ticket
**Priority:** High  
**Role:** Admin, Property Manager, or Maintenance

**Steps:**
1. Navigate to Maintenance page
2. Click on an active ticket
3. Click "Complete" button
4. Fill in completion form:
   - Completion Date
   - Completed By
   - How Resolved
   - After Photo (optional)
   - Billing information
5. Click "Mark Complete" button

**Expected Results:**
- ✅ Complete Ticket modal opens
- ✅ Form displays correctly
- ✅ Can enter completion details
- ✅ Can upload after photo
- ✅ Ticket status changes to "Completed"
- ✅ Ticket moves to "Completed" view
- ✅ Completion data saved in Firestore
- ✅ Photo uploaded to Firebase Storage

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 4.5: Delete Maintenance Ticket
**Priority:** Medium  
**Role:** Admin or Super Admin

**Steps:**
1. Navigate to Maintenance page
2. Click on a ticket
3. Click "Delete" button
4. Confirm deletion

**Expected Results:**
- ✅ Delete button is visible (for admins)
- ✅ Confirmation dialog appears
- ✅ Ticket is deleted (soft delete)
- ✅ Ticket moves to "Deleted" view
- ✅ Ticket can be restored (if implemented)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 4.6: Ticket Filtering and Search
**Priority:** Medium  
**Role:** Authenticated User

**Steps:**
1. Navigate to Maintenance page
2. Use search box to search tickets
3. Filter by status (Active/Completed/Deleted)
4. Filter by priority
5. Filter by date range (if implemented)

**Expected Results:**
- ✅ Search box filters tickets in real-time
- ✅ Status filter works correctly
- ✅ Priority filter works correctly
- ✅ Filters can be combined
- ✅ Results update immediately

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 5. Tenant Management

### Test Case 5.1: View Tenants List
**Priority:** High  
**Role:** Admin, Property Manager, or Viewer

**Steps:**
1. Navigate to "Tenants" page
2. Verify tenants list displays

**Expected Results:**
- ✅ Tenants page is accessible
- ✅ All accessible tenants are displayed
- ✅ Tenant table/cards show: name, type, property, status
- ✅ Can filter by property (if implemented)
- ✅ Can click on tenant to view details
- ✅ No console errors

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 5.2: Create Tenant
**Priority:** High  
**Role:** Admin or Property Manager

**Steps:**
1. Navigate to Tenants page
2. Click "Add Tenant" button
3. Fill in tenant form:
   - Tenant Name (required)
   - Tenant Type (Commercial/Residential)
   - Property (required)
   - Contact information
   - Other fields
4. Click "Save Tenant" button

**Expected Results:**
- ✅ Add Tenant modal opens
- ✅ Form displays correctly
- ✅ Tenant type selection shows/hides relevant fields
- ✅ Property selector works
- ✅ Form validates required fields
- ✅ Tenant is created successfully
- ✅ Tenant appears in tenants list immediately
- ✅ Tenant document created in Firestore

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 5.3: View Tenant Details
**Priority:** High  
**Role:** Admin, Property Manager, or Viewer

**Steps:**
1. Navigate to Tenants page
2. Click on a tenant
3. Verify tenant detail modal displays

**Expected Results:**
- ✅ Tenant detail modal opens
- ✅ All tenant information displays:
  - Name, type, property
  - Contact information
  - Contacts list
  - Occupancies/Leases
  - History
- ✅ Tabs work correctly
- ✅ Can view related data

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 5.4: Add Contact to Tenant
**Priority:** Medium  
**Role:** Admin or Property Manager

**Steps:**
1. Open tenant detail modal
2. Navigate to "Contacts" tab
3. Click "Add Contact" button
4. Fill in contact form
5. Click "Save Contact" button

**Expected Results:**
- ✅ Add Contact modal opens
- ✅ Form displays correctly
- ✅ Contact is created successfully
- ✅ Contact appears in contacts list
- ✅ Contact is linked to tenant

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 6. Lease Management

### Test Case 6.1: View Leases List
**Priority:** High  
**Role:** Admin, Property Manager, or Viewer

**Steps:**
1. Navigate to "Leases" page
2. Verify leases list displays

**Expected Results:**
- ✅ Leases page is accessible
- ✅ All accessible leases are displayed
- ✅ Lease cards/table show: tenant, property, dates, rent
- ✅ Can filter by property or status
- ✅ Can click on lease to view details
- ✅ No console errors

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 6.2: Create Lease
**Priority:** High  
**Role:** Admin or Property Manager

**Steps:**
1. Navigate to Leases page
2. Click "Add Lease" button
3. Fill in lease form:
   - Tenant (required)
   - Property (required)
   - Start Date (required)
   - End Date (required)
   - Rent Amount (required)
   - Other lease terms
4. Click "Save Lease" button

**Expected Results:**
- ✅ Add Lease modal opens
- ✅ Form displays correctly
- ✅ Tenant and Property selectors work
- ✅ Date pickers work
- ✅ Form validates required fields
- ✅ Lease is created successfully
- ✅ Lease appears in leases list immediately
- ✅ Lease document created in Firestore

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 6.3: Edit Lease
**Priority:** High  
**Role:** Admin or Property Manager

**Steps:**
1. Navigate to Leases page
2. Click on a lease
3. Click "Edit" button
4. Modify lease information
5. Click "Save" button

**Expected Results:**
- ✅ Lease detail view opens
- ✅ Edit mode activates
- ✅ Can modify lease fields
- ✅ Changes are saved successfully
- ✅ Lease list updates immediately
- ✅ Changes persist after page refresh

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 7. Finance/Rent Roll

### Test Case 7.1: View Rent Roll
**Priority:** Medium  
**Role:** Admin or Property Manager

**Steps:**
1. Navigate to "Finance" or "Rent Roll" page
2. Select a property
3. Verify rent roll displays

**Expected Results:**
- ✅ Finance/Rent Roll page is accessible
- ✅ Can select property
- ✅ Rent roll table displays
- ✅ Shows tenants, units, rent amounts, status
- ✅ Can view by building (if multi-building property)
- ✅ No console errors

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 8. Building & Unit Management

### Test Case 8.1: View Buildings
**Priority:** Medium  
**Role:** Admin or Property Manager

**Steps:**
1. Navigate to Properties page
2. Click on a property
3. Navigate to "Buildings" tab or section
4. Verify buildings list displays

**Expected Results:**
- ✅ Buildings section is accessible
- ✅ All buildings for property are displayed
- ✅ Can view building details
- ✅ Can add/edit/delete buildings

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 8.2: Create Building
**Priority:** Medium  
**Role:** Admin or Property Manager

**Steps:**
1. Open property detail view
2. Navigate to Buildings section
3. Click "Add Building" button
4. Fill in building form
5. Click "Save Building" button

**Expected Results:**
- ✅ Add Building modal opens
- ✅ Form displays correctly
- ✅ Building is created successfully
- ✅ Building appears in buildings list
- ✅ Building is linked to property

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 8.3: View Units
**Priority:** Medium  
**Role:** Admin or Property Manager

**Steps:**
1. Open property detail view
2. Navigate to Units section
3. Verify units list displays

**Expected Results:**
- ✅ Units section is accessible
- ✅ All units for property are displayed
- ✅ Unit cards show: number, type, size, status
- ✅ Can view unit details
- ✅ Can add/edit/delete units

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 8.4: Create Unit
**Priority:** Medium  
**Role:** Admin or Property Manager

**Steps:**
1. Open property detail view
2. Navigate to Units section
3. Click "Add Unit" button
4. Fill in unit form
5. Click "Save Unit" button

**Expected Results:**
- ✅ Add Unit modal opens
- ✅ Form displays correctly
- ✅ Unit is created successfully
- ✅ Unit appears in units list
- ✅ Unit is linked to property/building

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 9. Email Integration

### Test Case 9.1: Invitation Email
**Priority:** High  
**Role:** Admin

**Steps:**
1. Invite a user with "Send invitation email" checked
2. Check email inbox for invitation
3. Verify email content and links

**Expected Results:**
- ✅ Email is received within reasonable time
- ✅ Email contains invitation details
- ✅ Signup link is present and clickable
- ✅ Signup link contains `#signup` hash
- ✅ Email is properly formatted (HTML)
- ✅ Email sender is correct (SendGrid configured)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 9.2: Activation Email
**Priority:** High  
**Role:** Admin

**Steps:**
1. Activate an inactive user
2. Check email inbox for activation email
3. Verify email content

**Expected Results:**
- ✅ Email is received when user is activated
- ✅ Email contains activation confirmation
- ✅ Login link is present and clickable
- ✅ Email is properly formatted
- ✅ Email sender is correct

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 9.3: Password Reset Email
**Priority:** High  
**Role:** Any User

**Steps:**
1. Request password reset
2. Check email inbox for reset email
3. Verify email content and reset link

**Expected Results:**
- ✅ Email is received within reasonable time
- ✅ Email contains password reset link
- ✅ Reset link works and allows password change
- ✅ Email is properly formatted
- ✅ Email sender is correct (Firebase Auth)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 10. Security & Permissions

### Test Case 10.1: Role-Based Access Control
**Priority:** Critical  
**Role:** Different Roles

**Steps:**
1. Test with each role:
   - Super Admin
   - Admin
   - Property Manager
   - Maintenance
   - Viewer
2. Verify access to features matches role permissions

**Expected Results:**
- ✅ Super Admin: Full access to everything
- ✅ Admin: Can manage users, full property access
- ✅ Property Manager: Access to assigned properties only
- ✅ Maintenance: Access to tickets only
- ✅ Viewer: Read-only access to assigned properties
- ✅ Unauthorized actions are blocked
- ✅ Permission errors are handled gracefully

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 10.2: Property-Level Access Control
**Priority:** Critical  
**Role:** Property Manager

**Steps:**
1. Log in as Property Manager with limited property access
2. Try to access data from unassigned property
3. Verify access is denied

**Expected Results:**
- ✅ Cannot see unassigned properties in list
- ✅ Cannot access unassigned property data
- ✅ Cannot create tickets for unassigned properties
- ✅ Cannot view tenants from unassigned properties
- ✅ Security rules prevent unauthorized access
- ✅ No data leaks to unauthorized users

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 10.3: Firestore Security Rules
**Priority:** Critical  
**Role:** All Roles

**Steps:**
1. Attempt unauthorized operations via browser console
2. Verify security rules block unauthorized access

**Expected Results:**
- ✅ Users cannot create profiles with non-default roles
- ✅ Users cannot modify their own role or isActive status
- ✅ Users cannot access other users' data
- ✅ Users cannot access unassigned property data
- ✅ All write operations are validated by security rules
- ✅ Permission errors are returned (not silent failures)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 11. Data Integrity

### Test Case 11.1: Data Persistence
**Priority:** High  
**Role:** Any User

**Steps:**
1. Create/update data (property, ticket, tenant, etc.)
2. Refresh page
3. Verify data persists

**Expected Results:**
- ✅ All created data persists after page refresh
- ✅ All updated data persists after page refresh
- ✅ Data is correctly stored in Firestore
- ✅ No data loss occurs

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 11.2: Real-Time Updates
**Priority:** Medium  
**Role:** Multiple Users

**Steps:**
1. Open application in two browser windows
2. Create/update data in one window
3. Verify other window updates automatically

**Expected Results:**
- ✅ Changes appear in other window without refresh
- ✅ Real-time listeners work correctly
- ✅ No conflicts or race conditions
- ✅ UI updates smoothly

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 12. Error Handling

### Test Case 12.1: Network Errors
**Priority:** Medium  
**Role:** Any User

**Steps:**
1. Disconnect internet
2. Attempt to create/update data
3. Verify error handling

**Expected Results:**
- ✅ Error message displays clearly
- ✅ User is informed of network issue
- ✅ Application doesn't crash
- ✅ Can retry operation when connection restored

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 12.2: Permission Errors
**Priority:** High  
**Role:** Limited Access User

**Steps:**
1. Attempt unauthorized operations
2. Verify error messages are user-friendly

**Expected Results:**
- ✅ Permission errors display clear messages
- ✅ User understands why access was denied
- ✅ No technical error messages exposed
- ✅ Application doesn't crash

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 13. Performance

### Test Case 13.1: Page Load Performance
**Priority:** Medium  
**Role:** Any User

**Steps:**
1. Measure page load times
2. Test with large datasets (100+ properties, 1000+ tickets)
3. Verify performance is acceptable

**Expected Results:**
- ✅ Initial page load < 3 seconds
- ✅ Navigation between pages < 1 second
- ✅ Data loading is efficient
- ✅ No significant performance degradation with large datasets
- ✅ Pagination or virtualization works (if implemented)

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 14. Browser Compatibility

### Test Case 14.1: Cross-Browser Testing
**Priority:** Medium  
**Role:** Any User

**Steps:**
1. Test in Chrome
2. Test in Firefox
3. Test in Safari
4. Test in Edge
5. Verify all features work

**Expected Results:**
- ✅ Application works in all major browsers
- ✅ No browser-specific errors
- ✅ UI renders correctly in all browsers
- ✅ All features function properly

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## 15. Mobile Responsiveness

### Test Case 15.1: Mobile View
**Priority:** Medium  
**Role:** Any User

**Steps:**
1. Open application on mobile device or resize browser
2. Verify UI is responsive
3. Test key features on mobile

**Expected Results:**
- ✅ UI adapts to mobile screen size
- ✅ Navigation works on mobile
- ✅ Forms are usable on mobile
- ✅ Modals display correctly
- ✅ Touch interactions work

**Pass/Fail:** ☐ Pass ☐ Fail  
**Notes:**

---

## Test Execution Summary

### Test Results Tracking

**Total Test Cases:** 50+  
**Execution Date:** _______________  
**Tested By:** _______________  
**Environment:** _______________

**Results:**
- ✅ Passed: _____
- ❌ Failed: _____
- ⚠️ Blocked: _____
- ⏭️ Skipped: _____

### Critical Issues Found

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### High Priority Issues Found

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Medium Priority Issues Found

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Notes & Observations

_________________________________________________
_________________________________________________
_________________________________________________

---

## Sign-Off

**Test Execution Completed By:** _______________  
**Date:** _______________  
**Status:** ☐ Ready for Production ☐ Issues Found - See Above

---

*Test Plan Version: 1.0*  
*Last Updated: January 2025*
