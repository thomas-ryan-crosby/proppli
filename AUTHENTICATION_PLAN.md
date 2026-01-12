# Proppli Authentication & User Management Plan

## Overview
This document outlines the comprehensive plan for implementing user authentication, user management, and role-based access control for the Proppli property management platform.

---

## 1. Authentication System Architecture

### 1.1 Technology Stack
- **Firebase Authentication**: Primary authentication service
  - Email/Password authentication
  - Password reset functionality
  - Email verification (optional)
  - Session management
- **Firestore**: User profile and role data storage
- **Custom Claims**: For role-based access control (optional, for advanced features)

### 1.2 Authentication Flow
```
User Registration/Login
    ↓
Firebase Authentication
    ↓
Fetch User Profile from Firestore
    ↓
Check User Role & Permissions
    ↓
Grant Access to Application
```

---

## 2. User Roles & Permissions

### 2.1 Role Hierarchy
1. **Super Admin** (Highest Level)
   - Full system access
   - Can create/manage all users
   - Can delete any data
   - System configuration access
   - Access to all properties

2. **Admin**
   - Can create/manage users (except Super Admins)
   - Full access to assigned properties
   - Can manage leases, tenants, maintenance
   - Can view financial reports
   - Cannot delete system-critical data

3. **Property Manager**
   - Access to assigned properties only
   - Can manage maintenance tickets
   - Can view tenant information
   - Can view leases (read-only or limited edit)
   - Cannot access financial data (or limited view)

4. **Maintenance Staff**
   - Access to maintenance tickets only
   - Can update ticket status
   - Can add work notes
   - Cannot view financial or tenant personal data

5. **Viewer/Read-Only**
   - Read-only access to assigned properties
   - Can view reports and data
   - Cannot create or edit anything

### 2.2 Permission Matrix

| Feature | Super Admin | Admin | Property Manager | Maintenance | Viewer |
|---------|-------------|-------|----------------|-------------|--------|
| Create Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ✅ (except Super Admin) | ❌ | ❌ | ❌ |
| Manage Properties | ✅ | ✅ | ✅ (assigned) | ❌ | ❌ |
| Create Tickets | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Tickets | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| View Tenants | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Leases | ✅ | ✅ | ✅ (limited) | ❌ | ❌ |
| View Financials | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit Financials | ✅ | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Database Structure

### 3.1 Firestore Collections

#### `users` Collection
```javascript
{
  userId: "firebase-auth-uid",
  email: "user@example.com",
  displayName: "John Doe",
  role: "admin" | "property_manager" | "maintenance" | "viewer",
  createdAt: Timestamp,
  createdBy: "admin-user-id",
  lastLogin: Timestamp,
  isActive: boolean,
  assignedProperties: ["property-id-1", "property-id-2"],
  profile: {
    phone: string,
    title: string,
    department: string,
    notes: string
  },
  preferences: {
    defaultProperty: "property-id",
    notifications: {
      email: boolean,
      ticketUpdates: boolean,
      leaseExpirations: boolean
    }
  }
}
```

#### `userInvitations` Collection (for admin-created accounts)
```javascript
{
  invitationId: "auto-generated-id",
  email: "newuser@example.com",
  role: "property_manager",
  invitedBy: "admin-user-id",
  invitedAt: Timestamp,
  expiresAt: Timestamp,
  token: "unique-invitation-token",
  status: "pending" | "accepted" | "expired",
  assignedProperties: ["property-id-1"],
  acceptedAt: Timestamp,
  acceptedBy: "user-id" // null until accepted
}
```

---

## 4. User Registration Flows

### 4.1 Self-Registration Flow
1. User clicks "Sign Up" on landing page
2. User enters:
   - Email address
   - Password (with strength requirements)
   - Full Name
   - Optional: Phone number
3. System creates Firebase Auth account
4. System creates user document in Firestore with:
   - `role: "viewer"` (default, lowest permission)
   - `isActive: false` (requires admin approval)
   - `createdAt: now()`
5. Send welcome email with account pending approval message
6. Admin receives notification of new user registration
7. Admin approves/denies user
8. If approved, user receives activation email
9. User can now log in

### 4.2 Admin-Created Account Flow
1. Admin navigates to "User Management" page
2. Admin clicks "Invite User"
3. Admin enters:
   - Email address
   - Full Name
   - Role (dropdown)
   - Assigned Properties (multi-select)
   - Optional: Phone, Title, Department
4. System generates unique invitation token
5. System creates `userInvitations` document
6. System sends invitation email with:
   - Invitation link with token
   - Instructions to set up account
   - Expiration date (7 days default)
7. User clicks invitation link
8. User is taken to account setup page
9. User sets password
10. System creates Firebase Auth account
11. System creates user document in Firestore with admin-specified role
12. System updates invitation status to "accepted"
13. User is automatically logged in

### 4.3 Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

---

## 5. Login Flow

### 5.1 Standard Login
1. User navigates to login page (or from landing page)
2. User enters email and password
3. System authenticates with Firebase Auth
4. System fetches user profile from Firestore
5. System checks:
   - `isActive: true`
   - User role exists
   - Account not suspended
