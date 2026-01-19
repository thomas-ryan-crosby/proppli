# User Management & Permissions Guide

**Last Updated:** January 2025  
**Status:** Production Ready

---

## Overview

Proppli uses a role-based access control (RBAC) system with five distinct user roles. Permissions are enforced at both the Firestore security rules level and the application UI level. Users can be assigned to specific properties, which further restricts their access to only those properties.

---

## User Roles

### 1. Super Admin
**Role Code:** `super_admin`

**Description:**  
Highest level of access. Can perform any action in the system without restrictions.

**Permissions:**

#### Database Access (Firestore Rules)
- ✅ **Full read/write access** to ALL collections and documents
- ✅ Can access any document that doesn't match specific rules (catch-all override)
- ✅ Can delete users (only role with this permission)
- ✅ Can modify Super Admin roles (only role that can change Super Admin roles)

#### User Management
- ✅ Can view all users
- ✅ Can invite new users with any role
- ✅ Can activate/deactivate any user
- ✅ Can edit any user's profile, role, and property assignments
- ✅ Can change Super Admin roles
- ✅ Can delete users

#### Properties
- ✅ Full access to ALL properties (regardless of `assignedProperties`)
- ✅ Can create, edit, and delete properties
- ✅ Can view all property data

#### Buildings & Units
- ✅ Full access to all buildings and units
- ✅ Can create, edit, and delete buildings and units

#### Tenants
- ✅ Full access to all tenants
- ✅ Can create, edit, and delete tenants

#### Leases
- ✅ Full access to all leases
- ✅ Can create, edit, and delete leases

#### Maintenance Tickets
- ✅ Full access to all tickets
- ✅ Can view all tickets
- ✅ Can create, edit, and complete tickets

#### Occupancies
- ✅ Full access to all occupancies
- ✅ Can create, edit, and delete occupancies

#### UI Access
- ✅ "Users" navigation link visible
- ✅ Can access all pages and features

---

### 2. Admin
**Role Code:** `admin`

**Description:**  
Administrative access with full property management capabilities. Similar to Super Admin but cannot delete users or modify Super Admin roles.

**Permissions:**

#### Database Access (Firestore Rules)
- ✅ Can read/write to all collections (except user deletion)
- ✅ Can read all user profiles
- ✅ Can create/update/delete user invitations
- ✅ Can create/update/delete pending users

#### User Management
- ✅ Can view all users
- ✅ Can invite new users with any role (except Super Admin)
- ✅ Can activate/deactivate any user
- ✅ Can edit any user's profile, role, and property assignments
- ❌ **Cannot** change Super Admin roles
- ❌ **Cannot** delete users

#### Properties
- ✅ Full access to ALL properties (regardless of `assignedProperties`)
- ✅ Can create, edit, and delete properties
- ✅ Can view all property data

#### Buildings & Units
- ✅ Full access to all buildings and units
- ✅ Can create, edit, and delete buildings and units

#### Tenants
- ✅ Full access to all tenants
- ✅ Can create, edit, and delete tenants

#### Leases
- ✅ Full access to all leases
- ✅ Can create, edit, and delete leases

#### Maintenance Tickets
- ✅ Full access to all tickets
- ✅ Can view all tickets
- ✅ Can create, edit, and complete tickets

#### Occupancies
- ✅ Full access to all occupancies
- ✅ Can create, edit, and delete occupancies

#### UI Access
- ✅ "Users" navigation link visible
- ✅ Can access all pages and features

---

### 3. Property Manager
**Role Code:** `property_manager`

**Description:**  
Manages properties, tenants, leases, and maintenance tickets. Access is restricted to assigned properties only.

**Permissions:**

#### Database Access (Firestore Rules)
- ✅ Can read properties, buildings, units, tenants, leases, tickets, and occupancies **only for assigned properties**
- ✅ Can write (create/update/delete) to:
  - Properties (assigned only)
  - Buildings (assigned properties only)
  - Units (assigned properties only)
  - Tenants (all tenants - no property restriction)
  - Leases (assigned properties only)
  - Tickets (assigned properties only)
  - Occupancies (assigned properties only)

#### User Management
- ❌ **Cannot** view users list
- ❌ **Cannot** invite users
- ❌ **Cannot** activate/deactivate users
- ❌ **Cannot** edit user profiles

