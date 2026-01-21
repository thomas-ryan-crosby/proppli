# Product Requirements Document: Projects Center
**Version:** 0.1  
**Status:** Draft  
**Last Updated:** 2026-01-21  

---

## 1. Overview

### 1.1 Purpose
Add a new **Projects Center** to manage capital projects (e.g., commercial renovations, major repairs, improvements) from initial planning through completion. This enables tracking of project budgets, subcontractor invoices, change orders, and project closeout documentation in a centralized location.

### 1.2 Goals
- Provide a single place to **create, track, and manage** capital projects per property.
- Enable **budget tracking** by aggregating subcontractor invoices and change orders.
- Support **project lifecycle management** (Planning → In Progress → Closed).
- Generate and store **change orders** during the in-progress phase.
- Maintain **complete project history** including all invoices, change orders, and documentation.
- Keep the UI aligned with Proppli's existing patterns (table layouts, modals, filters).

### 1.3 Non-Goals (Initial Release)
- Project scheduling/Gantt charts.
- Automated budget alerts or notifications.
- Integration with external accounting systems.
- Project templates or project type libraries.
- Multi-phase project breakdowns (sub-projects).
- Resource allocation and team management.
- Mobile field project management.

### 1.4 Target Users
- **Property Manager** (`property_manager`): create/manage projects for assigned properties.
- **Admin / Super Admin**: manage projects across all properties.
- **Viewer** (`viewer`): read-only visibility (optional).
- **Maintenance** (`maintenance`): read-only access to projects for assigned properties (optional).

---

## 2. User Experience

### 2.1 Navigation & Placement
- Add a new top-level navigation item: **"Projects"** (or "Projects Center").
- The page must respect the existing **property selector** pattern (assigned-property access for Property Manager/Maintenance roles).

### 2.2 Primary Screen (Projects List)
**Layout**
- Header: "Projects Center"
- Filters:
  - Property (dropdown; defaults to current property context if one is selected)
  - Status (All, Planning, In Progress, Closed)
  - Project Type (dropdown; e.g., Renovation, Repair, Improvement, Other)
  - Date range (start date or completion date)
  - Search (project name, description, notes)
- Primary action: **Add Project**

**List View**
- Table layout (consistent with finance/inspection reports patterns):
  - Project Name
  - Property
  - Type
  - Status badge (Planning / In Progress / Closed)
  - Start Date
  - Budget (original budget + change orders)
  - Actual Cost (sum of all invoices)
  - Variance (budget - actual)
  - Actions: View, Edit, Close Project (if in progress), Delete (if planning)

### 2.3 Add/Edit Project (Modal)
**Fields:**
- **Project Name** (required)
- **Property** (required; dropdown)
- **Project Type** (required; dropdown: Renovation, Repair, Improvement, Other)
- **Status** (required; Planning, In Progress, Closed)
- **Start Date** (required)
- **Target Completion Date** (optional)
- **Original Budget** (required; number)
- **Description** (optional; textarea)
- **Notes** (optional; textarea)

**Behavior:**
- Status defaults to "Planning" for new projects.
- Once status is set to "In Progress", change order functionality becomes available.
- Once status is set to "Closed", editing is limited (read-only or restricted fields).

### 2.4 Project Detail View (Modal/Page)
**Tabs or Sections:**
1. **Overview**: Project metadata, dates, budget summary
2. **Invoices**: List of subcontractor invoices linked to this project
3. **Change Orders**: List of change orders (only visible if status is "In Progress" or "Closed")
4. **Documents**: File attachments (contracts, permits, photos, etc.)

**Overview Tab:**
- Project information (all fields from Add/Edit form)
- Budget Summary:
  - Original Budget
  - Total Change Orders (sum of all change order amounts)
  - Revised Budget (original + change orders)
  - Total Invoiced (sum of all invoice amounts)
  - Remaining Budget (revised budget - total invoiced)
  - Variance (revised budget - total invoiced)

