# Test Plan: Maintenance Role Property Restrictions

**Date:** January 2025  
**Version:** 1.0  
**Status:** Ready for Execution

---

## Overview

This test plan verifies that maintenance personnel can only view and manage maintenance tickets for properties assigned to them. This is a critical security requirement to ensure proper access control.

---

## Test Environment Setup

### Prerequisites
- [ ] Access to production/staging environment
- [ ] At least 3 test properties created:
  - Property A
  - Property B  
  - Property C
- [ ] Test user accounts:
  - Maintenance User 1 (assigned to Property A only)
  - Maintenance User 2 (assigned to Property A and Property B)
  - Admin User (for setup and verification)
  - Property Manager User (for comparison)
- [ ] Test tickets created:
  - Ticket 1: Property A (Active)
  - Ticket 2: Property A (Completed)
  - Ticket 3: Property B (Active)
  - Ticket 4: Property B (Monitoring)
  - Ticket 5: Property C (Active)
- [ ] Browser console open (F12) for error checking

---

## Test Cases

### Test Case 1: Maintenance User with Single Property Assignment

**Priority:** Critical  
**Role:** Maintenance User 1 (assigned to Property A only)

#### Setup
1. Log in as Admin
2. Create Maintenance User 1
3. Assign only Property A to Maintenance User 1
4. Create test tickets:
   - Ticket 1: Property A, Status: "Not Started"
   - Ticket 2: Property B, Status: "Not Started"
   - Ticket 3: Property C, Status: "Not Started"
5. Log out

#### Steps
1. Log in as Maintenance User 1
2. Navigate to Maintenance page
3. Verify property dropdown shows only Property A
4. Select Property A from dropdown
5. Verify tickets list displays
6. Check browser console for errors
7. Try to access Property B (if visible in dropdown)
8. Try to access Property C (if visible in dropdown)

#### Expected Results
- ✅ Property dropdown shows **only Property A**
- ✅ Can see Ticket 1 (Property A)
- ✅ **Cannot** see Ticket 2 (Property B)
- ✅ **Cannot** see Ticket 3 (Property C)
- ✅ No console errors
- ✅ Property B and Property C **not visible** in property dropdown
- ✅ Cannot select unassigned properties

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 2: Maintenance User with Multiple Property Assignments

**Priority:** Critical  
**Role:** Maintenance User 2 (assigned to Property A and Property B)

#### Setup
1. Log in as Admin
2. Create Maintenance User 2
3. Assign Property A and Property B to Maintenance User 2
4. Ensure Property C is NOT assigned
5. Create test tickets:
   - Ticket 1: Property A, Status: "Not Started"
   - Ticket 2: Property A, Status: "Completed"
   - Ticket 3: Property B, Status: "In Progress"
   - Ticket 4: Property B, Status: "Monitoring"
   - Ticket 5: Property C, Status: "Not Started"
6. Log out

#### Steps
1. Log in as Maintenance User 2
2. Navigate to Maintenance page
3. Verify property dropdown shows Property A and Property B (not Property C)
4. Select Property A from dropdown
5. Verify tickets for Property A display
6. Select Property B from dropdown
7. Verify tickets for Property B display
8. Check all ticket status views (Active, Monitoring, Completed)
9. Check browser console for errors

#### Expected Results
- ✅ Property dropdown shows **Property A and Property B only**
- ✅ Property C **not visible** in dropdown
- ✅ Can see Ticket 1 and Ticket 2 when Property A is selected
- ✅ Can see Ticket 3 and Ticket 4 when Property B is selected
- ✅ **Cannot** see Ticket 5 (Property C) regardless of selection
- ✅ All ticket status views work correctly (Active, Monitoring, Completed)
- ✅ No console errors

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 3: Create Ticket - Assigned Property

**Priority:** Critical  
**Role:** Maintenance User 1 (assigned to Property A only)

#### Setup
1. Log in as Maintenance User 1
2. Navigate to Maintenance page
3. Select Property A from dropdown

#### Steps
1. Click "Create New Ticket" button (FAB)
2. Verify ticket form opens
3. Verify property dropdown in form shows only Property A
4. Fill in ticket details:
   - Property: Property A (should be pre-selected)
   - Work Description: "Test ticket creation"
   - Status: "Not Started"
5. Submit ticket
6. Verify ticket appears in tickets list
7. Verify ticket is associated with Property A
8. Check browser console for errors