#### Properties
- ✅ Can view **only assigned properties** (from `assignedProperties` array)
- ✅ Can create, edit, and delete **assigned properties only**
- ❌ Cannot view or access unassigned properties

#### Buildings & Units
- ✅ Can view buildings/units **for assigned properties only**
- ✅ Can create, edit, and delete buildings/units **for assigned properties only**
- ❌ Cannot access buildings/units for unassigned properties

#### Tenants
- ✅ Can view **all tenants** (no property restriction for reading)
- ✅ Can create, edit, and delete tenants

#### Leases
- ✅ Can view leases **for assigned properties only**
- ✅ Can create, edit, and delete leases **for assigned properties only**
- ❌ Cannot access leases for unassigned properties

#### Maintenance Tickets
- ✅ Can view tickets **for assigned properties only**
- ✅ Can create, edit, and complete tickets **for assigned properties only**
- ❌ Cannot access tickets for unassigned properties

#### Occupancies
- ✅ Can view occupancies **for assigned properties only**
- ✅ Can create, edit, and delete occupancies **for assigned properties only**
- ❌ Cannot access occupancies for unassigned properties

#### UI Access
- ❌ "Users" navigation link **hidden**
- ✅ Can access Properties, Tenants, Leases, Maintenance, Finance pages
- ✅ Can access Profile page

---

### 4. Maintenance
**Role Code:** `maintenance`

**Description:**  
Focused on maintenance ticket management. Can view and update tickets across all properties, but has limited access to other features.

**Permissions:**

#### Database Access (Firestore Rules)
- ✅ Can read tickets **for assigned properties only**
- ✅ Can write (create/update/complete) tickets **for assigned properties only**
- ✅ Can read properties, buildings, units, tenants, leases, occupancies **for assigned properties only**

#### User Management
- ❌ **Cannot** view users list
- ❌ **Cannot** invite users
- ❌ **Cannot** activate/deactivate users
- ❌ **Cannot** edit user profiles

#### Properties
- ✅ Can view **only assigned properties** (from `assignedProperties` array)
- ❌ **Cannot** create, edit, or delete properties

#### Buildings & Units
- ✅ Can view buildings/units **for assigned properties only**
- ❌ **Cannot** create, edit, or delete buildings/units

#### Tenants
- ✅ Can view tenants **for assigned properties only** (via property relationship)
- ❌ **Cannot** create, edit, or delete tenants

#### Leases
- ✅ Can view leases **for assigned properties only**
- ❌ **Cannot** create, edit, or delete leases

#### Maintenance Tickets
- ✅ Can view tickets **for assigned properties only**
- ✅ Can create, edit, and complete tickets **for assigned properties only**
- ✅ Can update ticket status, add notes, upload photos
- ✅ Can mark tickets as complete or move to monitoring
- ❌ Cannot access tickets for unassigned properties

#### Occupancies
- ✅ Can view occupancies **for assigned properties only**
- ❌ **Cannot** create, edit, or delete occupancies

#### UI Access
- ❌ "Users" navigation link **hidden**
- ✅ Can access Maintenance page (primary focus)
- ✅ Can access Properties page (read-only for assigned properties)
- ✅ Can access Profile page
- ⚠️ Limited access to Tenants, Leases, Finance pages (read-only for assigned properties)

---

### 5. Viewer
**Role Code:** `viewer`

**Description:**  
Read-only access to assigned properties. Cannot create, edit, or delete any data.

**Permissions:**

#### Database Access (Firestore Rules)
- ✅ Can read properties, buildings, units, tenants, leases, tickets, occupancies **for assigned properties only**
- ❌ **Cannot** write (create/update/delete) to any collection

#### User Management
- ❌ **Cannot** view users list
- ❌ **Cannot** invite users
- ❌ **Cannot** activate/deactivate users
- ❌ **Cannot** edit user profiles

#### Properties
- ✅ Can view **only assigned properties** (from `assignedProperties` array)
- ❌ **Cannot** create, edit, or delete properties

#### Buildings & Units
- ✅ Can view buildings/units **for assigned properties only**
- ❌ **Cannot** create, edit, or delete buildings/units

#### Tenants
- ✅ Can view tenants **for assigned properties only**
- ❌ **Cannot** create, edit, or delete tenants

#### Leases
- ✅ Can view leases **for assigned properties only**
- ❌ **Cannot** create, edit, or delete leases

