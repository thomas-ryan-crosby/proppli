# Date/Time Standardization Document

**Created:** January 2025  
**Purpose:** Establish consistent date/time handling across the entire Proppli platform

---

## Overview

This document describes the standardized date/time utility system implemented to ensure consistent date handling, prevent timezone issues, eliminate month off-by-one errors, and provide reliable date calculations across all features of the platform.

---

## Problem Statement

Prior to this standardization, the platform had several critical date handling issues:

1. **Inconsistent Date Conversion**: Mixed use of `toDate()`, `new Date()`, and direct timestamp access
2. **Month Off-by-One Errors**: JavaScript's 0-based months (0-11) mixed with 1-based months (1-12) causing escalations to occur in wrong months
3. **Year Navigation Issues**: Year navigator jumping by multiple years instead of one year at a time
4. **Lease End Date Display**: Leases showing one month early (e.g., lease ending 11/2026 showing through 10/2026)
5. **Escalation Timing**: Annual escalations occurring in December instead of January
6. **Inconsistent Date Comparisons**: Different methods used for comparing dates across the codebase

---

## Solution: Standardized Date Utilities

All date operations now use a centralized set of utility functions located at the top of `app.js`. These functions provide:

- **Consistent Firestore Timestamp Conversion**: Single function handles all timestamp types
- **1-Based Month System**: All months are 1-based (1 = January, 12 = December) for clarity and consistency
- **Normalized Date Calculations**: All date comparisons use UTC-normalized dates
- **Month Boundary Handling**: Proper handling of month start/end dates

---

## Standardized Functions

### Core Conversion Functions

#### `toStandardDate(timestamp)`
Converts any date representation to a JavaScript Date object.

**Parameters:**
- `timestamp`: Firestore Timestamp, Date object, string, or number

**Returns:** JavaScript Date object or `null`

**Usage:**
```javascript
const date = toStandardDate(lease.leaseStartDate);
```

#### `getStandardYear(date)`
Gets the year from a date (standardized).

**Parameters:**
- `date`: Date object or Firestore timestamp

**Returns:** Year as number (e.g., 2024) or `null`

#### `getStandardMonth(date)`
Gets the month from a date (1-based: 1 = January, 12 = December).

**Parameters:**
- `date`: Date object or Firestore timestamp

**Returns:** Month as number (1-12) or `null`

**Important:** This is 1-based, not JavaScript's native 0-based system.

#### `getStandardDay(date)`
Gets the day of month from a date.

**Parameters:**
- `date`: Date object or Firestore timestamp

**Returns:** Day as number (1-31) or `null`

---

### Month Calculation Functions

#### `getMonthStartDate(year, month)`
Creates a date for the first day of a month (normalized to start of day, UTC).

**Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-based: 1 = January, 12 = December)

**Returns:** Date object for first day of month at 00:00:00 UTC

**Usage:**
```javascript
const janStart = getMonthStartDate(2024, 1); // January 1, 2024 00:00:00 UTC
```

#### `getMonthEndDate(year, month)`
Creates a date for the last day of a month (normalized to end of day, UTC).

**Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-based: 1 = January, 12 = December)

**Returns:** Date object for last day of month at 23:59:59.999 UTC

**Usage:**
```javascript
const janEnd = getMonthEndDate(2024, 1); // January 31, 2024 23:59:59.999 UTC
```

---

### Date Comparison Functions

#### `isDateInMonth(date, year, month)`
Checks if a date falls within a specific month.

**Parameters:**
- `date`: Date to check
- `year`: Year (e.g., 2024)
- `month`: Month (1-based: 1 = January, 12 = December)

**Returns:** `true` if date is in the specified month, `false` otherwise

#### `isDateBeforeMonth(date, year, month)`
Checks if a date is strictly before a specific month.

**Parameters:**
- `date`: Date to check
- `year`: Year (e.g., 2024)
- `month`: Month (1-based: 1 = January, 12 = December)

**Returns:** `true` if date is before the first day of the month

#### `isDateAfterMonth(date, year, month)`
Checks if a date is strictly after a specific month.

**Parameters:**
- `date`: Date to check
- `year`: Year (e.g., 2024)
- `month`: Month (1-based: 1 = January, 12 = December)

**Returns:** `true` if date is after the last day of the month

---

### Lease-Specific Functions

#### `isLeaseActiveInMonth(lease, year, month)`
Checks if a lease is active during a specific month, handling:
- Lease start dates
- Lease end dates (unless auto-renewal or operating under lease terms)
- Deprecated dates

**Parameters:**
- `lease`: Lease object
- `year`: Year (e.g., 2024)
- `month`: Month (1-based: 1 = January, 12 = December)

**Returns:** `true` if lease is active during the month

**Usage:**
```javascript
if (isLeaseActiveInMonth(lease, 2024, 11)) {
    // Lease is active in November 2024
}
```

#### `getMonthsBetween(startDate, endDate)`
Calculates the number of months between two dates.

**Parameters:**
- `startDate`: Start date
- `endDate`: End date

**Returns:** Number of months (can be negative if endDate < startDate)

---

## Updated Functions

The following functions have been updated to use the standardized date utilities:

