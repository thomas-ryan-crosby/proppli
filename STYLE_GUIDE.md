# Proppli Style Guide

**Last Updated:** January 2025  
**Version:** 2.0 (Aligned with Brand Guidelines)

---

## Overview

This style guide defines the visual design system for Proppli, ensuring consistency across all interfaces and components. This guide aligns with the official Proppli brand guidelines and design principles.

---

## Design Principles

### 1. Calm UI
- **Whitespace first:** Generous spacing, minimal visual noise
- **Minimal borders:** Prefer spacing over lines
- **No visual noise:** Clean, uncluttered interfaces

### 2. Soft Geometry
- **Rounded corners:** Friendly forms, nothing sharp
- **Smooth transitions:** Gentle animations and interactions

### 3. Readable Density
- **Default comfortable spacing:** Easy to scan and read
- **Future:** "Compact" mode option for power users

### 4. Clear Hierarchy
- **One primary action per screen:** Clear focus
- **Secondary actions are quieter:** Less prominent but accessible

### 5. Accessible by Default
- **4.5:1 contrast minimum:** For body text (WCAG AA)
- **Clear focus rings:** Always visible keyboard navigation
- **Form errors:** Include text, not color-only indicators

---

## Color Palette

### Core Brand Colors

**Proppli Blue**
- Hex: `#2563EB`
- Usage: Primary buttons, active states, links, brand elements
- RGB: `rgb(37, 99, 235)`
- **This is the primary brand color (replaces previous purple)**

**Deep Slate**
- Hex: `#1F2937`
- Usage: Primary text color (never use pure black)
- RGB: `rgb(31, 41, 55)`

**Soft Blue**
- Hex: `#60A5FA`
- Usage: Info states, accents, hover effects
- RGB: `rgb(96, 165, 250)`

**Cloud White**
- Hex: `#FFFFFF`
- Usage: Backgrounds, cards, surfaces
- RGB: `rgb(255, 255, 255)`

**Mist Gray**
- Hex: `#E5E7EB`
- Usage: Borders, subtle dividers
- RGB: `rgb(229, 231, 235)`

### Extended UI Neutrals

**Backgrounds**
- Background: `#FFFFFF` - Main surfaces
- Subtle Background: `#F9FAFB` - Hover states, alternate rows
- Surface: `#FFFFFF` - Cards, modals

**Borders**
- Border: `#E5E7EB` - Default borders (Mist Gray)

**Text Colors**
- Primary Text: `#1F2937` - Deep Slate (main body text)
- Muted Text: `#6B7280` - Secondary text, placeholders
- Disabled: `#9CA3AF` - Disabled states

**Rule:** Keep neutrals in the gray family; avoid introducing new "brand" colors unless for status states.

### Status Colors (UI Only)

**Success**
- Hex: `#16A34A`
- Usage: Success states, positive actions
- RGB: `rgb(22, 163, 74)`

**Warning**
- Hex: `#F59E0B`
- Usage: Warning states, caution indicators
- RGB: `rgb(245, 158, 11)`

**Danger**
- Hex: `#DC2626`
- Usage: Error states, destructive actions
- RGB: `rgb(220, 38, 38)`

**Info**
- Hex: `#60A5FA` - Soft Blue
- Usage: Informational messages, info badges

### Legacy Colors (To Be Migrated)

**Note:** The application currently uses purple gradients (`#667eea` to `#764ba2`) in some areas. These should be migrated to Proppli Blue (`#2563EB`) over time, but functionality should not be broken during migration.

---

## Typography

### Font Family

**Primary Font:** `Inter` (Google Font)
- Fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- Usage: All text throughout the application

**Mono Font (Optional):**
- For IDs, logs, code: `ui-monospace` stack

### Type Scale

**Display**
- Size: `32px` (2rem)
- Line Height: `40px` (2.5rem)
- Weight: `600`
- Usage: Hero titles, major headings

**H1**
- Size: `24px` (1.5rem)
- Line Height: `32px` (2rem)
- Weight: `600`
- Usage: Page titles, primary headings

**H2**
- Size: `20px` (1.25rem)
- Line Height: `28px` (1.75rem)
- Weight: `600`
- Usage: Section headings

**H3**
- Size: `16px` (1rem)
- Line Height: `24px` (1.5rem)
- Weight: `600`
- Usage: Subsection headings

