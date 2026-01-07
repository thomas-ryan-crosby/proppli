# Phase 1 PRD: Enhanced Property Profiles & Basic Tenant Management

**Version:** 1.0  
**Date:** 2024  
**Status:** Ready for Development  
**Priority:** Critical

---

## 1. Executive Summary

This document details the requirements for Phase 1 of the Property Management Platform expansion, focusing on enhanced property profiles and basic tenant management. This phase establishes the foundation for all future features by creating comprehensive property and tenant data models.

---

## 2. Objectives

### 2.1 Primary Goals
- Enhance property management with detailed property profiles
- Implement unit/space management for multi-unit properties
- Create a tenant database with contact management
- Establish tenant-property associations
- Enable basic user authentication and permissions

### 2.2 Success Criteria
- All properties have detailed profiles with essential information
- Unit inventory can be managed for multi-unit properties
- Tenant records can be created and linked to properties/units
- Users can authenticate and access the system based on roles
- Data model supports future lease and financial features

---

## 3. Enhanced Property Management

### 3.1 Property Profiles

#### 3.1.1 Property Information Fields

**Required Fields:**
- Property Name (existing)
- Property Address (existing)
- Property Type (existing: commercial, hoa, residential)
- Property Description (existing)

**New Required Fields:**
- Square Footage (number)
- Year Built (number)
- Number of Units/Spaces (number)
- Property Status (dropdown: Active, Inactive, Under Development)

**New Optional Fields:**
- Lot Size (number, acres or square feet)
- Number of Floors/Stories (number)
- Parking Spaces (number)
- Property Tax ID/Assessor Parcel Number (text)
- Property Owner Name (text)
- Property Owner Contact (text)

**Commercial-Specific Fields (shown only for commercial properties):**
- Building Number (existing in tickets, now at property level)
- Number of Buildings (number)
- Total Leasable Square Footage (number)
- Common Area Square Footage (number)

**Residential-Specific Fields (shown only for residential properties):**
- Number of Bedrooms (number, for single-family)
- Number of Bathrooms (number, for single-family)
- Property Subtype (dropdown: Single-Family, Multi-Family, Apartment Complex, Condo)

#### 3.1.2 Property Hierarchy

**Structure:**
- Portfolio (optional top level - for future)
- Property (current level)
- Building (for commercial/multi-building properties)
- Unit/Space (for multi-unit properties)

**Building Management:**
- Buildings can be added to properties
- Each building has:
  - Building Name/Number (text, required)
  - Building Address (text, optional - defaults to property address)
  - Number of Floors (number, optional)
  - Number of Units (number, optional)

#### 3.1.3 Property Status Tracking
- Active: Property is operational and being managed
- Inactive: Property is not currently being managed
- Under Development: Property is being developed/renovated

### 3.2 Unit/Space Management

#### 3.2.1 Unit Inventory

**Unit Fields:**
- Unit Number/Identifier (text, required) - e.g., "101", "Suite A", "Unit 1A"
- Unit Type (dropdown: Apartment, Office, Retail, Storage, Parking, Other)
- Square Footage (number, optional)
- Number of Bedrooms (number, for residential units)
- Number of Bathrooms (number, for residential units)
- Unit Status (dropdown: Occupied, Vacant, Maintenance, Reserved, Not Available)
- Building Association (dropdown, if property has multiple buildings)
- Floor Number (number, optional)
- Monthly Rent/Base Rate (number, optional - for quick reference)

**Unit Status Definitions:**
- **Occupied:** Currently leased/occupied by a tenant
- **Vacant:** Available for lease
- **Maintenance:** Under maintenance/repair, not available
- **Reserved:** Reserved for a specific tenant (lease pending)
- **Not Available:** Not available for lease (owner use, etc.)

#### 3.2.2 Unit Features (Optional)
- Amenities checklist (checkbox list):
  - Balcony/Patio
  - Parking Included
  - Storage Included
  - Washer/Dryer
  - Dishwasher
  - Air Conditioning
  - Heating
  - Fireplace
  - Hardwood Floors
  - Carpet
  - Updated Kitchen
  - Updated Bathroom
  - Other (text field)

#### 3.2.3 Unit History
- Track unit status changes over time
- Display current and past tenants
- Maintenance history (linked to work orders)

---

## 4. Basic Tenant Management

### 4.1 Tenant Database

#### 4.1.1 Tenant Information

**Required Fields:**
- Tenant Name (text) - Company name for commercial, individual name for residential
- Tenant Type (dropdown: Commercial, Residential)
- Tenant Status (dropdown: Active, Past, Prospect)
- Primary Contact Email (email)
- Primary Contact Phone (text)

