# Development Guide

## Viewing Development Changes

Since GitHub Pages deploys from the `main` branch, here are the best ways to preview changes from the `phase1-development` branch:

### Option 1: Run Locally (Recommended for Quick Testing)

1. **Checkout the development branch:**
   ```bash
   git checkout phase1-development
   ```

2. **Start a local web server:**

   **Using Python (if installed):**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Using Node.js (if installed):**
   ```bash
   npx http-server -p 8000
   ```

   **Using PHP (if installed):**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:8000`
   - Your development changes will be visible

### Option 2: GitHub Actions Preview Deployment

Create a GitHub Actions workflow that deploys the development branch to a separate preview URL.

**Create `.github/workflows/preview-deploy.yml`:**
```yaml
name: Deploy Preview

on:
  push:
    branches:
      - phase1-development

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          destination_dir: preview
```

Then enable GitHub Pages to serve from the `gh-pages` branch, and access at:
`https://yourusername.github.io/maintenance-tracker/preview/`

### Option 3: Use Netlify Drop (Easiest for Quick Previews)

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop your project folder (after checking out `phase1-development`)
3. Get an instant preview URL
4. Re-deploy by dragging the folder again when you make changes

### Option 4: Use Vercel (Similar to Netlify)

1. Install Vercel CLI: `npm i -g vercel`
2. Checkout development branch: `git checkout phase1-development`
3. Run: `vercel`
4. Get a preview URL instantly

### Option 5: Create a Separate Preview Repository

1. Create a new repository (e.g., `maintenance-tracker-preview`)
2. Push the development branch there
3. Enable GitHub Pages on that repository
4. Access at: `https://yourusername.github.io/maintenance-tracker-preview/`

## Recommended Workflow

1. **For daily development:** Use Option 1 (local server) - fastest and easiest
2. **For sharing with team/stakeholders:** Use Option 2 (GitHub Actions) or Option 3 (Netlify Drop)
3. **For production:** Keep `main` branch deployed to GitHub Pages

## Switching Between Branches

```bash
# Switch to development branch
git checkout phase1-development

# Switch back to main (production)
git checkout main

# Pull latest changes
git pull origin main
git pull origin phase1-development
```

## Before Merging to Main

1. Test thoroughly on the development branch
2. Ensure all features work correctly
3. Test with real Firebase data (or use a test Firebase project)
4. Create a pull request from `phase1-development` to `main`
5. Review and merge when ready