#### Maintenance Tickets
- ✅ Can view tickets **for assigned properties only**
- ❌ **Cannot** create, edit, or complete tickets

#### Occupancies
- ✅ Can view occupancies **for assigned properties only**
- ❌ **Cannot** create, edit, or delete occupancies

#### UI Access
- ❌ "Users" navigation link **hidden**
- ✅ Can access Properties, Tenants, Leases, Maintenance, Finance pages (read-only)
- ✅ Can access Profile page
- ⚠️ All "Create" buttons and edit actions are disabled/hidden

---

## Property Assignment System

### How It Works

Users can be assigned to specific properties via the `assignedProperties` array in their user profile:

```javascript
{
  role: "property_manager",
  assignedProperties: ["propertyId1", "propertyId2", "propertyId3"],
  // ...
}
```

### Property Assignment Rules

1. **Super Admin & Admin:**
   - `assignedProperties` is **optional** (can be empty array)
   - Property assignment does **not** restrict their access
   - They have full access to all properties regardless of assignment

2. **Property Manager:**
   - **Must** have at least one property assigned (enforced during user invitation)
   - Can only access properties in their `assignedProperties` array
   - Cannot access unassigned properties

3. **Maintenance:**
   - Can have properties assigned (optional)
   - Property assignment affects access to properties, buildings, units, tenants, leases, occupancies
   - **Tickets are accessible regardless of property assignment** (special exception)

4. **Viewer:**
   - **Must** have at least one property assigned (enforced during user invitation)
   - Can only access properties in their `assignedProperties` array
   - Cannot access unassigned properties

### Property Assignment During User Invitation

When an Admin invites a user:
- **Admin/Super Admin roles:** Property assignment is optional
- **All other roles:** At least one property must be selected
- Validation prevents creating invitations without required property assignments

---

## User Status: Active vs. Inactive

### Active Users (`isActive: true`)
- ✅ Can log in and access the application
- ✅ Can perform actions according to their role permissions
- ✅ Can see all features they have permission to access

### Inactive Users (`isActive: false`)
- ❌ **Cannot** log in
- ❌ **Cannot** access the application
- ❌ See "Permission Denied" modal if they attempt to log in
- ⚠️ Automatically signed out if they somehow authenticate

### How Users Become Active

1. **Admin Invitation:**
   - Invited users are **automatically active** (`isActive: true`)
   - Can log in immediately after signup

2. **Self-Registration:**
   - Self-registered users start as **inactive** (`isActive: false`)
   - Admin must manually activate the account
   - All new users receive a welcome email; self-registered users cannot log in until activated

3. **Manual Activation:**
   - Admin can activate/deactivate users via the Users page
   - Activation email is automatically sent when user is activated

---

## Permission Enforcement Layers

### 1. Firestore Security Rules
- **Primary enforcement layer**
- Enforced at the database level
- Cannot be bypassed by client-side code
- Located in `firestore.rules`

### 2. Application UI Checks
- **Secondary enforcement layer**
- Hides/shows UI elements based on role
- Prevents users from seeing features they cannot access
- Located in `app.js` (e.g., `updateUserMenu()`, `loadUsers()`)

### 3. Client-Side Validation
- **Tertiary enforcement layer**
- Validates actions before submission
- Provides user-friendly error messages
- Cannot be relied upon for security (can be bypassed)

---

## Common Permission Scenarios

### Scenario 1: Property Manager with Multiple Properties
**User:** Property Manager  
**Assigned Properties:** Property A, Property B

**Access:**
- ✅ Can view/edit Property A and Property B
- ✅ Can view/edit buildings, units, tenants, leases, tickets, occupancies for Property A and B
- ❌ Cannot see Property C (not assigned)
- ❌ Cannot see any data related to Property C

### Scenario 2: Maintenance Staff Accessing Tickets
**User:** Maintenance  
**Assigned Properties:** Property A only

**Access:**
- ✅ Can view/edit tickets **for Property A only**
- ✅ Can view Property A details
- ✅ Can view buildings/units/tenants for Property A
- ❌ Cannot view Property B details (not assigned)
- ❌ Cannot view/edit tickets for Property B (not assigned)

### Scenario 3: Viewer Accessing Data
**User:** Viewer  
**Assigned Properties:** Property A, Property B

