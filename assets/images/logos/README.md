# proppli Logo Files

This directory contains all official proppli logo files.

## Files

### LogoOnly.png
- **Description:** Icon only (rounded hex-style mark)
- **Use for:** 
  - Favicons
  - App icons
  - Merch (icon-only applications)
  - Small UI elements
- **Minimum size:** 24px height

### WordOnly.png
- **Description:** Wordmark only (lowercase "proppli")
- **Use for:**
  - Horizontal layouts
  - Wordmark-only applications
  - Text-heavy designs
- **Minimum size:** 80px width

### Logo+Word.png
- **Description:** Full logo (icon + wordmark)
- **Use for:**
  - Primary branding
  - Headers
  - Marketing materials
  - Main navigation
- **Minimum size:** 80px width

## Usage Guidelines

1. **Always lowercase** - The wordmark is always lowercase "proppli"
2. **Clear space** - Maintain clear space equal to the height of the letter "o" around the logo
3. **No modifications** - Never outline, add shadows, glows, textures, rotate, or skew the logo
4. **Minimum sizes** - Respect minimum size requirements for readability

## Implementation Examples

### HTML
```html
<!-- Full Logo -->
<img src="assets/images/logos/Logo+Word.png" alt="proppli" height="40">

<!-- Icon Only -->
<img src="assets/images/logos/LogoOnly.png" alt="proppli" height="24">

<!-- Wordmark Only -->
<img src="assets/images/logos/WordOnly.png" alt="proppli" height="24">
```

### Favicon
```html
<link rel="icon" type="image/png" href="assets/images/logos/LogoOnly.png">
```

For complete brand guidelines, see [BRAND_GUIDE.md](../../../BRAND_GUIDE.md) in the root directory.
