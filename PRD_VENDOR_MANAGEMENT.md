# Product Requirements Document: Vendor Management

## 1. Overview

### 1.1 Purpose
Introduce a vendor management area to track vendors and their employees, similar to tenant management. Admins and property managers should be able to create a vendor record and then assign employees with contact details to that vendor.

### 1.2 Goals
- Centralize vendor records and contacts in one place
- Make vendor contacts easy to find for maintenance and operations
- Support multiple employees per vendor with clear roles
- Keep workflows consistent with existing Tenants experience

### 1.3 Target Users
- Admins and Super Admins
- Property Managers
- Maintenance staff (read-only or limited)

---

## 2. Product Scope

### 2.1 In Scope
- Vendor list view with search/filter
- Vendor detail view with employee list
- Create/edit/deactivate vendors
- Create/edit/deactivate vendor employees
- Contact information for vendor and employees
- Link vendors to properties (optional, for filtering)
- Role-based access control consistent with existing Users system

### 2.2 Out of Scope (Initial Release)
- Vendor contracts, pricing, and invoices
- Vendor performance scoring
- Email/SMS notifications
- Advanced reporting and analytics
- File attachments (COIs, W-9s, etc.)

---

## 3. Functional Requirements

### 3.1 Vendor Management
**FR-1: Create Vendor**
- **Priority:** High
- **Description:** Users can create a vendor record.
- **Acceptance Criteria:**
  - "Add Vendor" action is available to permitted roles.
  - Required fields: Vendor Name, Vendor Type.
  - Optional fields: Primary Phone, Primary Email, Website, Notes, Address.
  - Vendor is saved in Firestore and appears in the vendor list.

**FR-2: View Vendor List**
- **Priority:** High
- **Description:** Users can browse and search vendors.
- **Acceptance Criteria:**
  - List shows vendor name, type, status, and primary contact info.
  - Search by vendor name, phone, or email.
  - Filter by status (active/inactive) and type.

**FR-3: Edit Vendor**
- **Priority:** High
- **Description:** Users can update vendor details.
- **Acceptance Criteria:**
  - Editable fields match creation fields.
  - Changes persist to Firestore and refresh in the list.

**FR-4: Deactivate Vendor**
- **Priority:** Medium
- **Description:** Users can deactivate a vendor without deleting records.
- **Acceptance Criteria:**
  - Status toggles to inactive and vendor is hidden by default.
  - Existing employee records remain accessible in vendor detail view.

### 3.2 Vendor Employees
**FR-5: Add Employee to Vendor**
- **Priority:** High
- **Description:** Users can add employees under a vendor.
- **Acceptance Criteria:**
  - Vendor detail page includes "Add Employee" action.
  - Required fields: Full Name.
  - Optional fields: Role/Title, Phone, Email, Emergency Contact, Notes.
  - Employee is linked to vendor and appears in vendor detail list.

**FR-6: Edit Employee**
- **Priority:** High
- **Description:** Users can update employee details.
- **Acceptance Criteria:**
  - Edit form updates Firestore and refreshes list.

**FR-7: Deactivate Employee**
- **Priority:** Medium
- **Description:** Users can deactivate an employee record.
- **Acceptance Criteria:**
  - Employee status changes to inactive and is hidden by default.
  - Record remains available for audit/history.

### 3.3 Property Assignment (Optional)
**FR-8: Assign Vendors to Properties**
- **Priority:** Medium
- **Description:** Vendors can be linked to one or more properties.
- **Acceptance Criteria:**
  - Vendor form allows selecting assigned properties.
  - Vendor list can filter by property.

---

## 4. Data Model

### 4.1 Vendor Schema (`vendors/{vendorId}`)
```javascript
{
  name: string, // required
  type: string, // required (e.g., HVAC, Plumbing, Electrical, Landscaping)
  status: "active" | "inactive",
  primaryPhone: string | null,
  primaryEmail: string | null,
  website: string | null,
  address: string | null,
  notes: string | null,
  assignedProperties: string[], // optional
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string | null
}
```

### 4.2 Vendor Employee Schema (`vendors/{vendorId}/employees/{employeeId}`)
```javascript
{
  vendorId: string, // reference to vendors/{vendorId}
  fullName: string, // required
  title: string | null,
  phone: string | null,
  email: string | null,
  emergencyContact: string | null,
  notes: string | null,
  status: "active" | "inactive",
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string | null
}
```

---

## 5. Permissions

### 5.1 Access Rules
- **Admin / Super Admin:** Full CRUD on vendors and employees.
- **Property Manager:** Full CRUD on vendors and employees for assigned properties (if property assignment is used). Otherwise full CRUD.
- **Maintenance:** Read-only access (can view vendors and employees).
- **Viewer:** Read-only access (can view vendors and employees).

---

## 6. UX / UI Notes

- Add "Vendors" to the sidebar navigation (near Tenants).
- Vendor list page mirrors Tenants layout with cards/table and search.
- Vendor detail page includes:
  - Vendor profile header
  - Employee list with add/edit actions
- Status badges for vendor and employee (Active/Inactive).

---

## 7. Non-Functional Requirements

- Must align with existing authentication and RBAC system
- Must follow date/time standard utilities
- Must handle empty states gracefully (no vendors, no employees)

---

## 8. Open Questions

- Should vendor employees be reusable across vendors (global contacts)?
- Do we require property assignment at creation?
- Should maintenance staff be able to edit vendor contact info?