**Optional Fields:**
- Secondary Contact Name (text)
- Secondary Contact Email (email)
- Secondary Contact Phone (text)
- Mailing Address (text) - if different from property address
- Tax ID/EIN (text) - for commercial tenants
- Notes (textarea) - general notes about the tenant

**Commercial Tenant Specific Fields:**
- Business Type/Industry (text)
- Number of Employees (number)
- Website (url)

**Residential Tenant Specific Fields:**
- Date of Birth (date, optional)
- Emergency Contact Name (text)
- Emergency Contact Phone (text)
- Emergency Contact Relationship (text)

#### 4.1.2 Tenant Status

**Status Definitions:**
- **Active:** Currently has an active lease/occupancy
- **Past:** Previously occupied but no longer active
- **Prospect:** Potential tenant (lead/applicant)

#### 4.1.3 Tenant Contact Management
- Primary and secondary contacts
- Contact history (future: communication log)
- Preferred contact method
- Contact notes

### 4.2 Tenant-Property Association

#### 4.2.1 Occupancy Linking
- Link tenant to specific property
- Link tenant to specific unit/space (if property has units)
- Support multiple tenants per unit (roommates, co-tenants)
- Support tenant with multiple units (commercial expansion)

#### 4.2.2 Occupancy History
- Track move-in dates
- Track move-out dates
- Display current occupancy
- Display past occupancies
- Occupancy timeline view

#### 4.2.3 Occupancy Details
- Move-in Date (date)
- Move-out Date (date, optional if active)
- Occupancy Status (Active, Past, Pending)
- Notes (textarea) - occupancy-specific notes

---

## 5. User Management & Permissions

### 5.1 User Authentication

#### 5.1.1 User Registration
- Email-based registration
- Password requirements (minimum 8 characters)
- Email verification
- Account activation workflow

#### 5.1.2 User Login
- Email/password authentication
- "Remember me" functionality
- Password reset functionality
- Session management

### 5.2 Role Definitions

#### 5.2.1 User Roles

**Admin:**
- Full system access
- Can manage all properties
- Can manage all tenants
- Can manage users and permissions
- Can access all features

**Property Manager:**
- Can manage assigned properties
- Can create/edit tenants
- Can create/edit work orders
- Can view financial information
- Cannot manage users

**Maintenance Staff:**
- Can view assigned properties
- Can create/edit work orders
- Can view tenant information (limited)
- Cannot edit property/tenant details
- Cannot access financial information

**Tenant (Future - Phase 9):**
- Can view own information
- Can submit maintenance requests
- Can view own documents
- Limited access

#### 5.2.2 Permission Framework
- Role-based access control (RBAC)
- Property-level permissions
- Feature-level permissions
- Permission inheritance

### 5.3 Organization Structure

#### 5.3.1 Multi-Organization Support
- Users belong to an organization
- Properties belong to an organization
- Data isolation between organizations
- Organization admin role

#### 5.3.2 Team Management
- Users can be assigned to teams
- Teams can be assigned to properties
- Team-based permissions

---

## 6. User Interface Requirements

### 6.1 Property Management UI

#### 6.1.1 Property List/View
- Enhanced property cards showing key information
- Property status indicators
- Quick actions (edit, view units, view tenants)
- Filter by property type, status
- Search functionality

#### 6.1.2 Property Detail View
- Comprehensive property information display
- Building list (if applicable)
- Unit list (if applicable)
- Associated tenants
- Property history/timeline

#### 6.1.3 Property Form
- Enhanced property creation/edit form
- Conditional fields based on property type
- Building management section
- Unit management section
- Form validation

### 6.2 Unit Management UI

#### 6.2.1 Unit List View
- Grid/list view of units
- Filter by status, building, type
- Quick status update
- Unit details modal/card

#### 6.2.2 Unit Detail View
- Complete unit information
- Current tenant information
- Unit history
- Associated work orders
- Quick actions

#### 6.2.3 Unit Form
- Unit creation/edit form
- Status management
- Feature selection
- Building association

### 6.3 Tenant Management UI

#### 6.3.1 Tenant List View
- Tenant directory/list
- Filter by status, type, property
- Search by name, email, phone
- Quick actions (edit, view property, view history)

#### 6.3.2 Tenant Detail View
- Complete tenant profile
- Contact information
- Current occupancies
- Occupancy history
- Associated work orders
- Notes and communication history

#### 6.3.3 Tenant Form
- Tenant creation/edit form
- Conditional fields based on tenant type
- Property/unit association
- Contact management
- Status management

### 6.4 User Management UI

#### 6.4.1 User List View
- List of all users in organization
- User roles and status
- Last login information
- Quick actions

#### 6.4.2 User Form
- User creation/edit
- Role assignment
- Property assignments
- Permission management

---

## 7. Data Model

### 7.1 Property Schema (Enhanced)