**Invoices Tab:**
- Table of invoices linked to this project
- Columns: Invoice #, Vendor, Date, Amount, Status, Actions (View, Edit, Delete)
- Action: **Add Invoice** (opens invoice form with project pre-selected)
- Invoices can be added from the Finance → Invoices section (with project selection) OR from the project detail view.

**Change Orders Tab:**
- Table of change orders
- Columns: Change Order #, Date, Description, Amount, Status (Pending/Approved/Rejected), Actions (View, Edit, Delete, Approve/Reject)
- Action: **Add Change Order** (opens change order form)
- Only visible/editable when project status is "In Progress" or "Closed".

**Documents Tab:**
- File upload area (drag & drop)
- List of uploaded documents with preview/download/delete
- Document types: Contracts, Permits, Photos, Other

### 2.5 Add/Edit Invoice (from Project Context)
- Similar to Finance → Invoices form, but:
  - Project field is pre-populated and required
  - Invoice is automatically linked to the project
  - Invoice can still be assigned cost codes (for accounting)

### 2.6 Add/Edit Change Order (Modal)
**Fields:**
- **Change Order #** (auto-generated or manual; required)
- **Date** (required)
- **Description** (required; textarea)
- **Amount** (required; number; can be positive or negative)
- **Status** (required; Pending, Approved, Rejected)
- **Approved By** (optional; user dropdown; auto-populated when status changes to Approved)
- **Approval Date** (optional; auto-populated)
- **Notes** (optional; textarea)

**Behavior:**
- Change orders can only be added when project status is "In Progress".
- Only approved change orders affect the revised budget calculation.
- Change order amounts can be negative (reductions).

### 2.7 Close Project
- Action available when status is "In Progress".
- Confirmation dialog required.
- Upon closing:
  - Status changes to "Closed".
  - Project becomes read-only (or limited editing).
  - Final budget summary is locked.
  - All invoices and change orders are finalized.

---

## 3. Functional Requirements

### FR-PC-1: Create Project
- **Priority:** High
- **Acceptance Criteria:**
  - Users can create a new project with required fields (name, property, type, start date, original budget).
  - Project is saved in Firestore with status "Planning".
  - Project appears in the projects list immediately.

### FR-PC-2: View Projects List
- **Priority:** High
- **Acceptance Criteria:**
  - Users can view projects for properties they have access to.
  - List shows key project information (name, property, status, budget, actual cost, variance).
  - Filters work correctly (property, status, type, date range, search).
  - Default sort: most recent start date first.

### FR-PC-3: Edit Project
- **Priority:** High
- **Acceptance Criteria:**
  - Authorized users can edit project fields.
  - Status transitions are validated (Planning → In Progress → Closed).
  - Changes persist to Firestore and refresh in the list.

### FR-PC-4: Link Invoices to Project
- **Priority:** High
- **Acceptance Criteria:**
  - Invoices can be linked to a project (from Finance → Invoices OR from Project Detail → Invoices tab).
  - Project field is available in invoice form (dropdown of active projects).
  - Invoices linked to a project are aggregated in project budget calculations.
  - Invoices can be unlinked from a project (set project field to empty).

### FR-PC-5: Create Change Order
- **Priority:** High
- **Acceptance Criteria:**
  - Change orders can only be created when project status is "In Progress" or "Closed".
  - Change order form includes all required fields.
  - Change order is saved in Firestore as a subcollection of the project.
  - Approved change orders update the project's revised budget calculation.

### FR-PC-6: Approve/Reject Change Order
- **Priority:** High
- **Acceptance Criteria:**
  - Authorized users can approve or reject change orders.
  - Approval updates status, approved by, and approval date.
  - Only approved change orders affect budget calculations.
  - Rejected change orders do not affect budget.

### FR-PC-7: Budget Calculations
- **Priority:** High
- **Acceptance Criteria:**
  - Original Budget: from project field.
  - Total Change Orders: sum of all approved change order amounts.
  - Revised Budget: original budget + total change orders.
  - Total Invoiced: sum of all invoice amounts linked to the project.
  - Remaining Budget: revised budget - total invoiced.
  - Variance: revised budget - total invoiced (shown as positive/negative).
  - Calculations update in real-time as invoices and change orders are added/modified.