6. If valid, redirect to application dashboard
7. If invalid, show error message:
   - Invalid credentials
   - Account pending approval
   - Account suspended
   - Account not found

### 5.2 Session Management
- Firebase Auth handles session tokens
- Session persists across browser refreshes
- Auto-logout after 7 days of inactivity (configurable)
- "Remember Me" option extends session to 30 days

### 5.3 Password Reset Flow
1. User clicks "Forgot Password" on login page
2. User enters email address
3. Firebase sends password reset email
4. User clicks link in email
5. User sets new password
6. User is redirected to login page

---

## 6. User Management Interface

### 6.1 User Management Page (Admin Only)
**Location**: New "Users" tab in navigation (visible only to Admins/Super Admins)

**Features**:
- List of all users with:
  - Name, Email, Role
  - Status (Active/Inactive/Pending)
  - Last Login
  - Assigned Properties count
- Filters:
  - By role
  - By status
  - By property assignment
- Search by name/email
- Actions:
  - View user details
  - Edit user
  - Deactivate/Activate user
  - Resend invitation
  - Delete user (with confirmation)

### 6.2 User Detail Modal
**Shown when**: Admin clicks on a user or "View Details"

**Displays**:
- Basic Info:
  - Name, Email, Phone
  - Role, Status
  - Created Date, Last Login
- Assigned Properties (list with links)
- Activity Log (recent actions)
- Actions:
  - Edit User
  - Change Password (admin can reset)
  - Change Role
  - Assign/Unassign Properties
  - Deactivate/Activate

### 6.3 Create/Invite User Modal
**Shown when**: Admin clicks "Invite User" or "Create User"

**Form Fields**:
- Email* (required)
- Full Name* (required)
- Role* (required, dropdown)
- Phone (optional)
- Title (optional)
- Department (optional)
- Assigned Properties* (multi-select, required for non-Super Admin roles)
- Send Invitation Email (checkbox, default: checked)

**Validation**:
- Email format validation
- Email uniqueness check
- Role selection required
- At least one property for non-admin roles

---

## 7. UI/UX Components

### 7.1 Authentication Pages

#### Login Page
- Email input
- Password input
- "Remember Me" checkbox
- "Forgot Password?" link
- "Sign In" button
- "Don't have an account? Sign Up" link (if self-registration enabled)

#### Sign Up Page
- Email input
- Password input (with strength indicator)
- Confirm Password input
- Full Name input
- Phone input (optional)
- "Create Account" button
- "Already have an account? Sign In" link
- Terms of Service checkbox (if applicable)

#### Password Reset Page
- Email input
- "Send Reset Link" button
- Back to login link

#### Account Setup Page (for invitations)
- Email (pre-filled, read-only)
- Full Name (pre-filled if provided)
- Password input
- Confirm Password input
- "Complete Setup" button

### 7.2 Protected Routes
- All application pages require authentication
- Redirect to login if not authenticated
- Show appropriate error if user lacks permissions

