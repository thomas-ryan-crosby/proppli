# Rent Roll Deprecated Leases Implementation Plan

## Overview
Enhance the rent roll functionality to include deprecated leases, showing historical rent data up to the deprecation date. This allows users to look back at what rents were for leases that have been deprecated.

## Current State Analysis

### Current Behavior
- **Line 16066**: Rent rolls currently filter out deprecated leases: `if (isLeaseActive(lease) && !isLeaseDeleted(lease))`
- **`calculateRentForMonth` function**: Calculates rent for any given month/year but doesn't account for deprecated leases
- **`calculateCurrentRent` function**: Already handles deprecated leases by using `deprecatedDate` as the calculation date
- Rent rolls only show active leases, excluding any historical data for deprecated leases

### Key Functions
1. `loadRentRoll()` - Loads and filters leases, then renders
2. `calculateRentForMonth(lease, year, month)` - Calculates rent for a specific month
3. `renderRentRollVertical()` / `renderRentRollHorizontal()` - Render the rent roll table
4. `isLeaseDeprecated(lease)` - Checks if lease is deprecated

## Design Approach

### 1. User Interface Changes

#### A. Add Toggle/Filter for Deprecated Leases
- **Location**: Rent Roll filters section (near property/building/tenant filters)
- **Component**: Checkbox labeled "Include Deprecated Leases" or toggle switch
- **Default**: Unchecked (maintains current behavior)
- **Behavior**: 
  - When checked, includes deprecated leases in the rent roll
  - When unchecked, only shows active leases (current behavior)

#### B. Visual Distinction for Deprecated Leases
- **In Table Headers**: Add a visual indicator (icon or badge) showing "Deprecated" status
- **In Table Cells**: 
  - Show rent values for months up to deprecation date
  - Show "—" or "N/A" for months after deprecation date
  - Optionally use a different text color (gray) for deprecated lease columns/rows
- **Section Separation**: Optionally group deprecated leases in a separate section below active leases

### 2. Data Processing Changes

#### A. Modify `loadRentRoll()` Function
**Location**: `app.js` line ~16060

**Changes**:
1. Add checkbox state reading: `const includeDeprecated = document.getElementById('rentRollIncludeDeprecated')?.checked || false;`
2. Modify lease filtering logic:
   ```javascript
   // Current: if (isLeaseActive(lease) && !isLeaseDeleted(lease))
   // New: 
   if (!isLeaseDeleted(lease)) {
       if (includeDeprecated) {
           // Include both active and deprecated leases
           if (isLeaseActive(lease) || isLeaseDeprecated(lease)) {
               // Apply filters and add to list
           }
       } else {
           // Only include active leases (current behavior)
           if (isLeaseActive(lease)) {
               // Apply filters and add to list
           }
       }
   }
   ```
3. Separate deprecated leases for optional grouping:
   - Create `deprecatedLeases` array alongside `activeLeases`
   - Group separately or merge based on UI preference

#### B. Enhance `calculateRentForMonth()` Function
**Location**: `app.js` line ~15884

**Changes**:
1. Add deprecation date check at the beginning:
   ```javascript
   // Check if lease is deprecated and if target month is after deprecation
   if (isLeaseDeprecated(lease) && lease.deprecatedDate) {
       const deprecatedDate = lease.deprecatedDate.toDate ? lease.deprecatedDate.toDate() : new Date(lease.deprecatedDate);
       const targetDate = new Date(year, month - 1, 1);
       const endOfMonth = new Date(year, month, 0); // Last day of target month
       
       // If target month is after deprecation date, return 0
       if (endOfMonth > deprecatedDate) {
           return { rent: 0, hasEscalation: false, isDeprecated: true };
       }
       
       // If target month includes deprecation date, use deprecation date for calculation
       // This ensures we show the rent as of the deprecation date
   }
   ```

2. Use deprecation date as calculation cutoff:
   - When calculating rent for a month that includes the deprecation date, use the deprecation date instead of the end of the month
   - This ensures escalations are calculated correctly up to the deprecation point

3. Return additional metadata:
   ```javascript
   return { 
       rent: Math.round(rent * 100) / 100, 
       hasEscalation, 
       isDeprecated: isLeaseDeprecated(lease),
       deprecatedDate: lease.deprecatedDate 
   };
   ```

#### C. Update Rendering Functions

**Functions to Update**:
- `renderRentRollVertical()` - Line ~16126
- `renderRentRollHorizontal()` - Line ~16297
- `renderVerticalTable()` - Line ~16179
- `renderHorizontalTable()` - (if exists)

**Changes**:
1. **Header Enhancement**: 
   - Add deprecation indicator in column/row headers for deprecated leases
   - Show deprecation date in header tooltip or subtitle