**Body**
- Size: `14px` (0.875rem)
- Line Height: `22px` (1.375rem)
- Weight: `400`
- Usage: Default body text, paragraphs

**Small**
- Size: `12px` (0.75rem)
- Line Height: `18px` (1.125rem)
- Weight: `400`
- Usage: Helper text, captions

**Label**
- Size: `12px` (0.75rem)
- Line Height: `16px` (1rem)
- Weight: `500`
- Usage: Form labels, table headers

### Text Usage Rules

- **Never use pure black** - Use Deep Slate (`#1F2937`) for primary text
- **Muted text** uses `#6B7280`
- **Links** are Proppli Blue (`#2563EB`); hover darkens slightly
- **Contrast:** Maintain 4.5:1 minimum for body text (WCAG AA)

---

## Spacing System

### Base Unit: 4px

All spacing uses a 4px base unit for consistency:

- **1** = `4px`
- **2** = `8px`
- **3** = `12px`
- **4** = `16px`
- **5** = `20px`
- **6** = `24px`
- **8** = `32px`
- **10** = `40px`
- **12** = `48px`

### Section Spacing

- **Between page sections:** `24px - 32px` (6-8 units)
- **Between form groups:** `16px - 24px` (4-6 units)
- **Within form groups:** `12px - 16px` (3-4 units)

---

## Layout

### Grid System

**App Shell**
- Left sidebar + top header + content area
- Sidebar: Fixed width (typically `260px`)
- Content: Flexible, max-width constrained where appropriate

**Content Max Widths**
- **Document pages:** `1100px - 1200px` (centered)
- **Tables/Dashboards:** Full-width allowed
- **Forms:** `600px - 800px` max width

### Spacing Guidelines

- **Whitespace first:** Prefer spacing over borders
- **Comfortable density:** Default spacing should feel spacious
- **Consistent rhythm:** Use the 4px base unit consistently

---

## Radii, Borders, Shadows

### Border Radius

**Inputs/Buttons:** `10px`
- Form inputs, buttons, small interactive elements

**Cards:** `16px`
- Card containers, feature cards

**Modals:** `18px`
- Modal dialogs, overlays

**Pills/Badges:** `999px` (fully rounded)
- Status badges, tags, pills

### Borders

**Default Border:** `1px solid #E5E7EB` (Mist Gray)

**Guidelines:**
- Avoid heavy dividers
- Prefer spacing over lines
- Use borders sparingly for definition

### Shadows (Subtle Only)

**Card Shadow:**
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```
- Soft shadow, no harsh outlines
- Use sparingly; prefer borders + subtle shadow

**Focus Ring:**
```css
box-shadow: 0 0 0 2px #2563EB;
outline: none; /* Only if replaced by ring */
```
- Always visible for keyboard navigation
- Proppli Blue color
- 2px ring with 2px offset

---

## Components

### Buttons

#### Variants

**Primary**
```css
background: #2563EB; /* Proppli Blue */
color: white;
border: none;
```

**Secondary**
```css
background: white;
color: #1F2937; /* Deep Slate */
border: 1px solid #E5E7EB; /* Mist Gray */
```

**Ghost**
```css
background: transparent;
color: #1F2937; /* Deep Slate */
border: none;
```

**Destructive**
```css
background: #DC2626; /* Danger */
color: white;
border: none;
```

#### Sizes

**Small (sm)**
- Height: `32px` (h-8)
- Padding: `12px` (px-3)
- Font: `12px/16px` (text-12/16)

**Medium (md)** - Default
- Height: `40px` (h-10)
- Padding: `16px` (px-4)
- Font: `14px/20px` (text-14/20)

**Large (lg)**
- Height: `44px` (h-11)
- Padding: `20px` (px-5)
- Font: `14px/20px` (text-14/20)

#### Rules

- **Primary used once per view** (generally)
- **Loading state:** Shows spinner left; disables click
- **Hover:** Darken background by ~6-8%
- **Focus:** Visible ring (Proppli Blue)
- **Disabled:** Reduce opacity + remove shadow + cursor-not-allowed

### Inputs

**Default (md)**
- Height: `40px`
- Border: `1px solid #E5E7EB` (Mist Gray)
- Border Radius: `10px`
- Padding: `12px 16px`
- Font: `14px/22px` (Body)

**Focus State**
```css
border-color: #2563EB; /* Proppli Blue */
box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
outline: none;
```