### `calculateRentForMonth(lease, year, month)`
- Now uses `toStandardDate()` for all date conversions
- Uses `getMonthStartDate()` and `getMonthEndDate()` for month boundaries
- Uses `isLeaseActiveInMonth()` for lease validation
- Uses `getStandardYear()` and `getStandardMonth()` for month calculations
- **Fixed:** Escalations now occur in the correct month (January, not December)
- **Fixed:** Lease end dates now show through the end month correctly

### `calculateCurrentRent(lease, asOfDate)`
- Now uses `toStandardDate()` for all date conversions
- Uses standardized month calculations (1-based)
- **Fixed:** Escalation period calculations are now accurate

### Year Navigation Widget
- **Fixed:** Now navigates one year at a time (not multiple years)
- Properly filters available years to exclude current year
- Uses immediate previous/next year logic

---

## Key Changes

### 1. Month System Standardization

**Before:**
```javascript
const month = date.getMonth(); // 0-based (0 = January, 11 = December)
const targetDate = new Date(year, month - 1, 1); // Confusing conversion
```

**After:**
```javascript
const month = getStandardMonth(date); // 1-based (1 = January, 12 = December)
const monthStart = getMonthStartDate(year, month); // Clear and consistent
```

### 2. Date Conversion Standardization

**Before:**
```javascript
const date = lease.leaseStartDate.toDate(); // Only works for Firestore Timestamps
const date2 = new Date(lease.deprecatedDate); // Only works for strings/numbers
```

**After:**
```javascript
const date = toStandardDate(lease.leaseStartDate); // Works for all types
const date2 = toStandardDate(lease.deprecatedDate); // Works for all types
```

### 3. Escalation Month Calculations

**Before:**
```javascript
const firstEscMonth = firstEscDate.getMonth() + 1; // Inconsistent
if (calcMonth >= firstEscMonth) { // Could be off by one
```

**After:**
```javascript
const firstEscMonth = getStandardMonth(firstEscDate); // Always 1-based
if (calcMonth >= firstEscMonth) { // Consistent comparison
```

### 4. Year Navigation

**Before:**
```javascript
const prevYear = Math.max(...yearsLessThanCurrent); // Could skip years
```

**After:**
```javascript
const targetPrevYear = currentYear - 1;
const prevYear = availableYears.includes(targetPrevYear) 
    ? targetPrevYear 
    : availableYears.find(y => y < currentYear); // Always one year
```

---

## Best Practices

### When Working with Dates

1. **Always use `toStandardDate()`** for converting Firestore timestamps or any date input
2. **Always use 1-based months** (1 = January, 12 = December) when working with month numbers
3. **Use month boundary functions** (`getMonthStartDate`, `getMonthEndDate`) for month calculations
4. **Use comparison functions** (`isDateInMonth`, `isDateBeforeMonth`, `isDateAfterMonth`) for date comparisons
5. **Never mix 0-based and 1-based months** - always use the standardized functions

### Example: Calculating Rent for a Month

```javascript
function calculateRentForMonth(lease, year, month) {
    // Use standardized month boundaries
    const monthStart = getMonthStartDate(year, month);
    const monthEnd = getMonthEndDate(year, month);
    
    // Use standardized date conversion
    const startDate = toStandardDate(lease.leaseStartDate);
    const endDate = toStandardDate(lease.leaseEndDate);
    
    // Use standardized month comparison
    if (isDateAfterMonth(endDate, year, month)) {
        return { rent: 0 };
    }
    
    // Use standardized month extraction
    const escYear = getStandardYear(firstEscDate);
    const escMonth = getStandardMonth(firstEscDate);
    
    // ... rest of calculation
}
```

---

## Testing Checklist

When adding new date-related features, verify:

- [ ] All date conversions use `toStandardDate()`
- [ ] All month numbers are 1-based (1-12)
- [ ] Month boundaries use `getMonthStartDate()` and `getMonthEndDate()`
- [ ] Date comparisons use standardized comparison functions
- [ ] Escalations occur in the correct month
- [ ] Lease end dates show through the end month
- [ ] Year navigation moves one year at a time

---

## Migration Notes

### Remaining Code to Update

Some code may still use old date handling patterns. When updating:

1. Replace `timestamp.toDate()` with `toStandardDate(timestamp)`
2. Replace `new Date(year, month - 1, 1)` with `getMonthStartDate(year, month)`
3. Replace `date.getMonth() + 1` with `getStandardMonth(date)`
4. Replace manual date comparisons with standardized comparison functions

### Deprecated Patterns

**Do NOT use:**
- `timestamp.toDate()` directly (use `toStandardDate()`)
- `new Date(year, month - 1, 1)` for month start (use `getMonthStartDate()`)
- `date.getMonth()` for month number (use `getStandardMonth()`)
- Manual month comparisons (use `isDateInMonth()`, etc.)

---

## Future Enhancements

Potential improvements to consider:

1. **Timezone Support**: Add timezone-aware date handling if needed
2. **Date Formatting Utilities**: Standardize date display formatting
3. **Date Validation**: Add validation for date ranges and business rules
4. **Performance Optimization**: Cache month boundary calculations if needed

---

## Related Files

- `app.js`: Contains all standardized date utility functions (lines ~13-200)
- `calculateRentForMonth()`: Updated to use standardized utilities
- `calculateCurrentRent()`: Updated to use standardized utilities
- `setupYearNavigationWidget()`: Updated to navigate one year at a time

---

**Last Updated:** January 2025  
**Maintained by:** Proppli Development Team
