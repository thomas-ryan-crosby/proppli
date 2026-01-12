# Proppli Deployment & Migration Plan

## Overview
This document outlines the complete plan for migrating the maintenance-tracker project to the new Proppli project, setting up production and staging environments, and deploying to www.proppli.com.

---

## 1. Repository Structure & Branching Strategy

### Branch Structure
```
main (production)
├── staging
    └── development
```

**Branch Purposes:**
- **`main`**: Production-ready code, deployed to www.proppli.com
- **`staging`**: Pre-production testing, deployed to staging.proppli.com
- **`development`**: Active development work (current phase1-development branch)

### Branch Protection Rules (Recommended)
- **main**: Require pull request reviews, require status checks, no direct pushes
- **staging**: Require pull request reviews, allow direct pushes from development
- **development**: Allow direct pushes, no restrictions

---

## 2. Firebase Projects Setup

### Required Firebase Projects
1. **Production Firebase Project** (`proppli-production`)
   - Used by `main` branch
   - Production database, storage, and authentication
   - Domain: www.proppli.com

2. **Staging Firebase Project** (`proppli-staging`)
   - Used by `staging` branch
   - Staging database, storage, and authentication
   - Domain: staging.proppli.com

3. **Development Firebase Project** (`proppli-development`) - Optional
   - Used by `development` branch
   - Development/testing database

### Firebase Configuration Files
Create environment-specific config files:
- `firebase-config.production.js` - Production config
- `firebase-config.staging.js` - Staging config
- `firebase-config.development.js` - Development config (optional)

### Firebase Setup Steps
1. Create three Firebase projects in Firebase Console
2. Enable Firestore Database for each
3. Enable Firebase Storage for each
4. Set up Firestore Security Rules (start with test mode, then secure)
5. Set up Storage Security Rules
6. Get configuration for each project
7. Configure authorized domains in Firebase Console:
   - Production: `www.proppli.com`, `proppli.com`
   - Staging: `staging.proppli.com`
   - Development: `localhost`

---

## 3. Environment Configuration

### Environment Detection Strategy
The app should automatically detect the environment based on:
- **Production**: `window.location.hostname === 'www.proppli.com' || window.location.hostname === 'proppli.com'`
- **Staging**: `window.location.hostname === 'staging.proppli.com'`
- **Development**: `window.location.hostname === 'localhost'` or other

### Configuration Loading
Modify `index.html` to load the appropriate config:
```html
<!-- Load Firebase config based on environment -->
<script>
    const hostname = window.location.hostname;
    let configFile = 'firebase-config.development.js';
    
    if (hostname === 'www.proppli.com' || hostname === 'proppli.com') {
        configFile = 'firebase-config.production.js';
    } else if (hostname === 'staging.proppli.com') {
        configFile = 'firebase-config.staging.js';
    }
    
    document.write('<script src="' + configFile + '"><\/script>');
</script>
```

---

## 4. Vercel Deployment Setup

### Why Vercel?
- Excellent for static sites and frontend deployments
- Automatic HTTPS
- Easy domain configuration
- Environment variable management
- Preview deployments for PRs

### Vercel Configuration

#### Project Setup
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: (none - static site)
   - **Output Directory**: `.` (root)
   - **Install Command**: (none)

#### Environment Variables
Set in Vercel dashboard for each environment:
- Production: Firebase config (if needed for build)
- Staging: Firebase config (if needed for build)
- Development: Firebase config (if needed for build)

#### Deployment Settings
- **Production Branch**: `main` → Deploy to www.proppli.com
- **Staging Branch**: `staging` → Deploy to staging.proppli.com
- **Preview Deployments**: Enable for all branches

#### Domain Configuration
1. In Vercel dashboard, go to Project Settings → Domains
2. Add `www.proppli.com` and `proppli.com` (production)
3. Add `staging.proppli.com` (staging)
4. Vercel will provide DNS records to add in GoDaddy

---

## 5. GoDaddy Domain Configuration

### DNS Records to Add
Add these records in GoDaddy DNS management:

#### For Production (www.proppli.com)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 1 Hour
```

#### For Root Domain (proppli.com)
```
Type: A
Name: @
Value: [Vercel IP - provided by Vercel]
TTL: 1 Hour
```

OR

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 1 Hour
```

#### For Staging (staging.proppli.com)
```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 1 Hour
```