**Error State**
- Border: `1px solid #DC2626` (Danger)
- Helper text: Small red text below input
- Include text, not color-only indicator

**Disabled State**
- Background: `#F9FAFB`
- Border: `#E5E7EB`
- Color: `#9CA3AF`
- Cursor: `not-allowed`

### Cards

**Default**
```css
background: white;
border-radius: 16px;
border: 1px solid #E5E7EB; /* OR subtle shadow */
padding: 24px;
```

**Guidelines:**
- White background
- Border OR shadow (pick one; default is border + tiny shadow)
- Header area optional (title + actions)
- Hover: Subtle shadow increase OR border darken slightly

### Tables

**Default**
- Sticky header optional
- Row hover: `#F9FAFB` (Subtle background)
- Zebra striping optional for dense datasets
- Inline actions appear on hover for cleanliness

**Header**
```css
background: #F9FAFB;
border-bottom: 1px solid #E5E7EB;
padding: 12px 16px;
font-weight: 600;
font-size: 12px;
color: #1F2937;
```

**Row**
```css
border-bottom: 1px solid #E5E7EB;
transition: background-color 0.15s ease;
```

**Row Hover**
```css
background-color: #F9FAFB;
```

### Modals / Drawers

**Modal (Default)**
- Use for: "Confirm/edit small" actions
- Border Radius: `18px`
- Max Width: `600px` (small), `800px` (medium)
- Padding: `24px - 32px`

**Drawer**
- Use for: "Edit complex entity"
- Slides in from side
- Full height or partial

**Rules:**
- Always trap focus
- ESC to close
- Click outside closes (unless destructive flow)
- Focus ring visible on all interactive elements

### Navigation

**Sidebar Items**
- Icon + label layout
- Padding: `14px 20px`
- Font: `14px/20px`

**Active State**
```css
color: #2563EB; /* Proppli Blue */
background: rgba(37, 99, 235, 0.1); /* Very light blue */
```

**Hover State**
```css
background: #F9FAFB; /* Subtle background */
color: #2563EB; /* Proppli Blue */
```

**Collapsed Sidebar**
- Supports icon-only mode
- Tooltips on hover

### Badges

**Neutral Badge**
```css
background: #F9FAFB;
color: #6B7280;
padding: 4px 12px;
border-radius: 999px;
font-size: 12px;
font-weight: 500;
```

**Status Badges**
- Success: `#16A34A` background, white text
- Warning: `#F59E0B` background, white text
- Danger: `#DC2626` background, white text
- Info: `#60A5FA` background, white text

**Rules:**
- Keep text `12px`
- Padding tight (`4px 12px`)
- Fully rounded (`999px`)

---

## Interaction States

### Hover

**Buttons**
- Darken background by ~6-8%
- Smooth transition (`0.2s ease`)

**Cards**
- Subtle shadow increase OR border darken slightly
- Smooth transition (`0.2s ease`)

**Links**
- Darken Proppli Blue slightly
- Underline optional (prefer color change)

### Focus (Keyboard)

**Always Visible**
- Ring: Proppli Blue (`#2563EB`)
- Width: `2px`
- Offset: `2px`
- `outline: none` is NOT allowed unless replaced by ring

**Example:**
```css
&:focus {
    outline: none;
    box-shadow: 0 0 0 2px #2563EB;
}
```

### Disabled

**Visual State**
- Reduce opacity: `0.6`
- Remove shadow
- Cursor: `not-allowed`
- Background: `#F9FAFB` (if applicable)

### Loading

**Buttons**
- Show spinner left of text
- Disable click interaction
- Maintain visual state

---

## Accessibility Requirements

### Text Contrast

- **Body text:** Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text (18px+):** Minimum 3:1 contrast ratio
- **Never use pure black** - Use Deep Slate (`#1F2937`)

### Focus Indicators

- **Always visible:** Focus ring must be clearly visible
- **Color:** Proppli Blue (`#2563EB`)
- **Width:** `2px` minimum
- **Never remove:** `outline: none` only if replaced by visible ring

### Form Errors

- **Include text:** Always provide text description, not color-only
- **Visual indicator:** Red border + error text below input
- **ARIA:** Use `aria-describedby` to link error text

### Tap Targets

- **Minimum height:** `40px` for interactive elements
- **Spacing:** Adequate spacing between targets (`8px` minimum)

