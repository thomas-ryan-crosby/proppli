# Product Requirements Document: Maintenance Inspection Reports
**Version:** 0.1  
**Status:** Draft  
**Last Updated:** 2026-01-21  

---

## 1. Overview

### 1.1 Purpose
Add a new **Maintenance → Inspection Reports** page to store and manage inspection documentation (e.g., pest inspections, fire inspections, life-safety, elevator, pool, backflow, etc.). This creates a centralized compliance record per property, reduces searching through email/file shares, and supports audit readiness.

### 1.2 Goals
- Provide a single place to **upload, view, and track** inspection reports per property.
- Support **repeatable inspection cadence** (monthly/quarterly/annual) and simple compliance visibility.
- Enable maintenance and property teams to **find the latest report quickly**.
- Keep the UI aligned with Proppli’s existing maintenance experience (simple, calm, fast).

### 1.3 Non-Goals (Initial Release)
- Full workflow automation (auto-scheduling with calendar invites).
- Complex checklist authoring / mobile field inspection forms.
- OCR / text extraction / AI summarization of PDFs.
- Automated enforcement escalation (email/SMS notifications).

### 1.4 Target Users
- **Property Manager** (`property_manager`): manage/track compliance for assigned properties.
- **Admin / Super Admin**: manage across all properties.
- **Maintenance** (`maintenance`): view/upload reports for assigned properties.
- **Viewer** (`viewer`): read-only visibility (optional; see permissions section).

---

## 2. User Experience

### 2.1 Navigation & Placement
- Add a new **subpage within Maintenance**: “Inspection Reports”.
- The page must respect the existing **property selector** pattern used in Maintenance (assigned-property access for Maintenance role).

### 2.2 Primary Screen (Inspection Reports)
**Layout**
- Header: “Inspection Reports”
- Filters:
  - Property (dropdown; defaults to current property context if one is selected in maintenance)
  - Inspection type (dropdown)
  - Status (All, Current, Expiring Soon, Overdue, Missing)
  - Date range (optional)
  - Search (vendor name, notes, filename)
- Primary action (one per view): **Add Inspection Report**

**List View**
- Table layout (consistent with recent finance table patterns):
  - Date of inspection
  - Property
  - Type (Pest, Fire, etc.)
  - Vendor / Inspector (optional)
  - Valid through / Next due
  - Status badge (Current / Expiring Soon / Overdue / Missing)
  - Actions: View, Download, Edit, Delete (permission-based)

### 2.3 Add/Edit Inspection Report (Modal)
Fields (MVP):
- **Property** (required)
- **Inspection Type** (required)
- **Inspection Date** (required)
- **Valid Through** (optional, recommended for compliance types)
- **Next Due Date** (optional; can be auto-calculated later)
- Vendor / Inspector name (optional)
- Notes (optional)
- File upload (required for MVP): PDF/image/Word

Behavior:
- Drag & drop upload with filename preview (reuse invoice/COI patterns).
- Edit should allow replacing the file or keeping existing.

### 2.4 Inspection Report Detail (Optional in MVP)
Either:
- A “View Details” modal similar to invoice details, showing all metadata + file link, OR
- Expandable row details.

---

## 3. Functional Requirements

### FR-IR-1: View Inspection Reports
- **Priority:** High
- **Acceptance Criteria:**
  - Users can view inspection reports for properties they have access to.
  - Default view shows the most recent reports first.

### FR-IR-2: Upload New Inspection Report
- **Priority:** High
- **Acceptance Criteria:**
  - Upload requires property, type, inspection date, and a file.
  - File is stored in Firebase Storage and metadata saved in Firestore.
  - User sees confirmation and the new report appears in the list.

### FR-IR-3: Edit Inspection Report Metadata
- **Priority:** Medium
- **Acceptance Criteria:**
  - Authorized users can edit fields (dates, vendor, notes, type).
  - Optionally replace file; if replaced, new file URL is saved.