### 7.3 User Profile Menu
**Location**: Top navigation bar (user's name/avatar)

**Dropdown Menu**:
- View Profile
- Account Settings
- Change Password
- Logout

---

## 8. Security Considerations

### 8.1 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && 
                    (request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin']);
      
      // Only admins can create/update users
      allow create, update: if request.auth != null && 
                              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
      
      // Only super admins can delete users
      allow delete: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    // User invitations
    match /userInvitations/{invitationId} {
      allow read: if request.auth != null && 
                    (resource.data.email == request.auth.token.email || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin']);
      
      allow create, update: if request.auth != null && 
                              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
    
    // Property data - role-based access
    match /properties/{propertyId} {
      allow read: if request.auth != null && 
                    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'] ||
                     propertyId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedProperties);
      
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin', 'property_manager'];
    }
    
    // Similar rules for other collections (leases, tenants, tickets, etc.)
  }
}
```

### 8.2 Client-Side Security
- Never store passwords in plain text
- Validate all inputs on client and server
- Use HTTPS for all communications
- Implement rate limiting on login attempts
- Log security events (failed logins, permission denials)

### 8.3 Password Security
- Enforce strong password requirements
- Hash passwords (Firebase handles this)
- Implement account lockout after 5 failed attempts (15-minute lockout)
- Require password change every 90 days (optional)

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Set up Firebase Authentication
- [x] Create basic login/signup pages
- [x] Implement email/password authentication
- [x] Create `users` collection structure
- [ ] Implement basic Firestore security rules
- [x] Add authentication state management in app.js
- [x] Create protected route wrapper

### Phase 2: User Management (Week 2)
- [ ] Create User Management page (admin only)
- [ ] Implement user list view with filters
- [ ] Create user detail modal
- [ ] Implement user creation/invitation flow
- [ ] Add email invitation system
- [ ] Implement user editing
- [ ] Add user activation/deactivation

### Phase 3: Role-Based Access (Week 3)
- [ ] Implement role checking throughout application
- [ ] Add property assignment system
- [ ] Update all pages to respect user permissions
- [ ] Hide/show UI elements based on role
- [ ] Implement property filtering based on assignments
- [ ] Add permission checks to all write operations

### Phase 4: Enhanced Features (Week 4)
- [ ] Add user profile page
- [ ] Implement password change functionality
- [ ] Add "Remember Me" functionality
- [ ] Implement session timeout
- [ ] Add activity logging
- [ ] Create user preferences system
- [ ] Add email notifications for user events

### Phase 5: Polish & Testing (Week 5)
- [ ] Comprehensive testing of all flows
- [ ] Security audit
- [ ] Performance optimization
- [ ] User documentation
- [ ] Admin training materials
- [ ] Bug fixes and refinements

---

## 10. Email Templates

### 10.1 Welcome Email (Self-Registration)
**Subject**: Welcome to Proppli - Account Pending Approval

**Content**:
- Welcome message
- Account is pending admin approval
- Expected approval timeframe
- Contact information for questions

### 10.2 Invitation Email
**Subject**: You've been invited to join Proppli

**Content**:
- Invitation message from admin
- Invitation link with token
- Expiration date
- Instructions for account setup
- Role and assigned properties information

### 10.3 Account Activated Email
**Subject**: Your Proppli account has been activated

**Content**:
- Account is now active
- Login link
- Getting started guide

### 10.4 Password Reset Email
**Subject**: Reset your Proppli password

**Content**:
- Password reset link
- Expiration time
- Security notice

---

## 11. User Profile & Settings

### 11.1 User Profile Page
**Accessible by**: All authenticated users

**Sections**:
- Personal Information (read-only for non-admins)
- Contact Information
- Preferences:
  - Default property selection
  - Notification preferences
  - Display preferences
- Security:
  - Change password
  - Two-factor authentication (future)
- Activity History (recent logins, actions)

### 11.2 Account Settings
- Email preferences
- Language selection (if multi-language support added)
- Theme preferences (if dark mode added)

---

## 12. Error Handling

### 12.1 Authentication Errors
- Invalid credentials → "Invalid email or password"
- Account not found → "No account found with this email"
- Account disabled → "Your account has been deactivated. Please contact an administrator."
- Email not verified → "Please verify your email address" (if email verification enabled)
- Too many attempts → "Too many login attempts. Please try again in 15 minutes."

### 12.2 Permission Errors
- Insufficient permissions → "You don't have permission to perform this action"
- Property access denied → "You don't have access to this property"

---

## 13. Future Enhancements

### 13.1 Additional Authentication Methods
- Google Sign-In
- Microsoft/Azure AD integration
- SSO (Single Sign-On) for enterprise customers

### 13.2 Advanced Features
- Two-factor authentication (2FA)
- Session management (view active sessions, logout from all devices)
- Audit logs for all user actions
- User groups/teams
- Custom roles with granular permissions
- API key management for integrations

---

## 14. Testing Checklist

### 14.1 Authentication Testing
- [ ] User can register new account
- [ ] User can log in with valid credentials
- [ ] User cannot log in with invalid credentials
- [ ] Password reset flow works
- [ ] Session persists across page refreshes
- [ ] User is logged out after session expires
- [ ] "Remember Me" extends session

### 14.2 User Management Testing
- [ ] Admin can create user invitations
- [ ] Invitation emails are sent
- [ ] Users can accept invitations
- [ ] Admin can edit user details
- [ ] Admin can change user roles
- [ ] Admin can assign/unassign properties
- [ ] Admin can deactivate users
- [ ] Deactivated users cannot log in

### 14.3 Permission Testing
- [ ] Each role has correct permissions
- [ ] Users can only access assigned properties
- [ ] UI elements hide/show based on role
- [ ] Write operations are blocked for unauthorized users
- [ ] Read operations respect property assignments

---

## 15. Migration Strategy

### 15.1 Existing Data
- No existing user accounts to migrate
- All users will be new registrations or admin-created

### 15.2 First Admin User
- Manual creation process:
  1. Create Firebase Auth account manually
  2. Create Firestore user document with `role: "super_admin"`
  3. This user can then create other admin accounts

---

## 16. Documentation Requirements

### 16.1 User Documentation
- How to create an account
- How to log in
- How to reset password
- How to accept an invitation
- How to update profile

### 16.2 Admin Documentation
- How to invite users
- How to manage users
- How to assign properties
- How to change user roles
- Best practices for user management

---

## 17. Success Metrics

### 17.1 Key Performance Indicators
- User registration completion rate
- Time to first login after invitation
- Failed login attempt rate
- User activation rate (admin approval)
- Average time for admin to approve new users

---

## Next Steps

1. **Review and Approve Plan**: Review this plan and provide feedback
2. **Prioritize Features**: Determine which features are MVP vs. nice-to-have
3. **Set Timeline**: Adjust implementation phases based on priorities
4. **Begin Phase 1**: Start with foundation authentication setup

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Author**: Proppli Development Team
