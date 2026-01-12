# Proppli Setup Checklist

Use this checklist to track your migration progress.

## ✅ Pre-Migration

- [ ] Reviewed `PROPPLI_DEPLOYMENT_PLAN.md`
- [ ] Reviewed `PROPPLI_QUICK_START.md`
- [ ] Created GitHub repository: `thomas-ryan-crosby/proppli`

## ✅ Firebase Setup

- [x] Created Firebase project: `proppli-production`
- [x] Created Firebase project: `proppli-staging`
- [x] Created Firebase project: `proppli-development` (optional)
- [x] Enabled Firestore Database in each project
- [x] Enabled Firebase Storage in each project
- [ ] Got Firebase config for production project
- [ ] Got Firebase config for staging project
- [ ] Got Firebase config for development project
- [ ] Updated `firebase-config.production.js` with production config
- [ ] Updated `firebase-config.staging.js` with staging config
- [ ] Updated `firebase-config.development.js` with development config
- [ ] Configured authorized domains in Firebase Console

## ✅ Code Updates

- [x] Created `firebase-config.production.js` template
- [x] Created `firebase-config.staging.js` template
- [x] Created `firebase-config.development.js` template
- [x] Updated `index.html` with Proppli domain detection
- [ ] Tested localhost with development config
- [ ] Verified environment detection works

## ✅ Repository Migration

- [ ] Added new remote: `git remote add proppli https://github.com/thomas-ryan-crosby/proppli.git`
- [ ] Pushed `phase1-development` branch as `development`
- [ ] Created and pushed `staging` branch
- [ ] Created and pushed `main` branch
- [ ] Verified branches exist in new repository

## ✅ Vercel Setup

- [ ] Created Vercel account (or logged in)
- [ ] Connected GitHub repository to Vercel
- [ ] Configured project settings:
  - [ ] Framework Preset: Other
  - [ ] Build Command: (empty)
  - [ ] Output Directory: .
- [ ] Added domain: `www.proppli.com` (production)
- [ ] Added domain: `staging.proppli.com` (staging)
- [ ] Got DNS records from Vercel

## ✅ Domain Configuration

- [ ] Logged into GoDaddy
- [ ] Navigated to DNS management for proppli.com
- [ ] Added CNAME record for `www` → Vercel
- [ ] Added CNAME record for `staging` → Vercel
- [ ] Added A record or CNAME for root domain (if needed)
- [ ] Waited for DNS propagation (can take up to 48 hours)

## ✅ Testing

- [ ] Tested localhost with development config
- [ ] Verified Firebase connection on localhost
- [ ] Deployed staging branch to Vercel
- [ ] Tested staging.proppli.com
- [ ] Verified Firebase connection on staging
- [ ] Deployed main branch to Vercel
- [ ] Tested www.proppli.com
- [ ] Verified Firebase connection on production
- [ ] Tested all features on each environment

## ✅ Post-Deployment

- [ ] Set up Firestore Security Rules (production)
- [ ] Set up Firestore Security Rules (staging)
- [ ] Set up Storage Security Rules (production)
- [ ] Set up Storage Security Rules (staging)
- [ ] Configured branch protection rules in GitHub
- [ ] Documented deployment process
- [ ] Set up monitoring (optional)

## 📝 Notes

- Firebase projects created: ✅
- Config files created: ✅
- Code updated: ✅
- Next: Fill in Firebase config values

---

**Current Status**: Ready to fill in Firebase configuration values

**Next Step**: Update the three config files with your actual Firebase project credentials
