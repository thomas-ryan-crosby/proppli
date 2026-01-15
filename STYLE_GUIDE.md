# Proppli Style Guide

**Last Updated:** January 2025  
**Version:** 1.0

---

## Overview

This style guide defines the visual design system for Proppli, ensuring consistency across all interfaces and components.

---

## Color Palette

### Primary Colors

**Primary Purple**
- Hex: `#667eea`
- Usage: Primary buttons, active states, links, brand elements
- RGB: `rgb(102, 126, 234)`

**Secondary Purple**
- Hex: `#764ba2`
- Usage: Gradient backgrounds, hover states, accents
- RGB: `rgb(118, 75, 162)`

**Primary Gradient**
- From: `#667eea` (0%)
- To: `#764ba2` (100%)
- Direction: `135deg`
- Usage: Landing page background, primary buttons, hero sections

### Neutral Colors

**Background Colors**
- Light Gray: `#E5E7EB` - Main body background
- Off-White: `#f5f7fa` - Application container background
- White: `#ffffff` - Cards, modals, sidebar

**Text Colors**
- Primary Text: `#1F2937` - Main body text
- Secondary Text: `#64748b` - Secondary text, inactive states
- Muted Text: `#6b7280` - Placeholders, helper text

**Border Colors**
- Light Border: `#e2e8f0` - Default borders
- Medium Border: `#E5E7EB` - Card borders
- Dark Border: `#d1d5db` - Strong borders

**Hover/Active States**
- Hover Background: `#f1f5f9` - Hover states for interactive elements
- Active Border: `#5568d3` - Active navigation border

### Semantic Colors

**Success**
- Background: `#d1fae5`
- Border: `#a7f3d0`
- Text: `#065f46`

**Error**
- Background: `#fee2e2`
- Border: `#fecaca`
- Text: `#991b1b`

**Info/Blue**
- Primary: `#2563EB`
- Hover: `#1d4ed8`
- Active: `#1e40af`

**Warning/Orange**
- Primary: `#f59e0b`
- Hover: `#d97706`

**Success/Green**
- Primary: `#22c55e`
- Hover: `#16a34a`

**Purple Accent**
- Primary: `#8b5cf6`
- Hover: `#7c3aed`

---

## Typography

### Font Family

**Primary Font:** `Inter`
- Fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- Usage: All text throughout the application

### Font Weights

- **300:** Light (rarely used)
- **400:** Regular (body text)
- **500:** Medium (labels, secondary headings)
- **600:** Semi-bold (buttons, emphasis)
- **700:** Bold (headings, strong emphasis)

### Font Sizes

**Headings**
- H1 (Landing Title): `4rem` (64px) - Desktop, `2.5rem` (40px) - Mobile
- H2 (Page Title): `24px` (1.5rem)
- H3 (Section Title): `1.3rem` (20.8px)
- H4 (Card Title): `1.1rem` (17.6px)

**Body Text**
- Large: `1.1rem` (17.6px)
- Default: `1rem` (16px)
- Small: `0.95rem` (15.2px)
- Extra Small: `0.9rem` (14.4px)
- Tiny: `0.75rem` (12px) - Table headers

**Special**
- Tagline: `1.5rem` (24px) - Desktop, `1.2rem` (19.2px) - Mobile
- Subtitle: `1.1rem` (17.6px) - Desktop, `1rem` (16px) - Mobile

### Line Height

- Default: `1.6` (body text)
- Tight: `1.4` (headings)
- Loose: `1.8` (spacious layouts)

### Letter Spacing

- Default: `0` (normal)
- Tight: `-0.02em` (large headings)
- Wide: `0.5px` (uppercase labels)

---

## Spacing System

### Padding

**Small:** `8px` - Tight spacing
**Medium:** `12px`, `14px`, `16px` - Standard spacing
**Large:** `20px`, `24px`, `30px` - Generous spacing
**Extra Large:** `40px` - Section spacing

### Margin

**Small:** `10px`, `12px` - Element spacing
**Medium:** `15px`, `20px` - Section spacing
**Large:** `30px`, `40px`, `60px` - Major section spacing

### Border Radius

**Small:** `6px` - Small elements
**Medium:** `8px` - Buttons, inputs, cards (default)
**Large:** `10px` - Large cards
**Extra Large:** `16px` - Feature cards, landing page elements

---

## Components

### Buttons

#### Primary Button
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
padding: 14px 24px;
border-radius: 8px;
font-size: 1rem;
font-weight: 600;
transition: all 0.3s ease;
```

**Hover State:**
```css
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
```

#### Secondary Button
```css
background: #f0f0f0;
color: #333;
padding: 10px 20px;
border-radius: 8px;
font-size: 14px;
font-weight: 500;
```

**Hover State:**
```css
background: #e0e0e0;
```

#### Button Sizes
- **Default:** `padding: 10px 20px`, `font-size: 14px`
- **Large:** `padding: 15px 30px`, `font-size: 16px`
- **Small:** `padding: 12px 24px`, `font-size: 16px` (landing page)

### Cards

#### Standard Card
```css
background: white;
border-radius: 10px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
border: 1px solid #E5E7EB;
padding: 20px 30px;
```

#### Feature Card (Landing Page)
```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(10px);
border-radius: 16px;
padding: 30px;
border: 1px solid rgba(255, 255, 255, 0.2);
```

**Hover State:**
```css
background: rgba(255, 255, 255, 0.25);
transform: translateY(-5px);
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
```

### Forms

#### Input Fields
```css
width: 100%;
padding: 12px;
border: 1px solid #e2e8f0;
border-radius: 8px;
font-size: 1rem;
font-family: 'Inter', sans-serif;
background: white;
color: #1F2937;
```

**Focus State:**
```css
border-color: #667eea;
outline: none;
box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
```

#### Labels
```css
display: block;
margin-bottom: 8px;
font-weight: 500;
color: #374151;
font-size: 0.9rem;
```

#### Form Groups
```css
margin-bottom: 20px;
```

### Navigation

#### Sidebar Navigation
- **Width:** `260px`
- **Background:** `white`
- **Border:** `1px solid #e2e8f0`
- **Shadow:** `2px 0 8px rgba(0, 0, 0, 0.05)`

