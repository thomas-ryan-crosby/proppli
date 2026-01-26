# Product Requirements Document: Audit Center
**Version:** 1.0  
**Status:** Ready for Development  
**Last Updated:** 2026-01-21  

---

## 1. Overview

### 1.1 Purpose
Create an **Audit Center** that provides a centralized view of Certificate of Insurance (COI) compliance across vendors and tenants. This enables property managers and admins to quickly identify which entities have valid COIs, which are missing COIs, and which COIs are expiring soon.

### 1.2 Goals
- Provide a **single dashboard** for COI compliance monitoring
- Identify **vendors without COIs** or with expired COIs
- Identify **tenants without COIs** or with expired COIs
- Highlight **COIs expiring soon** (configurable threshold: 30, 60, 90 days)
- Enable **quick navigation** to vendor/tenant detail pages to upload or review COIs
- Support **filtering and sorting** for efficient audit workflows

### 1.3 Non-Goals (Initial Release)
- Automated COI expiration notifications/emails
- COI renewal reminders
- Bulk COI upload
- COI compliance reporting/export
- Historical COI tracking/audit trail
- Integration with external insurance verification systems

### 1.4 Target Users
- **Property Manager** (`property_manager`): View COI status for assigned properties' vendors/tenants
- **Admin / Super Admin**: View COI status across all vendors/tenants
- **Viewer** (`viewer`): Read-only access (optional)

---

## 2. User Experience

### 2.1 Navigation & Placement
- Add a new top-level navigation item: **"Audit Center"** (or "Audit")
- The page must respect the existing **property selector** pattern (assigned-property access for Property Manager roles)
- Icon: 🔍 (magnifying glass) or 📋 (clipboard with checkmark)

### 2.2 Primary Screen (Audit Dashboard)

**Layout**
- Header: "Audit Center"
- Descriptive text: "Monitor Certificate of Insurance (COI) compliance for vendors and tenants"
- **Summary Cards** (top section):
  - Total Vendors (with count)
  - Vendors with Valid COI (with count and percentage)
  - Vendors Missing COI (with count)
  - Total Tenants (with count)
  - Tenants with Valid COI (with count and percentage)
  - Tenants Missing COI (with count)
  - COIs Expiring Soon (with count, configurable threshold)

**Filters** (below summary cards):
- Property filter (dropdown, respects assigned properties for property_manager)
- Expiration threshold (dropdown: 30 days, 60 days, 90 days) - defaults to 30 days
- Status filter (dropdown: All, Valid, Expired, Missing, Expiring Soon)
- Search (text input for vendor/tenant name)

**Two Main Sections:**

#### 2.2.1 Vendor COI Status Table
- Columns:
  - Vendor Name
  - Property (if vendor is assigned to properties)
  - COI Status (badge: Valid, Expired, Missing, Expiring Soon)
  - Expiration Date (most recent COI endDate, or "N/A")
  - Days Until Expiration (calculated, or "N/A")
  - Actions (View Vendor button)

#### 2.2.2 Tenant COI Status Table
- Columns:
  - Tenant Name
  - Property (primary property association)
  - COI Status (badge: Valid, Expired, Missing, Expiring Soon)
  - Expiration Date (most recent COI endDate, or "N/A")
  - Days Until Expiration (calculated, or "N/A")
  - Actions (View Tenant button)

**Status Badge Colors:**
- **Valid**: Green (`#16A34A`) - COI exists and endDate is in the future
- **Expiring Soon**: Yellow/Orange (`#F59E0B`) - COI exists but endDate is within the selected threshold (e.g., 30 days)
- **Expired**: Red (`#DC2626`) - COI exists but endDate is in the past
- **Missing**: Gray (`#6B7280`) - No COIs found for the entity

---

## 3. Data Model

### 3.1 COI Status Calculation

**For Vendors:**
- Load all vendors (filtered by assigned properties if property_manager)
- For each vendor:
  - Check `vendor.cois` array
  - If `cois` is empty or undefined → Status: **Missing**
  - If `cois` exists:
    - Find the most recent COI (by `endDate` descending)
    - Compare `endDate` to current date:
      - If `endDate < today` → Status: **Expired**
      - If `endDate >= today && endDate <= (today + threshold)` → Status: **Expiring Soon**
      - If `endDate > (today + threshold)` → Status: **Valid**

**For Tenants:**
- Load all tenants (filtered by assigned properties if property_manager)
- For each tenant:
  - Check `tenant.cois` array
  - Same logic as vendors

### 3.2 Firestore Data Structure

**Vendor Document:**
```javascript
{
  name: string,
  cois: [
    {
      fileName: string,
      fileUrl: string,
      startDate: Timestamp,
      endDate: Timestamp,
      description: string | null,
      uploadedAt: Timestamp,
      uploadedBy: string | null
    }
  ],
  // ... other vendor fields
}
```

**Tenant Document:**
```javascript
{
  name: string,
  propertyId: string, // primary property
  cois: [
    {
      fileName: string,
      fileUrl: string,
      startDate: Timestamp,
      endDate: Timestamp,
      description: string | null,
      uploadedAt: Timestamp,
      uploadedBy: string | null
    }
  ],
  // ... other tenant fields
}
```

