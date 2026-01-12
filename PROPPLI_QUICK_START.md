# Proppli Migration - Quick Start Guide

This is a step-by-step guide to get you started with the migration immediately.

## Step 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com/new
2. Repository name: `proppli`
3. Description: "Property Management Platform"
4. Set to **Private** (or Public, your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we'll push existing code)
6. Click "Create repository"

## Step 2: Push Code to New Repository (10 minutes)

Run these commands in your current `maintenance-tracker` directory:

```bash
# Add the new repository as a remote
git remote add proppli https://github.com/thomas-ryan-crosby/proppli.git

# Push the current phase1-development branch as 'development'
git push proppli phase1-development:development

# Create and push staging branch
git checkout -b staging
git push proppli staging

# Create and push main branch
git checkout -b main
git push proppli main

# Switch back to development
git checkout phase1-development
```

## Step 3: Create Firebase Projects (15 minutes)

### Production Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Project name: `proppli-production`
4. Disable Google Analytics (or enable if you want it)
5. Click "Create project"
6. Once created:
   - Go to **Firestore Database** → Create database → Start in test mode
   - Go to **Storage** → Get started → Start in test mode
   - Go to **Project Settings** (gear icon) → Your apps → Add web app
   - App nickname: `proppli-web`
   - Copy the config object

### Staging Project
1. Repeat above steps with project name: `proppli-staging`
2. Get the config object

### Development Project (Optional)
1. Repeat above steps with project name: `proppli-development`
2. Get the config object

## Step 4: Create Configuration Files (10 minutes)

I'll help you create these files. You'll need to:
1. Replace the placeholder values with your actual Firebase configs
2. Save them in your project root

## Step 5: Update index.html (5 minutes)

We need to add environment detection to load the correct config file.

## Step 6: Connect to Vercel (10 minutes)

1. Go to https://vercel.com/
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import `thomas-ryan-crosby/proppli`
5. Configure:
   - Framework Preset: **Other**
   - Root Directory: `.`
   - Build Command: (leave empty)
   - Output Directory: `.`
6. Click "Deploy"

## Step 7: Configure Domains in Vercel (5 minutes)

1. In Vercel project settings → Domains
2. Add `www.proppli.com`
3. Add `staging.proppli.com`
4. Copy the DNS records Vercel provides

## Step 8: Update GoDaddy DNS (10 minutes)

1. Log in to GoDaddy
2. Go to My Products → Domains → proppli.com → DNS
3. Add the CNAME records Vercel provided
4. Wait for DNS propagation (can take up to 48 hours, usually much faster)

## Step 9: Test (10 minutes)

1. Once DNS propagates, visit `staging.proppli.com`
2. Test the application
3. If working, merge staging to main
4. Test `www.proppli.com`

---

## Ready to Start?

Let me know when you're ready and I can:
1. Help you create the Firebase config files
2. Update the index.html for environment detection
3. Create a vercel.json if needed
4. Update the README with new project info

Just say "let's start" and I'll begin creating the necessary files!