#### Expected Results
- ✅ Ticket form opens successfully
- ✅ Property dropdown shows **only Property A**
- ✅ Property A is pre-selected
- ✅ Can create ticket successfully
- ✅ Ticket appears in list after creation
- ✅ Ticket is correctly associated with Property A
- ✅ No console errors
- ✅ No permission errors

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 4: Create Ticket - Attempt Unassigned Property (Security Test)

**Priority:** Critical  
**Role:** Maintenance User 1 (assigned to Property A only)

#### Setup
1. Log in as Admin
2. Ensure Property B exists and is NOT assigned to Maintenance User 1
3. Log out

#### Steps
1. Log in as Maintenance User 1
2. Navigate to Maintenance page
3. Open browser console (F12)
4. Open Network tab
5. Click "Create New Ticket" button
6. Try to manipulate form to select Property B (if visible)
7. If Property B is not visible, try to submit ticket with Property B ID via console
8. Monitor console and network for errors

#### Expected Results
- ✅ Property B **not visible** in property dropdown
- ✅ Cannot select Property B from dropdown
- ✅ If attempting to create ticket for Property B via console/manipulation:
  - ✅ Firestore security rules block the operation
  - ✅ Permission denied error appears
  - ✅ Ticket is NOT created
- ✅ No data leakage

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 5: Edit Ticket - Assigned Property

**Priority:** High  
**Role:** Maintenance User 2 (assigned to Property A and Property B)

#### Setup
1. Log in as Admin
2. Create Ticket 1: Property A, Status: "Not Started"
3. Log out

#### Steps
1. Log in as Maintenance User 2
2. Navigate to Maintenance page
3. Select Property A
4. Find Ticket 1
5. Click to edit Ticket 1
6. Modify ticket details:
   - Update Work Description
   - Change Status to "In Progress"
   - Add work updates
7. Save ticket
8. Verify changes are saved
9. Check browser console for errors

#### Expected Results
- ✅ Can open ticket for editing
- ✅ Can modify ticket fields
- ✅ Changes save successfully
- ✅ Updated ticket appears in list with new status
- ✅ No console errors
- ✅ No permission errors

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 6: Edit Ticket - Attempt Unassigned Property (Security Test)

**Priority:** Critical  
**Role:** Maintenance User 1 (assigned to Property A only)

#### Setup
1. Log in as Admin
2. Create Ticket 1: Property B, Status: "Not Started"
3. Log out

#### Steps
1. Log in as Maintenance User 1
2. Navigate to Maintenance page
3. Verify Ticket 1 (Property B) is NOT visible
4. Open browser console (F12)
5. Try to access Ticket 1 directly via Firestore query
6. Try to update Ticket 1 via console
7. Monitor console for errors

#### Expected Results
- ✅ Ticket 1 (Property B) **not visible** in tickets list
- ✅ Cannot access Ticket 1 via Firestore query (permission denied)
- ✅ Cannot update Ticket 1 (permission denied)
- ✅ Firestore security rules block all access attempts
- ✅ No data leakage

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 7: Complete Ticket - Assigned Property

**Priority:** High  
**Role:** Maintenance User 1 (assigned to Property A only)

#### Setup
1. Log in as Admin
2. Create Ticket 1: Property A, Status: "In Progress"
3. Log out

#### Steps
1. Log in as Maintenance User 1
2. Navigate to Maintenance page
3. Select Property A
4. Find Ticket 1
5. Click "Advance Workflow" dropdown
6. Select "Complete"
7. Fill in completion details:
   - How Resolved: "Fixed the issue"
   - Time Allocation: Enable toggle, set hours
   - Billing Rate: Set rate
8. Submit completion
9. Verify ticket moves to Completed view
10. Check browser console for errors

#### Expected Results
- ✅ Can access "Advance Workflow" dropdown
- ✅ Can select "Complete" option
- ✅ Completion modal opens
- ✅ Can fill in completion details
- ✅ Can submit completion successfully
- ✅ Ticket moves to Completed view
- ✅ No console errors
- ✅ No permission errors

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 8: Move to Monitoring - Assigned Property

**Priority:** High  
**Role:** Maintenance User 2 (assigned to Property A and Property B)

#### Setup
1. Log in as Admin
2. Create Ticket 1: Property A, Status: "In Progress"
3. Log out

#### Steps
1. Log in as Maintenance User 2
2. Navigate to Maintenance page
3. Select Property A
4. Find Ticket 1
5. Click "Advance Workflow" dropdown
6. Select "Monitoring"
7. Fill in monitoring details (invoice/proposal if applicable)
8. Submit
9. Verify ticket moves to Monitoring view
10. Check browser console for errors