---

## 4. Functional Requirements

### 4.1 Summary Cards
- **Total Vendors**: Count of all vendors (filtered by property if applicable)
- **Vendors with Valid COI**: Count of vendors with status = "Valid"
- **Vendors Missing COI**: Count of vendors with status = "Missing" or "Expired"
- **Total Tenants**: Count of all tenants (filtered by property if applicable)
- **Tenants with Valid COI**: Count of tenants with status = "Valid"
- **Tenants Missing COI**: Count of tenants with status = "Missing" or "Expired"
- **COIs Expiring Soon**: Count of vendors + tenants with status = "Expiring Soon"

### 4.2 Filtering
- **Property Filter**: Filter vendors/tenants by selected property (default: "All Properties")
- **Expiration Threshold**: Change the "Expiring Soon" threshold (30/60/90 days), updates both tables
- **Status Filter**: Filter by COI status (All, Valid, Expired, Missing, Expiring Soon)
- **Search**: Filter by vendor/tenant name (case-insensitive, partial match)

### 4.3 Sorting
- Default sort: By vendor/tenant name (ascending)
- Sortable columns: Vendor/Tenant Name, Expiration Date, Days Until Expiration
- Click column header to toggle ascending/descending

### 4.4 Actions
- **View Vendor**: Navigate to vendor detail page (opens vendor detail modal)
- **View Tenant**: Navigate to tenant detail page (opens tenant detail modal)
- Actions should open the detail modal with the COIs tab active (if available)

### 4.5 Real-time Updates
- Use Firestore real-time listeners for vendors and tenants collections
- Update summary cards and tables when COIs are added/updated/deleted

---

## 5. Technical Requirements

### 5.1 Performance
- Load vendors and tenants in parallel
- Calculate COI status client-side (no Firestore queries for COI subcollections)
- Use in-memory filtering/sorting to avoid complex Firestore indexes
- Pagination optional (if > 100 vendors/tenants, consider pagination)

### 5.2 Permissions
- **Admin / Super Admin**: View all vendors/tenants
- **Property Manager**: View vendors/tenants for assigned properties only
- **Viewer**: Read-only access (no edit buttons)

### 5.3 Error Handling
- Handle missing `cois` array gracefully (treat as empty)
- Handle invalid date formats in COI `endDate`
- Show loading states while fetching data
- Display error messages if Firestore queries fail

---

## 6. UI/UX Guidelines

### 6.1 Design Consistency
- Follow existing Proppli style guide (STYLE_GUIDE.md)
- Use table layout similar to Projects Center / Inspection Reports
- Reuse existing badge styles for status indicators
- Use Proppli Blue (`#2563EB`) for primary actions

### 6.2 Accessibility
- Ensure color contrast meets WCAG AA (4.5:1)
- Include text labels with status badges (not color-only)
- Keyboard navigation support
- Screen reader friendly table structure

### 6.3 Responsive Design
- Tables scroll horizontally on mobile if needed
- Summary cards stack vertically on mobile
- Filters stack vertically on mobile

---

## 7. Implementation Phases

### Phase 1: Core Dashboard (MVP)
- Create Audit Center page and navigation
- Summary cards (vendor/tenant counts)
- Vendor COI status table
- Tenant COI status table
- Basic filtering (property, status, search)
- View vendor/tenant actions

### Phase 2: Enhanced Features
- Expiration threshold selector
- Days until expiration calculation
- Sorting by columns
- Real-time Firestore listeners
- Improved status badge styling

### Phase 3: Future Enhancements (Optional)
- Export to CSV/PDF
- Email notifications for expiring COIs
- COI renewal reminders
- Historical COI tracking

---

## 8. Open Questions

1. **Should expired COIs be treated differently from missing COIs?**
   - **Answer:** Yes - expired COIs show the entity had a COI but it expired, while missing means no COI was ever uploaded. Both are non-compliant but have different implications.

2. **Should we show multiple COIs per vendor/tenant, or only the most recent?**
   - **Answer:** For the audit dashboard, show only the most recent (by endDate). Users can view all COIs in the vendor/tenant detail page.

3. **What should be the default expiration threshold for "Expiring Soon"?**
   - **Answer:** 30 days (configurable to 60 or 90 days)

4. **Should vendors/tenants be grouped by property in the tables?**
   - **Answer:** No - flat list with property column. Property filter allows filtering by property.

5. **Should there be a "Mark as Reviewed" feature for audit tracking?**
   - **Answer:** Not in initial release - can be added in Phase 3 if needed.

---

## 9. Success Criteria

- Users can quickly identify vendors/tenants without valid COIs
- Users can see which COIs are expiring soon (within 30/60/90 days)
- Summary cards provide at-a-glance compliance metrics
- Filtering and search enable efficient audit workflows
- Navigation to vendor/tenant detail pages is seamless
- Page loads and updates in real-time without performance issues

---

*PRD maintained by Proppli Development Team*