### SSL Certificate
- Vercel automatically provisions SSL certificates via Let's Encrypt
- No manual SSL configuration needed

---

## 6. Railway Setup (If Needed)

### When to Use Railway
Railway is useful if you need:
- Backend API services
- Server-side rendering
- Background jobs
- Database hosting (PostgreSQL, MySQL, etc.)

### For This Project
Since this is a static frontend + Firebase backend:
- **Vercel**: Frontend deployment (recommended)
- **Firebase**: Backend (Firestore, Storage, Auth)
- **Railway**: Not needed initially, but can be added later for:
  - API proxy services
  - Webhook handlers
  - Scheduled tasks

### Railway Setup (Future)
If needed later:
1. Create Railway account
2. Connect GitHub repository
3. Deploy service
4. Configure environment variables
5. Set up custom domain if needed

---

## 7. Migration Steps

### Phase 1: Repository Migration

#### Step 1.1: Create New Repository
1. Create new repository: `thomas-ryan-crosby/proppli` on GitHub
2. Initialize with README (optional)

#### Step 1.2: Push Current Branch
```bash
# In maintenance-tracker directory
git remote add proppli https://github.com/thomas-ryan-crosby/proppli.git
git push proppli phase1-development:development
```

#### Step 1.3: Create Branch Structure
```bash
# Create staging branch
git checkout -b staging
git push proppli staging

# Create main branch (from staging)
git checkout -b main
git push proppli main
```

### Phase 2: Firebase Setup

#### Step 2.1: Create Firebase Projects
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create three projects:
   - `proppli-production`
   - `proppli-staging`
   - `proppli-development` (optional)

#### Step 2.2: Configure Each Project
For each project:
1. Enable Firestore Database
2. Enable Firebase Storage
3. Get web app configuration
4. Copy config to appropriate `firebase-config.*.js` file

#### Step 2.3: Set Up Security Rules
- Start with test mode rules for initial setup
- Later implement proper authentication and rules

### Phase 3: Code Updates

#### Step 3.1: Create Environment Config Files
1. Create `firebase-config.production.js`
2. Create `firebase-config.staging.js`
3. Create `firebase-config.development.js`
4. Update `index.html` to load config based on environment

#### Step 3.2: Update Project Name
1. Update `README.md` with Proppli branding
2. Update any references from "maintenance-tracker" to "proppli"
3. Update title in `index.html`

#### Step 3.3: Add Environment Detection
Modify `index.html` to include environment detection script

### Phase 4: Vercel Deployment

#### Step 4.1: Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import GitHub repository: `thomas-ryan-crosby/proppli`
4. Configure project settings

#### Step 4.2: Configure Domains
1. Add `www.proppli.com` to production
2. Add `staging.proppli.com` to staging branch
3. Get DNS records from Vercel

#### Step 4.3: Update GoDaddy DNS
1. Log in to GoDaddy
2. Go to DNS management for proppli.com
3. Add CNAME records as provided by Vercel

### Phase 5: Testing

#### Step 5.1: Test Staging
1. Push to `staging` branch
2. Verify deployment at `staging.proppli.com`
3. Test Firebase connection
4. Verify all functionality

#### Step 5.2: Test Production
1. Merge `staging` to `main`
2. Verify deployment at `www.proppli.com`
3. Test Firebase connection
4. Verify all functionality

---

## 8. Development Workflow

### Daily Development
1. Work on `development` branch
2. Test locally with development Firebase project
3. Commit and push to `development`

### Staging Deployment
1. Create PR from `development` → `staging`
2. Review and merge
3. Vercel automatically deploys to `staging.proppli.com`
4. Test on staging environment

### Production Deployment
1. Create PR from `staging` → `main`
2. Review and merge (with approval)
3. Vercel automatically deploys to `www.proppli.com`
4. Monitor production

---

## 9. File Structure Updates

### New Files to Create
```
proppli/
├── firebase-config.production.js
├── firebase-config.staging.js
├── firebase-config.development.js
├── vercel.json (optional, for custom config)
├── .vercelignore (optional)
└── .gitignore (update to exclude config files)
```

### Files to Update
- `index.html` - Add environment detection
- `README.md` - Update project name and deployment info
- `.gitignore` - Ensure config files are excluded (or included based on strategy)

---