### FR-PC-8: Close Project
- **Priority:** Medium
- **Acceptance Criteria:**
  - Users can close a project when status is "In Progress".
  - Confirmation dialog prevents accidental closure.
  - Closing sets status to "Closed" and limits further editing.
  - Final budget summary is preserved.

### FR-PC-9: Upload Project Documents
- **Priority:** Medium
- **Acceptance Criteria:**
  - Users can upload multiple files (PDFs, images, Word docs) to a project.
  - Files are stored in Firebase Storage.
  - Files can be previewed, downloaded, and deleted.
  - File metadata (name, upload date, uploaded by) is tracked.

### FR-PC-10: Delete Project
- **Priority:** Low
- **Acceptance Criteria:**
  - Authorized users can delete projects (with confirmation).
  - Deletion removes the project document and attempts to delete associated Storage files.
  - Linked invoices remain but project reference is cleared (or invoices are unlinked).

---

## 4. Permissions & Security

### 4.1 UI Permissions
- **Admin / Super Admin / Property Manager**: full CRUD on projects for accessible properties.
- **Viewer**: read-only access.
- **Maintenance**: read-only access to projects for assigned properties (optional).

### 4.2 Firestore Rules (Target)
New collection `projects`:
- **read**: authenticated active users with roles allowed to access Projects features, subject to assigned property checks where applicable.
- **write**: roles allowed to create/update/delete (admin/super_admin/property_manager).

Subcollection `projects/{projectId}/changeOrders`:
- **read**: same as projects read rules.
- **write**: same as projects write rules.

### 4.3 Storage Rules (Target)
Store files in:
- `projects/{projectId}/documents/{timestamp}_{filename}`
Rules should mirror Firestore permissions.

### 4.4 Invoice-Project Linkage
- Invoices collection should include optional `projectId` field.
- Invoice form should allow selecting a project (dropdown of active projects).
- Invoice list/filters should allow filtering by project.

---

## 5. Data Model

### 5.1 Firestore: `projects`
```js
{
  projectName: string,              // required
  propertyId: string,               // required
  propertyName: string,             // denormalized for display
  projectType: string,              // required (Renovation, Repair, Improvement, Other)
  status: string,                   // required (Planning, In Progress, Closed)
  startDate: Timestamp,            // required
  targetCompletionDate: Timestamp|null, // optional
  originalBudget: number,           // required
  description: string|null,         // optional
  notes: string|null,               // optional
  createdAt: Timestamp,
  createdBy: string|null,           // auth uid
  updatedAt: Timestamp,
  updatedBy: string|null,
  closedAt: Timestamp|null,        // set when status changes to Closed
  closedBy: string|null
}
```

### 5.2 Firestore: `projects/{projectId}/changeOrders`
```js
{
  changeOrderNumber: string,        // required (auto-generated or manual)
  date: Timestamp,                 // required
  description: string,              // required
  amount: number,                   // required (can be negative)
  status: string,                   // required (Pending, Approved, Rejected)
  approvedBy: string|null,         // auth uid
  approvalDate: Timestamp|null,
  notes: string|null,              // optional
  createdAt: Timestamp,
  createdBy: string|null,
  updatedAt: Timestamp,
  updatedBy: string|null
}
```

### 5.3 Firestore: `projects/{projectId}/documents`
```js
{
  fileName: string,                 // required
  fileUrl: string,                  // required
  storagePath: string,              // required
  fileType: string|null,            // optional (mime type)
  uploadedAt: Timestamp,
  uploadedBy: string|null           // auth uid
}
```

### 5.4 Firestore: `invoices` (modification)
Add optional field:
```js
{
  // ... existing invoice fields ...
  projectId: string|null,           // optional reference to projects/{projectId}
  projectName: string|null          // denormalized for display
}
```

---

