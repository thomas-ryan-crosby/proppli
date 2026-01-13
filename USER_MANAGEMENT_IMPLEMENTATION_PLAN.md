# User Management Implementation Plan

## Current Status

**Date:** Current Session  
**Branch:** `main`  
**Status:** Ready to Implement

### What Exists ✅
- Authentication system fully implemented
- Security rules for user management in place
- User data structure defined in Firestore
- User profile loading functionality
- Admin role checking in security rules

### What's Missing ❌
- User Management page UI
- User list view
- User detail/edit modal
- Create/Invite user functionality
- User activation/deactivation UI
- Role assignment UI
- Property assignment UI
- User search and filters

---

## Implementation Plan

### Phase 1: Core User Management Page (Priority: High)

#### 1.1 Add "Users" Navigation Link
**Location:** `index.html` - Navigation bar

**Requirements:**
- Only visible to Admins and Super Admins
- Add to navigation: `<button class="nav-link" data-page="users">Users</button>`
- Check user role before showing

**Implementation:**
- Add conditional rendering based on `currentUserProfile.role`
- Show only if role is `'admin'` or `'super_admin'`

---

#### 1.2 Create Users Page HTML
**Location:** `index.html` - After other page sections

**Structure:**
```html
<div id="usersPage" class="page">
    <header>
        <h2>User Management</h2>
        <div class="header-actions">
            <button id="inviteUserBtn" class="btn-primary">Invite User</button>
        </div>
    </header>
    <main>
        <!-- Filters and Search -->
        <div class="filters-section">
            <input type="text" id="userSearch" placeholder="Search by name or email...">
            <select id="userRoleFilter">
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="property_manager">Property Manager</option>
                <option value="maintenance">Maintenance</option>
                <option value="viewer">Viewer</option>
            </select>
            <select id="userStatusFilter">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
            </select>
        </div>
        
        <!-- Users List -->
        <div id="usersList" class="users-list">
            <!-- Users will be rendered here -->
        </div>
    </main>
</div>
```

**Features:**
- Search input for name/email
- Role filter dropdown
- Status filter dropdown
- Users list container
- "Invite User" button in header

---

#### 1.3 User List Item Design
**Each user card should display:**
- Name (displayName)
- Email
- Role badge (color-coded)
- Status badge (Active/Inactive/Pending)
- Last Login date
- Assigned Properties count
- Action buttons (View, Edit, Activate/Deactivate)

**Layout Options:**
- **Option A:** Card view (similar to tenants/properties)
- **Option B:** Table view (more compact, better for many users)
- **Recommendation:** Start with card view, add table view toggle later

---

### Phase 2: User Data Loading & Display

#### 2.1 Load Users Function
**Location:** `app.js`

**Function:** `loadUsers()`

**Requirements:**
- Only admins can call this
- Fetch all users from `users` collection
- Handle permission errors gracefully
- Real-time updates with `onSnapshot`

**Implementation:**
```javascript
function loadUsers() {
    // Check if user is admin
    if (!currentUserProfile || 
        !['admin', 'super_admin'].includes(currentUserProfile.role)) {
        return;
    }
    
    db.collection('users')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const users = {};
            snapshot.forEach((doc) => {
                users[doc.id] = { id: doc.id, ...doc.data() };
            });
            renderUsersList(users);
        }, (error) => {
            console.error('Error loading users:', error);
            if (error.code === 'permission-denied') {
                handlePermissionError('user management');
            }
        });
}
```

---

#### 2.2 Render Users List
**Function:** `renderUsersList(users)`

**Requirements:**
- Display all users in list
- Apply current filters
- Show user information clearly
- Handle empty state

**Features:**
- Filter by role
- Filter by status
- Search by name/email
- Sort by name, email, role, last login

---

### Phase 3: User Detail & Edit Modal

#### 3.1 User Detail Modal HTML
**Location:** `index.html`

**Structure:**
```html
<div id="userDetailModal" class="modal">
    <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
            <h2 id="userDetailModalTitle">User Details</h2>
            <button class="close-btn" id="closeUserDetailModal">&times;</button>
        </div>
        <div class="modal-body">
            <!-- Tabs: Details, Properties, Activity -->
            <div class="user-detail-tabs">
                <button class="tab-btn active" data-tab="details">Details</button>
                <button class="tab-btn" data-tab="properties">Properties</button>
                <button class="tab-btn" data-tab="activity">Activity</button>
            </div>
            
            <!-- Details Tab -->
            <div id="userDetailsTab" class="tab-content active">
                <!-- User info form -->
            </div>
            
            <!-- Properties Tab -->
            <div id="userPropertiesTab" class="tab-content">
                <!-- Assigned properties list -->
            </div>
            
            <!-- Activity Tab -->
            <div id="userActivityTab" class="tab-content">
                <!-- Activity log -->
            </div>
            
            <!-- Actions -->
            <div class="modal-actions">
                <button id="saveUserBtn" class="btn-primary">Save Changes</button>
                <button id="activateUserBtn" class="btn-secondary">Activate</button>
                <button id="deactivateUserBtn" class="btn-secondary">Deactivate</button>
                <button id="deleteUserBtn" class="btn-danger">Delete User</button>
            </div>
        </div>
    </div>
</div>
```