#### Expected Results
- ✅ Can access "Advance Workflow" dropdown
- ✅ Can select "Monitoring" option
- ✅ Monitoring workflow completes successfully
- ✅ Ticket moves to Monitoring view
- ✅ No console errors
- ✅ No permission errors

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 9: View All Ticket Statuses - Assigned Properties

**Priority:** Medium  
**Role:** Maintenance User 2 (assigned to Property A and Property B)

#### Setup
1. Log in as Admin
2. Create test tickets:
   - Ticket 1: Property A, Status: "Not Started"
   - Ticket 2: Property A, Status: "Completed"
   - Ticket 3: Property A, Status: "Monitoring"
   - Ticket 4: Property B, Status: "In Progress"
   - Ticket 5: Property B, Status: "Completed"
   - Ticket 6: Property C, Status: "Not Started"
3. Log out

#### Steps
1. Log in as Maintenance User 2
2. Navigate to Maintenance page
3. Select Property A
4. Check Active view
5. Check Monitoring view
6. Check Completed view
7. Select Property B
8. Check Active view
9. Check Monitoring view
10. Check Completed view
11. Verify Property C tickets are never visible

#### Expected Results
- ✅ Active view shows Ticket 1 (Property A) and Ticket 4 (Property B)
- ✅ Monitoring view shows Ticket 3 (Property A)
- ✅ Completed view shows Ticket 2 (Property A) and Ticket 5 (Property B)
- ✅ Ticket 6 (Property C) **never visible** in any view
- ✅ Views switch correctly when changing properties
- ✅ Metrics update correctly for assigned properties only

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 10: Property Assignment Change - Dynamic Update

**Priority:** High  
**Role:** Maintenance User 1 (initially assigned to Property A only)

#### Setup
1. Log in as Admin
2. Create Maintenance User 1
3. Assign Property A only
4. Create tickets:
   - Ticket 1: Property A
   - Ticket 2: Property B
5. Log out

#### Steps
1. Log in as Maintenance User 1
2. Verify can see Ticket 1, cannot see Ticket 2
3. Log out
4. Log in as Admin
5. Edit Maintenance User 1
6. Add Property B to assigned properties
7. Save changes
8. Log out
9. Log in as Maintenance User 1
10. Refresh page
11. Verify property dropdown now shows Property A and Property B
12. Verify can now see Ticket 2

#### Expected Results
- ✅ Initially: Can see Ticket 1 only, Property A only in dropdown
- ✅ After assignment change: Property dropdown updates to show Property A and Property B
- ✅ Can now see Ticket 2 (Property B)
- ✅ Changes take effect after page refresh/login
- ✅ No console errors

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 11: Property Removal - Access Revocation

**Priority:** High  
**Role:** Maintenance User 2 (initially assigned to Property A and Property B)

#### Setup
1. Log in as Admin
2. Create Maintenance User 2
3. Assign Property A and Property B
4. Create tickets:
   - Ticket 1: Property A
   - Ticket 2: Property B
5. Log out

#### Steps
1. Log in as Maintenance User 2
2. Verify can see Ticket 1 and Ticket 2
3. Log out
4. Log in as Admin
5. Edit Maintenance User 2
6. Remove Property B from assigned properties (keep Property A)
7. Save changes
8. Log out
9. Log in as Maintenance User 2
10. Refresh page
11. Verify property dropdown now shows Property A only
12. Verify Ticket 2 (Property B) is no longer visible

#### Expected Results
- ✅ Initially: Can see Ticket 1 and Ticket 2, both properties in dropdown
- ✅ After property removal: Property dropdown updates to show Property A only
- ✅ Ticket 2 (Property B) **no longer visible**
- ✅ Can still see Ticket 1 (Property A)
- ✅ Changes take effect after page refresh/login
- ✅ No console errors

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 12: Firestore Security Rules - Direct Database Access

**Priority:** Critical  
**Role:** Maintenance User 1 (assigned to Property A only)

#### Setup
1. Log in as Maintenance User 1
2. Open browser console (F12)

#### Steps
1. In console, try to read all tickets:
   ```javascript
   db.collection('tickets').get()
   ```
2. Try to read a specific ticket for Property B:
   ```javascript
   db.collection('tickets').doc('ticketIdForPropertyB').get()
   ```
3. Try to create a ticket for Property B:
   ```javascript
   db.collection('tickets').add({
     propertyId: 'propertyBId',
     workDescription: 'Unauthorized ticket',
     status: 'Not Started'
   })
   ```
