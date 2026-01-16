# Deprecated Leases Code Review Report

## Executive Summary

This report reviews how deprecated leases are currently defined and handled throughout the codebase. The review identifies inconsistencies, areas where deprecated leases are incorrectly excluded, and recommendations for ensuring deprecated leases are properly distinguished from deleted leases.

## Key Definitions

### Deleted Leases (`deletedAt` field)
- **Purpose**: Clerical errors, duplicates, mistakes
- **Should NEVER appear**: Completely excluded from all views
- **Function**: `isLeaseDeleted(lease)` - checks if `lease.deletedAt !== null && lease.deletedAt !== undefined`

### Deprecated Leases (`isDeprecated` field)
- **Purpose**: Legacy/historical leases with important information
- **Should be INCLUDED**: In appropriate views for historical reference
- **Function**: `isLeaseDeprecated(lease)` - checks if `lease.isDeprecated === true || lease.isDeprecated === 'true' || lease.isDeprecated === 1`

## Current Implementation Analysis

### ✅ Correctly Implemented Areas

#### 1. Helper Functions
**Location**: `app.js` lines 12657-14762

- ✅ **`isLeaseDeleted(lease)`** (line 12657)
  - Correctly checks `deletedAt` field
  - Returns boolean

- ✅ **`isLeaseDeprecated(lease)`** (line 14760)
  - Correctly checks `isDeprecated` field
  - Handles multiple formats (true, 'true', 1)
  - Returns boolean

- ✅ **`isLeaseActive(lease)`** (line 14765)
  - Correctly excludes both deleted AND deprecated leases
  - Logic: `if (isLeaseDeleted(lease)) return false;`
  - Logic: `if (isLeaseDeprecated(lease)) return false;`
  - **This is correct** - deprecated leases are NOT active

#### 2. Lease Table View (Main Leases Page)
**Location**: `app.js` lines 12886-12992

- ✅ **Status-based filtering** (line 12886)
  - Current view: Shows 'Active', 'Expiring Soon'
  - Previous view: Shows 'Expired', 'Terminated', 'Renewed'
  - **Issue**: Does NOT include 'Deprecated' status in either view
  - **Impact**: Deprecated leases don't appear in main leases table

#### 3. Lease Detail Views (Unit/Property Level)
**Location**: Multiple locations

- ✅ **`loadUnitLegacyLeases()`** (line 15200)
  - Correctly filters: `if (isLeaseDeprecated(lease) && !isLeaseDeleted(lease))`
  - Shows deprecated leases in "Legacy Leases" tab
  - **Correctly excludes deleted leases**

- ✅ **`loadPropertyLegacyLeases()`** (line 15320)
  - Correctly filters: `if (isLeaseDeprecated(lease) && !isLeaseDeleted(lease))`
  - Shows deprecated leases in "Legacy Leases" tab
  - **Correctly excludes deleted leases**

- ✅ **`loadUnitActiveLeases()`** (line 15250)
  - Correctly filters: `if (isLeaseActive(lease) && !isLeaseDeleted(lease))`
  - Excludes deprecated leases from active view
  - **Correct**

- ✅ **`loadPropertyActiveLeases()`** (line 15287)
  - Correctly filters: `if (!lease.unitId && isLeaseActive(lease) && !isLeaseDeleted(lease))`
  - Excludes deprecated leases from active view
  - **Correct**

#### 4. Lease Summary Tables (Properties/Units View)
**Location**: `app.js` lines 14602-14630

- ✅ **Active vs Legacy separation** (lines 14603-14604, 14619-14620, 14629-14630)
  - Correctly separates: `activeLeases` and `legacyLeases`
  - Legacy leases: `isLeaseDeprecated(l) && !isLeaseDeleted(l)`
  - Active leases: `isLeaseActive(l) && !isLeaseDeleted(l)`
  - **Correctly excludes deleted leases from both**

#### 5. Rent Calculation
**Location**: `app.js` lines 14846-14909

- ✅ **`calculateCurrentRent()`** (line 14846)
  - Correctly handles deprecated leases
  - Uses `deprecatedDate` as calculation date for deprecated leases
  - Logic: `if (isDeprecated && lease.deprecatedDate) { calculationDate = deprecatedDate }`
  - **Correct implementation**

#### 6. Status Display
**Location**: Multiple locations

- ✅ **Status display logic** (lines 12949, 14832, 15288, 15388)
  - Correctly shows "Deprecated" status: `displayStatus = isLeaseDeprecated(lease) ? 'Deprecated' : lease.status`
  - **Consistent across all views**

#### 7. Auto-Status Updates
**Location**: `app.js` lines 12727-12746

- ✅ **Prevents auto-updates for deprecated leases** (line 12731)
  - Logic: `if (!isDeprecated && !hasAutoRenewal) { /* auto-update status */ }`
  - **Correctly prevents status changes for deprecated leases**

### ❌ Issues and Inconsistencies

#### Issue 1: Main Leases Table View Excludes Deprecated Leases
**Location**: `app.js` lines 12886-12892