---

#### 3.2 User Edit Form Fields
**Fields:**
- Email (read-only if user exists)
- Full Name (displayName)
- Phone
- Role (dropdown, disabled for super_admin if current user is not super_admin)
- Status (Active/Inactive)
- Title (optional)
- Department (optional)
- Notes (optional)

**Validation:**
- Email format
- Name required
- Role required
- Cannot change super_admin role unless current user is super_admin

---

#### 3.3 Save User Function
**Function:** `saveUser(userId, userData)`

**Requirements:**
- Update user document in Firestore
- Handle permission errors
- Show success/error messages
- Update UI after save

---

### Phase 4: Create/Invite User Functionality

#### 4.1 Invite User Modal HTML
**Location:** `index.html`

**Structure:**
```html
<div id="inviteUserModal" class="modal">
    <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
            <h2>Invite User</h2>
            <button class="close-btn" id="closeInviteUserModal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="inviteUserForm">
                <div class="form-group">
                    <label for="inviteEmail">Email *</label>
                    <input type="email" id="inviteEmail" required>
                </div>
                <div class="form-group">
                    <label for="inviteFullName">Full Name *</label>
                    <input type="text" id="inviteFullName" required>
                </div>
                <div class="form-group">
                    <label for="inviteRole">Role *</label>
                    <select id="inviteRole" required>
                        <option value="">Select role...</option>
                        <option value="admin">Admin</option>
                        <option value="property_manager">Property Manager</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="invitePhone">Phone</label>
                    <input type="tel" id="invitePhone">
                </div>
                <div class="form-group">
                    <label for="inviteTitle">Title</label>
                    <input type="text" id="inviteTitle">
                </div>
                <div class="form-group">
                    <label for="inviteDepartment">Department</label>
                    <input type="text" id="inviteDepartment">
                </div>
                <div class="form-group">
                    <label for="inviteProperties">Assigned Properties *</label>
                    <div id="invitePropertiesList" class="properties-checkbox-list">
                        <!-- Properties checkboxes -->
                    </div>
                    <small>Required for non-admin roles</small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="sendInviteEmail" checked>
                        Send invitation email
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Send Invitation</button>
                    <button type="button" class="btn-secondary" id="cancelInviteUser">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</div>
```

---

#### 4.2 Invite User Function
**Function:** `inviteUser(userData)`

**Requirements:**
- Create user invitation document in `userInvitations` collection
- Generate unique invitation token
- Set expiration date (7 days)
- Optionally send invitation email
- Show success message

**Implementation:**
```javascript
async function inviteUser(userData) {
    try {
        // Generate invitation token
        const token = generateInvitationToken();
        
        // Calculate expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        // Create invitation document
        await db.collection('userInvitations').add({
            email: userData.email,
            displayName: userData.fullName,
            role: userData.role,
            assignedProperties: userData.assignedProperties || [],
            invitedBy: currentUser.uid,
            invitedAt: firebase.firestore.FieldValue.serverTimestamp(),
            expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
            token: token,
            status: 'pending',
            profile: {
                phone: userData.phone || null,
                title: userData.title || null,
                department: userData.department || null
            }
        });
        
        // Send email if requested
        if (userData.sendEmail) {
            // TODO: Implement email sending
            // For now, just log
            console.log('Invitation email would be sent to:', userData.email);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error inviting user:', error);
        throw error;
    }
}
```

---

### Phase 5: User Actions

#### 5.1 Activate/Deactivate User
**Function:** `toggleUserStatus(userId, isActive)`

**Requirements:**
- Update `isActive` field in user document
- Show confirmation for deactivation
- Update UI immediately
- Handle errors

---

#### 5.2 Delete User
**Function:** `deleteUser(userId)`

**Requirements:**
- Only super admins can delete
- Show confirmation dialog
- Delete user document from Firestore
- Optionally delete Firebase Auth account (requires Admin SDK)
- Handle errors gracefully