2. **Cell Rendering**:
   - Check if month is after deprecation date
   - Display "—" or "N/A" for months after deprecation
   - Use `calculateRentForMonth()` which now handles deprecation

3. **Visual Styling**:
   - Apply muted/gray styling to deprecated lease columns/rows
   - Add visual separator between active and deprecated sections (if grouped)

4. **Totals Calculation**:
   - Exclude deprecated leases from totals, OR
   - Show separate totals for active vs deprecated leases

### 3. HTML/UI Updates

#### A. Add Filter Control
**Location**: `index.html` - Rent Roll filters section

**Add**:
```html
<div class="form-group" style="display: flex; align-items: center; gap: 8px;">
    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" id="rentRollIncludeDeprecated" style="margin: 0;">
        <span>Include Deprecated Leases</span>
    </label>
    <small style="color: #666;">Show historical rent data for deprecated leases</small>
</div>
```

#### B. Update Event Listeners
**Location**: `populateRentRollFilters()` function

**Add**:
```javascript
const includeDeprecatedCheckbox = document.getElementById('rentRollIncludeDeprecated');
if (includeDeprecatedCheckbox) {
    includeDeprecatedCheckbox.addEventListener('change', () => {
        loadRentRoll();
    });
}
```

## Implementation Steps

### Phase 1: Core Functionality
1. ✅ Update `calculateRentForMonth()` to handle deprecated leases
   - Add deprecation date check
   - Return 0 for months after deprecation
   - Use deprecation date as calculation cutoff

2. ✅ Modify `loadRentRoll()` filtering logic
   - Add checkbox state reading
   - Include deprecated leases when checkbox is checked
   - Separate active and deprecated leases arrays

### Phase 2: UI Integration
3. ✅ Add "Include Deprecated Leases" checkbox to HTML
4. ✅ Add event listener for checkbox change
5. ✅ Update rendering functions to show deprecated leases
   - Add visual indicators
   - Handle month-after-deprecation display
   - Apply styling differences

### Phase 3: Visual Polish
6. ✅ Enhance table headers with deprecation indicators
7. ✅ Apply muted styling to deprecated lease data
8. ✅ Update totals calculations (if needed)
9. ✅ Add tooltips showing deprecation dates

## Technical Considerations

### Edge Cases to Handle
1. **Lease deprecated mid-month**: Show rent for that month using deprecation date
2. **Multiple deprecated leases**: Ensure proper grouping and display
3. **Deprecated lease with no deprecation date**: Use current date or lease end date as fallback
4. **Year filter with deprecated leases**: Show deprecated leases for historical years even if deprecated in current year

### Performance Considerations
- Deprecated leases add to the dataset size - ensure filtering is efficient
- Consider pagination if deprecated leases list becomes very large
- Cache calculations for deprecated leases to avoid recalculation

### Data Integrity
- Ensure `deprecatedDate` is always set when `isDeprecated = true`
- Validate deprecation dates are within lease term dates
- Handle timezone issues with date comparisons

## Testing Scenarios

1. **Basic Functionality**:
   - Toggle "Include Deprecated Leases" on/off
   - Verify deprecated leases appear/disappear
   - Verify active leases always show

2. **Rent Calculations**:
   - Deprecated lease with escalations - verify rent stops at deprecation date
   - Deprecated lease without escalations - verify initial rent shown up to deprecation
   - Multiple deprecated leases with different deprecation dates

3. **Visual Display**:
   - Verify months after deprecation show "—" or "N/A"
   - Verify deprecation indicators appear in headers
   - Verify styling differences are visible

4. **Filtering**:
   - Property filter with deprecated leases
   - Building filter with deprecated leases
   - Tenant filter with deprecated leases
   - Year filter showing historical deprecated leases

5. **Edge Cases**:
   - Lease deprecated on first day of month
   - Lease deprecated on last day of month
   - Deprecated lease spanning multiple years in rent roll
   - Deprecated lease with no deprecation date (fallback behavior)

## Success Criteria

✅ Users can toggle deprecated leases on/off in rent roll
✅ Deprecated leases show historical rent data up to deprecation date
✅ Months after deprecation show "—" or "N/A"
✅ Visual distinction makes it clear which leases are deprecated
✅ Rent calculations are accurate for deprecated leases
✅ Performance remains acceptable with deprecated leases included
✅ All existing rent roll functionality continues to work

## Future Enhancements (Out of Scope)

- Export rent roll with deprecated leases included
- Separate "Historical Rent Roll" view showing only deprecated leases
- Deprecation reason display in rent roll
- Comparison view: active vs deprecated rents side-by-side
- Deprecation date filter (show leases deprecated in specific date range)