```javascript
{
  id: string,
  name: string,
  address: string,
  propertyType: 'commercial' | 'hoa' | 'residential',
  description: string,
  squareFootage: number,
  yearBuilt: number,
  numberOfUnits: number,
  status: 'Active' | 'Inactive' | 'Under Development',
  lotSize: number | null,
  numberOfFloors: number | null,
  parkingSpaces: number | null,
  taxId: string | null,
  ownerName: string | null,
  ownerContact: string | null,
  // Commercial specific
  buildingNumber: string | null,
  numberOfBuildings: number | null,
  totalLeasableSqFt: number | null,
  commonAreaSqFt: number | null,
  // Residential specific
  numberOfBedrooms: number | null,
  numberOfBathrooms: number | null,
  propertySubtype: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 7.2 Building Schema

```javascript
{
  id: string,
  propertyId: string,
  buildingName: string,
  buildingAddress: string | null,
  numberOfFloors: number | null,
  numberOfUnits: number | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 7.3 Unit Schema

```javascript
{
  id: string,
  propertyId: string,
  buildingId: string | null,
  unitNumber: string,
  unitType: 'Apartment' | 'Office' | 'Retail' | 'Storage' | 'Parking' | 'Other',
  squareFootage: number | null,
  numberOfBedrooms: number | null,
  numberOfBathrooms: number | null,
  floorNumber: number | null,
  status: 'Occupied' | 'Vacant' | 'Maintenance' | 'Reserved' | 'Not Available',
  monthlyRent: number | null,
  amenities: string[], // Array of amenity strings
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 7.4 Tenant Schema

```javascript
{
  id: string,
  tenantName: string,
  tenantType: 'Commercial' | 'Residential',
  status: 'Active' | 'Past' | 'Prospect',
  primaryContactEmail: string,
  primaryContactPhone: string,
  secondaryContactName: string | null,
  secondaryContactEmail: string | null,
  secondaryContactPhone: string | null,
  mailingAddress: string | null,
  taxId: string | null, // Commercial
  notes: string | null,
  // Commercial specific
  businessType: string | null,
  numberOfEmployees: number | null,
  website: string | null,
  // Residential specific
  dateOfBirth: timestamp | null,
  emergencyContactName: string | null,
  emergencyContactPhone: string | null,
  emergencyContactRelationship: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  organizationId: string
}
```

### 7.5 Occupancy Schema

```javascript
{
  id: string,
  tenantId: string,
  propertyId: string,
  unitId: string | null, // null if property has no units
  moveInDate: timestamp,
  moveOutDate: timestamp | null,
  status: 'Active' | 'Past' | 'Pending',
  notes: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 7.6 User Schema

```javascript
{
  id: string,
  email: string,
  displayName: string,
  role: 'Admin' | 'PropertyManager' | 'Maintenance' | 'Tenant',
  organizationId: string,
  assignedProperties: string[], // Array of property IDs
  isActive: boolean,
  lastLogin: timestamp | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 8. Functional Requirements

### 8.1 Property Management

**FR-P1.1: Create Enhanced Property**
- User can create a property with all required fields
- Property type determines which fields are shown
- Form validates required fields
- Property is saved to database with organization association

**FR-P1.2: Edit Property**
- User can edit existing property information
- All fields are editable (based on permissions)
- Changes are saved and timestamped
- Property history is maintained

**FR-P1.3: View Property Details**
- User can view complete property information
- Property displays associated buildings (if any)
- Property displays associated units (if any)
- Property displays associated tenants
- Property displays work order summary

**FR-P1.4: Manage Buildings**
- User can add buildings to a property
- User can edit building information
- User can delete buildings (with validation)
- Building list displays on property detail view

**FR-P1.5: Manage Units**
- User can add units to a property
- User can edit unit information
- User can update unit status
- User can delete units (with validation)
- Unit list displays on property detail view
- Units can be filtered by status, building, type

### 8.2 Tenant Management

**FR-T1.1: Create Tenant**
- User can create a tenant record
- Tenant type determines which fields are shown
- Form validates required fields
- Tenant is saved to database with organization association

**FR-T1.2: Edit Tenant**
- User can edit existing tenant information
- All fields are editable (based on permissions)
- Changes are saved and timestamped
- Tenant history is maintained

**FR-T1.3: View Tenant Details**
- User can view complete tenant profile
- Tenant displays current occupancies
- Tenant displays occupancy history
- Tenant displays associated work orders
- Tenant displays notes and communication

**FR-T1.4: Link Tenant to Property/Unit**
- User can create occupancy record
- User can link tenant to property
- User can link tenant to specific unit (if applicable)
- Multiple tenants can be linked to same unit
- Occupancy status is tracked

**FR-T1.5: Manage Occupancy**
- User can set move-in date
- User can set move-out date
- System updates unit status based on occupancy
- Occupancy history is maintained

### 8.3 User Management

**FR-U1.1: User Registration**
- New users can register with email and password
- Email verification is required
- User is assigned to organization
- Default role is assigned

**FR-U1.2: User Login**
- Users can log in with email and password
- Session is maintained
- Last login is tracked
- Failed login attempts are logged

**FR-U1.3: User Profile Management**
- Users can view their profile
- Users can update their information
- Users can change password
- Users can view their permissions

**FR-U1.4: Role Management (Admin Only)**
- Admin can assign roles to users
- Admin can assign properties to users
- Admin can activate/deactivate users
- Permission changes take effect immediately

---

## 9. Technical Requirements

### 9.1 Database
- Firestore collections: `properties`, `buildings`, `units`, `tenants`, `occupancies`, `users`
- Proper indexing for queries
- Data validation rules
- Organization-level data isolation

### 9.2 Authentication
- Firebase Authentication integration
- Email/password authentication
- Session management
- Password reset functionality

### 9.3 Security
- Role-based access control
- Property-level permissions
- Data isolation by organization
- Secure API endpoints

### 9.4 Performance
- Efficient queries with proper indexes
- Pagination for large lists
- Lazy loading where appropriate
- Optimistic UI updates

---

## 10. User Stories

### 10.1 Property Management

**US-P1:** As a property manager, I want to create a detailed property profile so that I have all property information in one place.

**US-P2:** As a property manager, I want to add buildings to a property so that I can manage multi-building properties.

**US-P3:** As a property manager, I want to create and manage units so that I can track individual spaces within a property.

**US-P4:** As a property manager, I want to update unit status so that I know which units are available for lease.

**US-P5:** As a property manager, I want to view all units for a property so that I can see the complete unit inventory.

### 10.2 Tenant Management

**US-T1:** As a property manager, I want to create tenant records so that I have contact information for all tenants.

**US-T2:** As a property manager, I want to link tenants to properties/units so that I know who occupies which space.

**US-T3:** As a property manager, I want to view tenant occupancy history so that I can see past and current occupancies.

**US-T4:** As a property manager, I want to search for tenants so that I can quickly find tenant information.

**US-T5:** As a property manager, I want to update tenant status so that I can track active, past, and prospect tenants.

### 10.3 User Management

**US-U1:** As a system admin, I want to create user accounts so that team members can access the system.

**US-U2:** As a system admin, I want to assign roles to users so that users have appropriate permissions.

**US-U3:** As a user, I want to log in to the system so that I can access my assigned properties and features.

**US-U4:** As a user, I want to view my profile so that I can see my role and permissions.

---

## 11. Acceptance Criteria

### 11.1 Property Management
- ✅ Property can be created with all required fields
- ✅ Property type determines visible fields
- ✅ Buildings can be added to properties
- ✅ Units can be added to properties
- ✅ Unit status can be updated
- ✅ Property detail view shows all associated data

### 11.2 Tenant Management
- ✅ Tenant can be created with all required fields
- ✅ Tenant type determines visible fields
- ✅ Tenant can be linked to property/unit
- ✅ Occupancy history is tracked
- ✅ Tenant detail view shows all associated data

### 11.3 User Management
- ✅ Users can register and log in
- ✅ Roles are enforced
- ✅ Permissions control access
- ✅ Organization data is isolated

---

## 12. Out of Scope (Phase 1)

- Property photos and documents (marked not necessary)
- Property-specific settings and configurations (marked not necessary)
- Detailed unit features/layout (deferred)
- Advanced search and filtering
- Bulk import/export
- Tenant portal features
- Communication history
- Document management
- Financial features
- Lease management

---

## 13. Implementation Notes

### 13.1 Data Migration
- Existing properties need to be enhanced with new fields
- Default values for new required fields
- Backward compatibility with existing data

### 13.2 UI/UX Considerations
- Maintain consistency with existing design
- Responsive design for mobile access
- Clear navigation between related entities
- Intuitive forms with helpful validation messages

### 13.3 Testing Requirements
- Unit tests for data models
- Integration tests for CRUD operations
- User acceptance testing
- Permission testing

---

## 14. Success Metrics

- 100% of properties have enhanced profiles
- All multi-unit properties have unit inventory
- 90% of tenants have records in system
- 100% of active occupancies are linked
- User authentication working for all user types
- Role-based permissions enforced

---

## 15. Next Steps

1. **Technical Design:** Create detailed technical specifications
2. **Database Schema:** Finalize Firestore collections and indexes
3. **UI Mockups:** Create wireframes for new interfaces
4. **Development:** Begin implementation
5. **Testing:** User acceptance testing
6. **Deployment:** Roll out Phase 1 features

---

**Note:** This PRD focuses on the core features needed for property profiles and tenant management. Additional features can be added in future iterations based on user feedback and priorities.