**Problem**:
```javascript
const filteredLeases = Object.values(leases).filter(lease => {
    if (currentLeaseView === 'current') {
        return ['Active', 'Expiring Soon'].includes(lease.status);
    } else {
        return ['Expired', 'Terminated', 'Renewed'].includes(lease.status);
    }
});
```

**Issue**: 
- Deprecated leases are filtered out because their status is 'Deprecated', which is not in either array
- Deprecated leases don't appear in "Current" or "Previous" views

**Recommendation**:
- Add 'Deprecated' to the "Previous" view filter, OR
- Create a separate "Legacy/Deprecated" view option, OR
- Add a toggle to include deprecated leases in the current view

#### Issue 2: Rent Roll Excludes Deprecated Leases
**Location**: `app.js` lines 16060-16087

**Problem**:
```javascript
if (isLeaseActive(lease) && !isLeaseDeleted(lease)) {
    activeLeases.push(lease);
}
```

**Issue**:
- Rent roll only includes active leases
- Deprecated leases are completely excluded
- This is the main issue we're addressing in the plan

**Recommendation**:
- Implement the plan to add "Include Deprecated Leases" checkbox
- Modify filtering to optionally include deprecated leases

#### Issue 3: `calculateRentForMonth()` Doesn't Handle Deprecated Leases
**Location**: `app.js` lines 15884-16007

**Problem**:
- Function calculates rent for any month but doesn't check if lease is deprecated
- Doesn't use `deprecatedDate` as a cutoff
- Will calculate rent for months after deprecation date

**Recommendation**:
- Add deprecation date check at beginning of function
- Return 0 for months after deprecation date
- Use deprecation date as calculation cutoff (similar to `calculateCurrentRent`)

#### Issue 4: Inconsistent Terminology
**Location**: Throughout codebase

**Observations**:
- Uses "Legacy Leases" in some places (UI labels, function names)
- Uses "Deprecated Leases" in other places (status, field names)
- Both refer to the same thing: `isLeaseDeprecated(lease) === true`

**Recommendation**:
- Standardize terminology: Use "Deprecated" consistently
- Or clearly document that "Legacy" = "Deprecated" in code comments

## Data Flow Analysis

### Lease Creation/Update Flow
1. ✅ **Form submission** (line 14051): Correctly saves `isDeprecated`, `deprecatedDate`, `deprecatedReason`
2. ✅ **Deprecated modal** (line 15647): Correctly sets `isDeprecated: true`, `status: 'Deprecated'`, `deprecatedDate`
3. ✅ **Status dropdown** (index.html): Now includes "Deprecated" as an option

### Lease Display Flow
1. ✅ **Load leases**: All leases loaded from Firestore
2. ✅ **Filter by deleted**: Deleted leases excluded everywhere
3. ⚠️ **Filter by deprecated**: Inconsistent - excluded in some views, shown in others
4. ✅ **Display status**: Correctly shows "Deprecated" when `isLeaseDeprecated(lease)`

### Rent Calculation Flow
1. ✅ **`calculateCurrentRent()`**: Handles deprecated leases correctly
2. ❌ **`calculateRentForMonth()`**: Does NOT handle deprecated leases
3. ✅ **Display logic**: Uses `calculateCurrentRent()` which handles deprecated correctly

## Recommendations

### High Priority

1. **Fix Main Leases Table View**
   - Add deprecated leases to "Previous" view, OR
   - Add separate "Legacy" view tab, OR
   - Add filter toggle to include deprecated leases

2. **Fix Rent Roll**
   - Implement the plan to add "Include Deprecated Leases" checkbox
   - Update `calculateRentForMonth()` to handle deprecated leases

3. **Update `calculateRentForMonth()`**
   - Add deprecation date check
   - Return 0 for months after deprecation
   - Use deprecation date as calculation cutoff

### Medium Priority

4. **Standardize Terminology**
   - Decide: "Deprecated" vs "Legacy"
   - Update all UI labels and comments consistently
   - Update function names if needed

5. **Add Deprecated Lease Filter**
   - Add filter option in main leases page
   - Allow users to view only deprecated leases

### Low Priority

6. **Documentation**
   - Add code comments explaining deprecated vs deleted distinction
   - Document when deprecated leases should be shown vs hidden

## Summary Statistics

- **Total references to deprecated**: 107 matches
- **Helper functions**: 2 (isLeaseDeprecated, isLeaseActive)
- **Views that correctly handle deprecated**: 4 (Unit/Property detail views, Summary tables)
- **Views that incorrectly exclude deprecated**: 2 (Main leases table, Rent roll)
- **Rent calculation functions**: 2 (1 correct, 1 needs update)

## Conclusion

The codebase generally handles deprecated leases correctly, with a clear distinction from deleted leases. However, there are **two main areas** where deprecated leases are incorrectly excluded:

1. **Main Leases Table View** - Deprecated leases don't appear in Current or Previous views
2. **Rent Roll** - Deprecated leases are completely excluded (this is being addressed in the plan)

The helper functions and most detail views correctly distinguish between deleted and deprecated leases. The main issues are in filtering logic for the main table view and rent roll functionality.