## 10. Security Considerations

### Firebase Config Files
**Option A: Exclude from Git (Recommended)**
- Add to `.gitignore`
- Manually configure in Vercel environment variables
- Use build-time injection

**Option B: Include in Git (Current Approach)**
- Firebase web API keys are safe to expose
- Security comes from Firestore rules
- Simpler deployment

### Firestore Security Rules
- Start with test mode for initial setup
- Implement authentication
- Create proper rules based on user roles
- Test rules in staging before production

### Environment Variables
- Never commit sensitive keys
- Use Vercel environment variables for secrets
- Different values for production/staging

---

## 11. Monitoring & Maintenance

### Monitoring
- Vercel Analytics (optional)
- Firebase Performance Monitoring
- Firebase Crashlytics (if using)
- Custom error tracking

### Backup Strategy
- Firestore automatic backups (enable in Firebase Console)
- Regular exports of critical data
- Version control for code

---

## 12. Next Steps (Immediate Actions)

### Priority 1: Repository Migration
1. ✅ Create GitHub repository: `thomas-ryan-crosby/proppli`
2. ✅ Push `phase1-development` branch as `development`
3. ✅ Create `staging` and `main` branches

### Priority 2: Firebase Setup
1. ✅ Create Firebase projects (production, staging)
2. ✅ Enable Firestore and Storage
3. ✅ Get configuration for each
4. ✅ Create config files

### Priority 3: Code Updates
1. ✅ Create environment-specific config files
2. ✅ Update `index.html` for environment detection
3. ✅ Update project branding

### Priority 4: Vercel Deployment
1. ✅ Connect repository to Vercel
2. ✅ Configure build settings
3. ✅ Set up domain configuration
4. ✅ Get DNS records

### Priority 5: Domain Configuration
1. ✅ Update GoDaddy DNS records
2. ✅ Wait for DNS propagation (up to 48 hours)
3. ✅ Verify SSL certificates

### Priority 6: Testing
1. ✅ Test staging deployment
2. ✅ Test production deployment
3. ✅ Verify Firebase connections
4. ✅ Test all functionality

---

## 13. Rollback Plan

### If Issues Occur
1. **Vercel**: Revert to previous deployment via Vercel dashboard
2. **Code**: Revert commits and push
3. **Firebase**: Restore from backup if data issues
4. **DNS**: Revert DNS changes in GoDaddy

---

## 14. Checklist

### Pre-Migration
- [ ] Create GitHub repository
- [ ] Create Firebase projects
- [ ] Plan branch structure
- [ ] Review current codebase

### Migration
- [ ] Push code to new repository
- [ ] Create branch structure
- [ ] Set up Firebase projects
- [ ] Create config files
- [ ] Update code for environment detection

### Deployment
- [ ] Connect Vercel to repository
- [ ] Configure Vercel settings
- [ ] Set up domains in Vercel
- [ ] Update GoDaddy DNS
- [ ] Wait for DNS propagation

### Testing
- [ ] Test staging deployment
- [ ] Test production deployment
- [ ] Verify Firebase connections
- [ ] Test all features
- [ ] Verify SSL certificates

### Post-Deployment
- [ ] Set up monitoring
- [ ] Document deployment process
- [ ] Train team on workflow
- [ ] Set up backups

---

## 15. Support & Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GoDaddy DNS Help](https://www.godaddy.com/help)

### Tools
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase Console](https://console.firebase.google.com/)
- [GoDaddy Domain Manager](https://www.godaddy.com/)

---

## Questions to Answer Before Starting

1. **Firebase Config Strategy**: Include config files in Git or use environment variables?
2. **Domain Strategy**: Use www.proppli.com only, or also proppli.com (redirect)?
3. **Staging Domain**: Use staging.proppli.com or subdomain.proppli.com?
4. **Backup Strategy**: How often to backup Firestore data?
5. **Monitoring**: What level of monitoring is needed?

---

## Estimated Timeline

- **Repository Migration**: 1 hour
- **Firebase Setup**: 2-3 hours
- **Code Updates**: 2-3 hours
- **Vercel Deployment**: 1 hour
- **DNS Configuration**: 30 minutes
- **Testing**: 2-3 hours
- **Total**: ~10-12 hours (can be done in phases)

---

*Last Updated: [Current Date]*
*Version: 1.0*