#### Navigation Link
```css
padding: 14px 20px;
color: #64748b;
font-size: 15px;
font-weight: 500;
transition: all 0.2s;
```

**Hover State:**
```css
background: #f1f5f9;
color: #667eea;
```

**Active State:**
```css
background: #667eea;
color: white;
border-left: 3px solid #5568d3;
```

### Modals

#### Modal Overlay
```css
background: rgba(0, 0, 0, 0.5);
backdrop-filter: blur(4px);
```

#### Modal Content
```css
background: white;
border-radius: 12px;
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
max-width: 600px;
padding: 30px;
```

### Tables

#### Table Header
```css
background: #f8fafc;
border-bottom: 2px solid #e5e7eb;
padding: 12px 16px;
font-weight: 600;
color: #374151;
font-size: 0.75rem;
text-transform: uppercase;
letter-spacing: 0.5px;
```

#### Table Row
```css
border-bottom: 1px solid #f3f4f6;
transition: background-color 0.15s ease;
```

**Hover State:**
```css
background-color: #f9fafb;
```

#### Table Cell
```css
padding: 14px 16px;
color: #1F2937;
```

### Badges & Status Indicators

#### Status Badge
```css
display: inline-block;
padding: 4px 12px;
border-radius: 12px;
font-size: 0.75rem;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
```

**Status Colors:**
- Active: `background: #d1fae5`, `color: #065f46`
- Inactive: `background: #fee2e2`, `color: #991b1b`
- Pending: `background: #fef3c7`, `color: #92400e`

### Floating Action Buttons (FABs)

#### Primary FAB
```css
width: 56px;
height: 56px;
border-radius: 50%;
background: #667eea;
color: white;
font-size: 28px;
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
transition: all 0.3s ease;
```

**Hover State:**
```css
background: #5568d3;
box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
transform: scale(1.05);
```

#### Secondary FABs
- Green: `#22c55e` (Add Contact)
- Purple: `#8b5cf6` (Add Building)
- Orange: `#f59e0b` (Add Unit)

---

## Layout

### Grid System

**Landing Page Features**
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 30px;
```

**Metrics Dashboard**
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: 20px;
```

### Container Widths

- **Max Content Width:** `1400px` (top bar, main content)
- **Landing Page Max:** `1200px`
- **Modal Max Width:** `600px`

### Sidebar Layout

- **Sidebar Width:** `260px` (fixed)
- **Main Content Margin:** `260px` (to account for sidebar)

---

## Shadows

### Elevation Levels

**Level 1 (Subtle)**
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

**Level 2 (Medium)**
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
```

**Level 3 (Elevated)**
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
```

**Level 4 (High)**
```css
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
```

**Level 5 (Modal)**
```css
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
```

### Colored Shadows

**Primary Purple Shadow:**
```css
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
```

**Hover Shadow:**
```css
box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
```

---

## Animations & Transitions

### Transitions

**Standard:** `transition: all 0.3s ease;`
**Fast:** `transition: all 0.2s ease;`
**Slow:** `transition: all 0.5s ease;`

### Common Animations

**Slide Down:**
```css
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

**Hover Lift:**
```css
transform: translateY(-2px);
```

**Hover Scale:**
```css
transform: scale(1.05);
```

---

## Responsive Design

### Breakpoints

**Mobile:** `max-width: 768px`
- Landing title: `2.5rem` (from `4rem`)
- Tagline: `1.2rem` (from `1.5rem`)
- Features grid: Single column
- Padding: Reduced

### Mobile Adjustments

- Reduced font sizes
- Single column layouts
- Reduced padding/margins
- Stacked navigation elements

---

## Accessibility

### Color Contrast

- Text on white: Minimum 4.5:1 ratio
- Text on colored backgrounds: Minimum 4.5:1 ratio
- Interactive elements: Clear focus states

### Focus States

```css
outline: none;
box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
```

### Interactive Elements

- Minimum touch target: `44px × 44px`
- Clear hover states
- Visual feedback on interactions

---

## Best Practices

### Do's

✅ Use the defined color palette consistently  
✅ Maintain consistent spacing using the spacing system  
✅ Use Inter font family for all text  
✅ Apply appropriate border radius (8px default)  
✅ Include hover and focus states for interactive elements  
✅ Use semantic colors for status indicators  
✅ Maintain consistent shadow elevations  

### Don'ts

❌ Don't use colors outside the defined palette  
❌ Don't mix different font families  
❌ Don't use inconsistent spacing  
❌ Don't skip hover/focus states  
❌ Don't use hard-coded colors (use CSS variables if possible)  
❌ Don't create custom components without referencing this guide  

---

## CSS Variables (Future Enhancement)

Consider migrating to CSS variables for easier theming:

```css
:root {
    --color-primary: #667eea;
    --color-secondary: #764ba2;
    --color-background: #f5f7fa;
    --color-text: #1F2937;
    --color-border: #e2e8f0;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
}
```

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