**Note:** Deleting Firebase Auth account requires Firebase Admin SDK (server-side). For now, we can just delete the Firestore document and mark the account as deleted.

---

#### 5.3 Assign/Unassign Properties
**Function:** `updateUserProperties(userId, propertyIds)`

**Requirements:**
- Update `assignedProperties` array in user document
- Show property selector with checkboxes
- Validate at least one property for non-admin roles
- Update UI after save

---

### Phase 6: Filters & Search

#### 6.1 Search Functionality
**Function:** `filterUsers(users, searchTerm, roleFilter, statusFilter)`

**Requirements:**
- Search by name (displayName)
- Search by email
- Case-insensitive
- Real-time filtering as user types

---

#### 6.2 Role Filter
- Filter by role dropdown
- Show count of users per role
- Clear filter option

---

#### 6.3 Status Filter
- Filter by Active/Inactive/Pending
- Show count of users per status
- Clear filter option

---

## Implementation Order

### Step 1: Basic Structure (1-2 hours)
1. Add "Users" navigation link (admin-only)
2. Create Users page HTML
3. Add page to navigation system
4. Test page visibility

### Step 2: Data Loading (1 hour)
1. Implement `loadUsers()` function
2. Implement `renderUsersList()` function
3. Add to page initialization
4. Test data loading

### Step 3: User List Display (2-3 hours)
1. Create user card component
2. Style user cards
3. Add role/status badges
4. Test display

### Step 4: User Detail Modal (2-3 hours)
1. Create user detail modal HTML
2. Implement `openUserDetailModal(userId)`
3. Populate user data in modal
4. Add tab navigation
5. Test modal

### Step 5: Edit User (2-3 hours)
1. Make form fields editable
2. Implement `saveUser()` function
3. Add validation
4. Test save functionality

### Step 6: Invite User (2-3 hours)
1. Create invite user modal
2. Implement `inviteUser()` function
3. Add property selector
4. Test invitation creation

### Step 7: User Actions (2-3 hours)
1. Implement activate/deactivate
2. Implement delete user
3. Implement property assignment
4. Add confirmation dialogs
5. Test all actions

### Step 8: Filters & Search (1-2 hours)
1. Implement search functionality
2. Implement role filter
3. Implement status filter
4. Test filtering

**Total Estimated Time:** 13-20 hours

---

## Files to Modify

### `index.html`
- Add Users navigation link (conditional)
- Add Users page HTML
- Add User Detail Modal
- Add Invite User Modal

### `app.js`
- Add `loadUsers()` function
- Add `renderUsersList()` function
- Add `openUserDetailModal()` function
- Add `saveUser()` function
- Add `inviteUser()` function
- Add `toggleUserStatus()` function
- Add `deleteUser()` function
- Add `updateUserProperties()` function
- Add `filterUsers()` function
- Add event listeners for user management
- Add Users page to navigation system

### `styles.css`
- Add user management page styles
- Add user card styles
- Add user detail modal styles
- Add invite user modal styles
- Add role/status badge styles

---

## Security Considerations

1. **Permission Checks:**
   - Always check user role before showing Users page
   - Check permissions before any user management action
   - Validate on both client and server (Firestore rules)

2. **Role Restrictions:**
   - Admins cannot create/delete super admins
   - Only super admins can delete users
   - Only super admins can change super_admin role

3. **Data Validation:**
   - Validate email format
   - Validate role selection
   - Validate property assignments
   - Prevent self-deletion

---

## Testing Checklist

- [ ] Users page only visible to admins
- [ ] Users list loads correctly
- [ ] User cards display all information
- [ ] Search filters users correctly
- [ ] Role filter works
- [ ] Status filter works
- [ ] User detail modal opens
- [ ] User data populates in modal
- [ ] Save user updates Firestore
- [ ] Invite user creates invitation
- [ ] Activate user works
- [ ] Deactivate user works
- [ ] Delete user works (super admin only)
- [ ] Property assignment works
- [ ] Permission errors handled gracefully
- [ ] Empty states display correctly

---

## Future Enhancements (Not in Phase 1)

1. **Email Integration:**
   - Send invitation emails
   - Send activation emails
   - Send password reset emails

2. **Activity Logging:**
   - Track user actions
   - Display activity history
   - Export activity logs

3. **Bulk Operations:**
   - Bulk activate/deactivate
   - Bulk role assignment
   - Bulk property assignment

4. **Advanced Features:**
   - User import from CSV
   - User export to CSV
   - User templates
   - Custom roles

---

*Ready to begin implementation!*