4. Try to update a ticket for Property B:
   ```javascript
   db.collection('tickets').doc('ticketIdForPropertyB').update({
     status: 'Completed'
   })
   ```
5. Monitor console for permission errors

#### Expected Results
- ✅ Reading all tickets returns **only tickets for Property A**
- ✅ Reading Property B ticket returns **permission denied error**
- ✅ Creating ticket for Property B returns **permission denied error**
- ✅ Updating Property B ticket returns **permission denied error**
- ✅ All unauthorized operations are blocked by Firestore security rules
- ✅ No data leakage

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 13: Comparison with Property Manager Role

**Priority:** Medium  
**Role:** Property Manager (assigned to Property A and Property B)

#### Setup
1. Log in as Admin
2. Create Property Manager user
3. Assign Property A and Property B
4. Create tickets:
   - Ticket 1: Property A
   - Ticket 2: Property B
   - Ticket 3: Property C
5. Log out

#### Steps
1. Log in as Property Manager
2. Navigate to Maintenance page
3. Verify property dropdown shows Property A and Property B
4. Verify can see Ticket 1 and Ticket 2
5. Verify cannot see Ticket 3 (Property C)
6. Compare behavior with Maintenance User 2 (same property assignments)

#### Expected Results
- ✅ Property Manager behavior matches Maintenance role behavior
- ✅ Both roles see same tickets for assigned properties
- ✅ Both roles cannot see tickets for unassigned properties
- ✅ Property restrictions work consistently across roles

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 14: Comparison with Admin Role

**Priority:** Low  
**Role:** Admin

#### Setup
1. Log in as Admin
2. Create tickets:
   - Ticket 1: Property A
   - Ticket 2: Property B
   - Ticket 3: Property C
3. Verify Admin has no property assignments (or all properties assigned)

#### Steps
1. Log in as Admin
2. Navigate to Maintenance page
3. Verify property dropdown shows ALL properties
4. Verify can see ALL tickets (Ticket 1, 2, 3)
5. Compare with Maintenance User behavior

#### Expected Results
- ✅ Admin can see ALL properties in dropdown
- ✅ Admin can see ALL tickets regardless of property
- ✅ Admin bypasses property restrictions (as expected)
- ✅ Admin behavior differs from Maintenance role (as expected)

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 15: Edge Case - No Property Assignments

**Priority:** Medium  
**Role:** Maintenance User with no property assignments

#### Setup
1. Log in as Admin
2. Create Maintenance User 3
3. Do NOT assign any properties
4. Create tickets:
   - Ticket 1: Property A
   - Ticket 2: Property B
5. Log out

#### Steps
1. Log in as Maintenance User 3
2. Navigate to Maintenance page
3. Verify property dropdown behavior
4. Verify tickets list behavior
5. Check browser console for errors

#### Expected Results
- ✅ Property dropdown shows **no properties** or empty state
- ✅ Tickets list shows **no tickets** or empty state
- ✅ Cannot create tickets (no properties to select)
- ✅ Appropriate empty state messages displayed
- ✅ No console errors
- ✅ No permission errors (graceful handling)

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

### Test Case 16: Edge Case - All Properties Assigned

**Priority:** Low  
**Role:** Maintenance User with all properties assigned

#### Setup
1. Log in as Admin
2. Create Maintenance User 4
3. Assign ALL properties (Property A, B, C)
4. Create tickets for all properties
5. Log out

#### Steps
1. Log in as Maintenance User 4
2. Navigate to Maintenance page
3. Verify property dropdown shows all properties
4. Verify can see all tickets
5. Compare with Admin behavior

#### Expected Results
- ✅ Property dropdown shows all properties
- ✅ Can see all tickets
- ✅ Behavior similar to Admin (but still restricted by role, not property)

#### Pass/Fail: ☐ Pass ☐ Fail  
**Notes:**

---

## Test Execution Summary

### Test Results
- Total Test Cases: 16
- Passed: ☐ ___
- Failed: ☐ ___
- Blocked: ☐ ___

### Critical Issues Found
1. 
2. 
3. 

### Medium Priority Issues Found
1. 
2. 
3. 

### Low Priority Issues Found
1. 
2. 
3. 

---

## Sign-Off

**Tester Name:** ________________  
**Date:** ________________  
**Status:** ☐ Pass ☐ Fail ☐ Needs Retest

**Notes:**

---

*Test Plan maintained by Proppli Development Team*