### Keyboard Navigation

- **Tab order:** Logical, intuitive flow
- **Focus trap:** In modals and drawers
- **ESC key:** Close modals/drawers
- **Enter/Space:** Activate buttons and links

---

## Responsive Design

### Breakpoints

**Mobile:** `max-width: 768px`
- Reduced font sizes
- Single column layouts
- Reduced padding/margins
- Stacked navigation elements

**Tablet:** `768px - 1024px`
- Two-column layouts where appropriate
- Adjusted spacing

**Desktop:** `1024px+`
- Full layout with sidebar
- Maximum content width: `1100px - 1200px`

### Mobile Adjustments

- Font sizes scale down proportionally
- Spacing reduces but maintains rhythm
- Touch targets remain `40px` minimum
- Sidebar collapses to icon-only or hidden

---

## CSS Variables (Recommended Implementation)

For easier theming and maintenance, consider using CSS variables:

```css
:root {
    /* Brand Colors */
    --color-brand-blue: #2563EB;
    --color-deep-slate: #1F2937;
    --color-soft-blue: #60A5FA;
    --color-cloud-white: #FFFFFF;
    --color-mist-gray: #E5E7EB;
    
    /* Neutrals */
    --color-background: #FFFFFF;
    --color-background-subtle: #F9FAFB;
    --color-border: #E5E7EB;
    --color-text: #1F2937;
    --color-text-muted: #6B7280;
    --color-disabled: #9CA3AF;
    
    /* Status Colors */
    --color-success: #16A34A;
    --color-warning: #F59E0B;
    --color-danger: #DC2626;
    --color-info: #60A5FA;
    
    /* Spacing (4px base) */
    --spacing-1: 4px;
    --spacing-2: 8px;
    --spacing-3: 12px;
    --spacing-4: 16px;
    --spacing-5: 20px;
    --spacing-6: 24px;
    --spacing-8: 32px;
    --spacing-10: 40px;
    --spacing-12: 48px;
    
    /* Border Radius */
    --radius-input: 10px;
    --radius-card: 16px;
    --radius-modal: 18px;
    --radius-pill: 999px;
    
    /* Typography */
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: ui-monospace, monospace;
}
```

---

## Migration Notes

### Current State vs. Brand Guide

**Colors to Migrate:**
- Purple gradients (`#667eea` to `#764ba2`) → Proppli Blue (`#2563EB`)
- Some existing colors may differ from brand guide
- Migration should be gradual to avoid breaking functionality

**Typography Adjustments:**
- Current font sizes may differ slightly from brand scale
- Align to brand type scale over time

**Component Updates:**
- Border radius: `8px` → `10px` (inputs/buttons)
- Card radius: `10px` → `16px`
- Modal radius: `12px` → `18px`

**Spacing:**
- Align to 4px base unit system
- Update section spacing to match guidelines

---

## Best Practices

### Do's

✅ Use Proppli Blue (`#2563EB`) as primary brand color  
✅ Use Deep Slate (`#1F2937`) for text (never pure black)  
✅ Maintain 4.5:1 contrast ratio for body text  
✅ Use 4px base unit for all spacing  
✅ Include visible focus rings on all interactive elements  
✅ Prefer spacing over borders  
✅ Use soft, rounded corners (10px+ radius)  
✅ Keep one primary action per screen  
✅ Include text with error states (not color-only)  
✅ Maintain minimum 40px tap targets  

### Don'ts

❌ Don't use pure black (`#000000`) for text  
❌ Don't remove focus indicators without replacement  
❌ Don't use color-only error indicators  
❌ Don't introduce new brand colors (use status colors for states)  
❌ Don't use sharp corners (maintain rounded geometry)  
❌ Don't create visual noise (keep it calm)  
❌ Don't skip accessibility requirements  
❌ Don't use inconsistent spacing (stick to 4px base)  

---

## Logo Usage

### Logo Files

- **Logo + Word:** `assets/images/logos/Logo+Word.png`
- **Logo Only:** `assets/images/logos/LogoOnly.png`
- **Word Only:** `assets/images/logos/WordOnly.png`

### Logo Sizes

- **Landing Page:** `80px` height
- **Sidebar:** `32px` height
- **Auth Pages:** `40px` height

---

*Style Guide maintained by Proppli Development Team*  
*Aligned with Official Brand Guidelines v2.0*
