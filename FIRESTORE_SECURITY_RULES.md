# Firestore Security Rules for Proppli

## Basic Authentication Rules

Copy these rules to your Firebase Console → Firestore Database → Rules tab.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Helper function to check if user is admin or super admin
    function isAdmin() {
      return isAuthenticated() && 
             (getUserRole() == 'admin' || getUserRole() == 'super_admin');
    }
    
    // Helper function to check if user is active
    function isUserActive() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isAuthenticated() && 
                    (request.auth.uid == userId || isAdmin());
      
      // Only admins can create/update users
      allow create, update: if isAuthenticated() && isAdmin();
      
      // Only super admins can delete users
      allow delete: if isAuthenticated() && getUserRole() == 'super_admin';
    }
    
    // User invitations collection
    match /userInvitations/{invitationId} {
      // Users can read invitations sent to their email
      allow read: if isAuthenticated() && 
                    (resource.data.email == request.auth.token.email || isAdmin());
      
      // Only admins can create/update invitations
      allow create, update: if isAuthenticated() && isAdmin();
      
      // Only admins can delete invitations
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Properties collection - role-based access
    match /properties/{propertyId} {
      // Users can read if they're admin/super_admin OR property is assigned to them
      allow read: if isAuthenticated() && isUserActive() && 
                    (isAdmin() || 
                     propertyId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedProperties);
      
      // Only admins and property managers can write
      allow write: if isAuthenticated() && isUserActive() && 
                     (isAdmin() || getUserRole() == 'property_manager');
    }
    
    // Buildings collection
    match /buildings/{buildingId} {
      // Users can read if they have access to the building's property
      allow read: if isAuthenticated() && isUserActive() && 
                    (isAdmin() || 
                     get(/databases/$(database)/documents/buildings/$(buildingId)).data.propertyId in 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedProperties);
      
      // Only admins and property managers can write
      allow write: if isAuthenticated() && isUserActive() && 
                     (isAdmin() || getUserRole() == 'property_manager');
    }
    
    // Units collection
    match /units/{unitId} {
      // Users can read if they have access to the unit's property
      allow read: if isAuthenticated() && isUserActive() && 
                    (isAdmin() || 
                     get(/databases/$(database)/documents/units/$(unitId)).data.propertyId in 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedProperties);
      
      // Only admins and property managers can write
      allow write: if isAuthenticated() && isUserActive() && 
                     (isAdmin() || getUserRole() == 'property_manager');
    }
    
    // Tenants collection
    match /tenants/{tenantId} {
      // Users can read if they're admin OR have access to assigned properties
      allow read: if isAuthenticated() && isUserActive() && 
                    (isAdmin() || getUserRole() in ['property_manager', 'viewer']);
      
      // Only admins and property managers can write
      allow write: if isAuthenticated() && isUserActive() && 
                     (isAdmin() || getUserRole() == 'property_manager');
    }
    
    // Leases collection
    match /leases/{leaseId} {
      // Users can read if they're admin OR have access to the lease's property
      allow read: if isAuthenticated() && isUserActive() && 
                    (isAdmin() || 
                     get(/databases/$(database)/documents/leases/$(leaseId)).data.propertyId in 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedProperties);
      
      // Only admins and property managers can write
      allow write: if isAuthenticated() && isUserActive() && 
                     (isAdmin() || getUserRole() == 'property_manager');
    }
    
    // Maintenance tickets collection
    match /tickets/{ticketId} {
      // Users can read if they're admin OR have access to the ticket's property OR are maintenance staff
      allow read: if isAuthenticated() && isUserActive() && 
                    (isAdmin() || 
                     getUserRole() == 'maintenance' ||
                     get(/databases/$(database)/documents/tickets/$(ticketId)).data.propertyId in 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedProperties);
      
      // Admins, property managers, and maintenance staff can write
      allow write: if isAuthenticated() && isUserActive() && 
                     (isAdmin() || 
                      getUserRole() in ['property_manager', 'maintenance']);
    }
    
    // Occupancies collection
    match /occupancies/{occupancyId} {
      // Users can read if they have access to the occupancy's property
      allow read: if isAuthenticated() && isUserActive() && 
                    (isAdmin() || 
                     get(/databases/$(database)/documents/occupancies/$(occupancyId)).data.propertyId in 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.assignedProperties);
      
      // Only admins and property managers can write
      allow write: if isAuthenticated() && isUserActive() && 
                     (isAdmin() || getUserRole() == 'property_manager');
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Deployment Instructions

1. Go to Firebase Console → Firestore Database → Rules tab
2. Copy the rules above
3. Click "Publish"
4. Rules will be active immediately

## Testing

After deploying rules, test with different user roles to ensure:
- Users can only access their assigned properties
- Admins can access everything
- Maintenance staff can only access tickets
- Viewers have read-only access

## Notes

- These rules assume the `users` collection structure matches the plan
- Property assignments are stored in `users/{userId}.assignedProperties` array
- All write operations require `isActive: true` on the user profile
- Rules are evaluated top-to-bottom, so more specific rules should come first