## 6. UX Requirements
- Use table layout with consistent styling (see `STYLE_GUIDE.md`).
- Primary action: "Add Project".
- Clear empty states:
  - "No projects found for this property."
  - CTA button visible if user can add.
- Status badges: Planning (gray), In Progress (blue), Closed (green).
- Budget variance display: positive (green), negative/over budget (red).
- Change order status badges: Pending (yellow), Approved (green), Rejected (red).
- Modal-based forms for add/edit (consistent with existing patterns).
- Project detail view can be a modal or expandable row (TBD based on complexity).

---

## 7. Success Metrics
- Number of projects created per property.
- Average project duration (start date to close date).
- Budget accuracy (variance between revised budget and actual cost).
- Change order frequency (average change orders per project).
- Time to find project information (qualitative).

---

## 8. Implementation Notes (High-Level)

### 8.1 Phase 1: Core Project Management
- Create Projects Center page with list view.
- Add/Edit project modal.
- Basic project CRUD operations.
- Property filtering and search.

### 8.2 Phase 2: Invoice Integration
- Add `projectId` field to invoices collection.
- Update invoice form to include project dropdown.
- Update invoice list to show project column and filter by project.
- Project detail view: Invoices tab showing linked invoices.
- Budget calculation: sum of linked invoice amounts.

### 8.3 Phase 3: Change Orders
- Create change orders subcollection.
- Add/Edit change order modal.
- Change order list in project detail view.
- Approve/Reject change order workflow.
- Budget calculation: include approved change orders in revised budget.

### 8.4 Phase 4: Documents & Closeout
- Document upload functionality.
- Project closeout workflow.
- Final budget summary locking.

### 8.5 Technical Considerations
- Avoid Firestore composite index pain by:
  - Querying by a single orderBy (startDate) and filtering in-memory where needed, OR
  - Creating required composite indexes intentionally.
- Budget calculations should be computed client-side from invoices and change orders (avoid storing redundant calculated fields that can get out of sync).
- Consider denormalizing `propertyName` and `projectName` in invoices for easier filtering/display.

---

## 9. Open Questions (RESOLVED)

1. **Should projects be deletable, or should they be archived/deactivated?**
   - **Answer:** Both - Projects can be deleted (when in Planning status) and should also support archiving/deactivation for closed projects.

2. **Should change orders be editable after approval, or should they be immutable?**
   - **Answer:** Editable - Change orders can be edited even after approval to allow corrections.

3. **Should invoices be required to be linked to a project, or can they exist independently?**
   - **Answer:** Linked to a project - Invoices must be linked to a project (required field).

4. **Should there be a project template system for common project types (e.g., "Standard Commercial Renovation")?**
   - **Answer:** Not necessary at this point - Templates can be added in a future enhancement.

5. **Should projects support multiple phases or sub-projects (e.g., Phase 1: Demolition, Phase 2: Construction)?**
   - **Answer:** Not in initial release - Can be added as a future enhancement.

6. **Should there be automated notifications when a project goes over budget or when change orders are pending approval?**
   - **Answer:** Not in initial release - Can be added as a future enhancement.

7. **Should closed projects be editable (e.g., to add late invoices or corrections)?**
   - **Answer:** Editable - Closed projects can be edited to allow adding late invoices or making corrections.

8. **Should project types be configurable (like inspection types) or a fixed list?**
   - **Answer:** Configurable - Project types should be stored in a database collection (similar to inspection types) so admins can add/modify types.

9. **Should there be a project dashboard showing summary metrics across all projects?**
   - **Answer:** Yes - A project dashboard should be implemented to show summary metrics across all projects.

10. **Should change orders require approval workflow, or can they be auto-approved by the creator?**
    - **Answer:** Auto-approved by creator - Change orders are automatically approved when created (no approval workflow needed).

---

## 10. Future Enhancements (Post-MVP)
- Project templates and project type libraries.
- Multi-phase project breakdowns.
- Project scheduling and timeline visualization.
- Automated budget alerts and notifications.
- Integration with external accounting systems.
- Project performance analytics and reporting.
- Resource allocation and team management.
- Mobile field project management.