### FR-IR-4: Delete Inspection Report
- **Priority:** Medium
- **Acceptance Criteria:**
  - Authorized users can delete a report with confirmation.
  - Deleting removes the Firestore document and attempts to delete the Storage file.

### FR-IR-5: Status Computation (Current / Expiring Soon / Overdue / Missing)
- **Priority:** Medium
- **Acceptance Criteria:**
  - If `validThrough` exists:
    - Current: now ≤ validThrough - threshold
    - Expiring Soon: within threshold window (e.g., 30 days)
    - Overdue: now > validThrough
  - If only `nextDueDate` exists: same logic against nextDueDate.
  - If neither exists: status is “No Due Date” (neutral) for MVP.

### FR-IR-6: Inspection Type Configuration (Lightweight)
- **Priority:** Medium
- **Acceptance Criteria:**
  - Inspection types are defined in a database collection (similar to cost codes) so admins can add types (e.g., “Backflow”).
  - MVP fallback: a default set of common types.

---

## 4. Permissions & Security

### 4.1 UI Permissions
- **Admin / Super Admin / Property Manager**: create/edit/delete for accessible properties.
- **Maintenance**: create/edit for accessible properties (or upload-only, depending on preference).
- **Viewer**: read-only (optional).

### 4.2 Firestore Rules (Target)
New collection `inspectionReports`:
- **read**: authenticated active users with roles allowed to access Maintenance features, subject to assigned property checks where applicable.
- **write**: roles allowed to create/update/delete (admin/super_admin/property_manager; maintenance optionally).

### 4.3 Storage Rules (Target)
Store files in:
- `inspectionReports/{propertyId}/{reportId}/{timestamp}_{filename}`
Rules should mirror Firestore permissions.

---

## 5. Data Model

### 5.1 Firestore: `inspectionReports`
```js
{
  propertyId: string,              // required
  inspectionTypeId: string,        // required (or typeName for MVP)
  inspectionTypeName: string,      // denormalized for display
  inspectionDate: Timestamp,       // required
  validThrough: Timestamp|null,    // optional
  nextDueDate: Timestamp|null,     // optional
  vendorName: string|null,         // optional
  notes: string|null,              // optional
  fileUrl: string,                 // required
  fileName: string,                // required
  createdAt: Timestamp,
  createdBy: string|null,          // auth uid
  updatedAt: Timestamp,
  updatedBy: string|null
}
```

### 5.2 Firestore: `inspectionTypes` (config)
```js
{
  name: string,                    // e.g., "Pest Inspection"
  defaultCadence: string|null,     // e.g., "Monthly", "Quarterly", "Annually" (optional)
  defaultExpiryDays: number|null,  // optional helper for UI automation later
  isActive: boolean,               // hide without deleting
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 6. UX Requirements
- Use table layout with calm styling, consistent spacing (see `STYLE_GUIDE.md`).
- One primary action: “Add Inspection Report”.
- Clear empty states:
  - “No inspection reports found for this property.”
  - CTA button visible if user can add.

---

## 7. Success Metrics
- Time to find latest report per property/type (qualitative).
- % of properties with at least one report uploaded for key inspection types.
- Reduction in “missing document” escalations (qualitative).

---

## 8. Implementation Notes (High-Level)
- Implement as a new tab/page under Maintenance with:
  - List rendering
  - Modal for add/edit
  - File upload to Storage
  - Firestore CRUD
  - Filters + search
- Avoid Firestore composite index pain by:
  - Querying by a single orderBy (date) and filtering in-memory where needed, OR
  - Creating the required composite indexes intentionally once requirements stabilize.

---

## 9. Open Questions
1. Should Maintenance role be able to delete reports, or upload/edit only?
2. Should inspection types be property-specific (some properties may not require certain inspections)?
3. Do we want a “Latest per type” summary view (compliance dashboard)?
4. Default “Expiring Soon” window: 30 days, 45 days, or configurable?