**Access:**
- ✅ Can view Property A and Property B data
- ✅ Can view buildings, units, tenants, leases, tickets, occupancies for Property A and B
- ❌ Cannot create, edit, or delete anything
- ❌ Cannot see Property C (not assigned)

### Scenario 4: Admin Accessing All Data
**User:** Admin  
**Assigned Properties:** None (empty array)

**Access:**
- ✅ Can view/edit **all properties** (regardless of assignment)
- ✅ Can view/edit all buildings, units, tenants, leases, tickets, occupancies
- ✅ Can manage users
- ✅ Full system access

---

## Role Comparison Matrix

| Feature | Super Admin | Admin | Property Manager | Maintenance | Viewer |
|---------|------------|-------|------------------|-------------|--------|
| **User Management** |
| View Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Invite Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Activate Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit User Roles | ✅ | ✅* | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Properties** |
| View All Properties | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Assigned Properties | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Properties | ✅ | ✅ | ✅** | ❌ | ❌ |
| Edit Properties | ✅ | ✅ | ✅** | ❌ | ❌ |
| Delete Properties | ✅ | ✅ | ✅** | ❌ | ❌ |
| **Buildings & Units** |
| View (Assigned) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit/Delete | ✅ | ✅ | ✅** | ❌ | ❌ |
| **Tenants** |
| View (All) | ✅ | ✅ | ✅ | ✅*** | ✅*** |
| Create/Edit/Delete | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Leases** |
| View (Assigned) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit/Delete | ✅ | ✅ | ✅** | ❌ | ❌ |
| **Maintenance Tickets** |
| View (All) | ✅ | ✅ | ❌ | ❌ | ❌ |
| View (Assigned) | ✅ | ✅ | ✅** | ✅** | ✅** |
| Create/Edit/Complete | ✅ | ✅ | ✅** | ✅** | ❌ |
| **Occupancies** |
| View (Assigned) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit/Delete | ✅ | ✅ | ✅** | ❌ | ❌ |

**Legend:**
- ✅ = Full access
- ✅* = Cannot change Super Admin roles
- ✅** = Only for assigned properties
- ✅*** = For assigned properties only (Maintenance/Viewer)
- ❌ = No access

---

## Security Considerations

### 1. Role Escalation Prevention
- Users **cannot** modify their own role or `isActive` status
- Only Admins can modify user roles
- Only Super Admins can modify Super Admin roles
- Only Super Admins can delete users

### 2. Property Access Control
- Property assignment is enforced at the Firestore rules level
- Users cannot access data for unassigned properties
- Admins/Super Admins bypass property restrictions

### 3. Active Status Enforcement
- Inactive users are blocked at the authentication level
- `isActive` check is performed in Firestore rules
- UI checks prevent inactive users from accessing features

### 4. Client-Side vs. Server-Side
- **Never rely on client-side checks alone**
- Firestore security rules are the source of truth
- UI checks provide better UX but can be bypassed

---

## Troubleshooting Permission Issues

### Issue: User Cannot Access Assigned Property
**Possible Causes:**
1. Property ID not in `assignedProperties` array
2. User role doesn't have read permission for properties
3. User is inactive (`isActive: false`)

**Solution:**
- Verify `assignedProperties` array includes the property ID
- Check user role has appropriate permissions
- Ensure user is active

### Issue: Property Manager Cannot Create Tickets
**Possible Causes:**
1. Property not in `assignedProperties` array
2. User role is Viewer (read-only)

**Solution:**
- Add property to `assignedProperties` array
- Verify user role is `property_manager` or `maintenance`

### Issue: Maintenance Staff Cannot See All Tickets
**Possible Causes:**
1. Firestore rules not properly configured
2. User role is not `maintenance`

**Solution:**
- Verify Firestore rules allow `maintenance` role to read all tickets
- Check user role is correctly set to `maintenance`

### Issue: Admin Cannot Delete User
**Possible Causes:**
1. User is Super Admin (only Super Admins can delete Super Admins)
2. Admin role doesn't have delete permission

**Solution:**
- Only Super Admins can delete users
- Admins can delete all users except Super Admins

---

## Related Documentation

- **AUTHENTICATION.md** - Authentication flows and user signup
- **USER_WORKFLOW_PATHS.md** - Detailed user workflow paths
- **firestore.rules** - Security rules implementation
- **TEST_PLAN.md** - Permission testing scenarios

---

*Document maintained by Proppli Development Team*
