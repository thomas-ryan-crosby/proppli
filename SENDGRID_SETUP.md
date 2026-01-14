# SendGrid Setup Guide for Proppli

This guide will help you set up SendGrid for all email functionality in Proppli, including Firebase Auth emails and Cloud Functions emails.

## Overview

SendGrid will handle:
- ✅ **Firebase Auth emails** (password reset, email verification)
- ✅ **Cloud Functions emails** (user invitations, account activations)

## Step 1: Create SendGrid Account

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Click **"Start for free"** or **"Sign Up"**
3. Fill in your information:
   - Email address
   - Password
   - Company name (optional)
4. Verify your email address
5. Complete the account setup

**Note:** Free tier includes 100 emails/day forever - perfect for getting started!

## Step 2: Choose Integration Method

SendGrid will ask you to choose between **Web API** or **SMTP Relay**.

**Choose: SMTP Relay** ✅

**Why SMTP?**
- Works with both Firebase Auth (requires SMTP) and Cloud Functions (using Nodemailer)
- Simpler setup - one configuration for everything
- No code changes needed

**Note:** Web API is more efficient, but requires code changes. We'll use SMTP for simplicity.

1. On the SendGrid setup page, click **"Choose"** under **SMTP Relay**
2. You'll be taken to the API key creation page

## Step 3: Create SendGrid API Key

1. You should now be on the API Keys page
2. Click **"Create API Key"**
3. Choose **"Full Access"** (or "Restricted Access" with Mail Send permissions)
4. Give it a name: `Proppli Email Service`
5. Click **"Create & View"**
6. **IMPORTANT:** Copy the API key immediately - you won't be able to see it again!
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Save it somewhere secure (password manager, etc.)

## Step 4: Verify Sender Identity (Required for Production)

SendGrid requires you to verify your sender identity before sending emails.

### Option A: Single Sender Verification (Easiest - Good for Testing)

1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Click **"Create New Sender"**
4. Fill in the form:
   - **From Email Address:** `noreply@yourdomain.com` (or your email)
   - **From Name:** `Proppli` (or your company name)
   - **Reply To:** Your support email
   - **Company Address:** Your business address
   - **City, State, Zip:** Your location
   - **Country:** Your country
5. Click **"Create"**
6. Check your email inbox for verification email
7. Click the verification link in the email
8. ✅ Sender verified!

### Option B: Domain Authentication (Recommended for Production)

1. Go to **Settings** → **Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Select your DNS provider (or "Other")
4. Enter your domain (e.g., `yourdomain.com`)
5. SendGrid will provide DNS records to add:
   - CNAME records
   - TXT records
6. Add these records to your domain's DNS settings
7. Wait for DNS propagation (can take up to 48 hours)
8. Click **"Verify"** in SendGrid
9. ✅ Domain verified!

**Note:** Domain authentication is better for deliverability and allows you to send from any email address on that domain.

## Step 5: Configure Firebase Cloud Functions

### 5.1 Install Dependencies

```bash
cd functions
npm install
```

### 5.2 Set Firebase Functions Config

Set your SendGrid API key in Firebase Functions config:

```bash
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY_HERE"
```

Replace `YOUR_SENDGRID_API_KEY_HERE` with the API key you copied in Step 2.

**Example:**
```bash
firebase functions:config:set sendgrid.api_key="SG.abc123xyz789..."
```

### 5.3 Set Email Configuration

Set your email "from" address and app URL:

```bash
firebase functions:config:set email.from="noreply@yourdomain.com" app.url="https://your-app-url.com"
```

**Example:**
```bash
firebase functions:config:set email.from="noreply@proppli.com" app.url="https://proppli.com"
```

**Important:** The `email.from` address must match your verified sender in SendGrid!

### 5.4 Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Wait for deployment to complete. You should see:
```
✔  functions[sendInvitationEmail]: Successful create operation.
✔  functions[sendActivationEmail]: Successful create operation.
✔  functions[onInvitationCreated]: Successful create operation.
✔  functions[onUserActivated]: Successful create operation.
```

## Step 6: Configure Firebase Auth SMTP (For Password Reset & Verification)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., `proppli-production`)
3. Go to **Authentication** → **Templates** tab
4. Click **SMTP settings** (gear icon in left sidebar)
5. Click **"Configure SMTP"**
6. Enter SendGrid SMTP settings:
   - **Host:** `smtp.sendgrid.net`
   - **Port:** `587`
   - **Username:** `apikey` (literally the word "apikey")
   - **Password:** Your SendGrid API key (the same one from Step 2)
   - **Enable TLS:** Yes (checked)
7. Click **"Test connection"**
8. You should see: ✅ "Connection successful"
9. Click **"Save"**

## Step 7: Customize Firebase Auth Email Templates

1. Still in **Authentication** → **Templates**
2. Click on **"Password reset"** template
3. Customize:
   - **Sender name:** `Proppli` (or your company name)
   - **From:** Your verified SendGrid email (e.g., `noreply@yourdomain.com`)
   - **Reply to:** Your support email
   - **Subject:** Customize if desired (default is fine)
   - **Message body:** Customize if desired
4. Click **"Save"**
5. Repeat for **"Email address verification"** template if desired

## Step 8: Test Everything

### Test 1: Password Reset Email

1. Go to your app's password reset page
2. Enter a valid user email
3. Click "Send Reset Link"
4. Check email inbox (and spam folder)
5. ✅ You should receive the password reset email

### Test 2: User Invitation Email

1. Log in as admin
2. Go to User Management
3. Click "Invite User"
4. Fill in the form
5. Check "Send invitation email"
6. Submit
7. Check the invited user's email inbox
8. ✅ They should receive the invitation email

### Test 3: Account Activation Email

1. Log in as admin
2. Go to User Management
3. Find an inactive user
4. Click "Activate"
5. Check the user's email inbox
6. ✅ They should receive the activation email

## Step 9: Monitor Email Delivery

### In SendGrid Dashboard

1. Go to **Activity** → **Email Activity**
2. See all sent emails
3. Check delivery status:
   - ✅ Delivered
   - ⚠️ Bounced
   - ⚠️ Blocked
   - ⚠️ Spam Report

### In Firebase Console

1. Go to **Functions** → **Logs**
2. Check for email-related errors
3. Look for "Invitation email sent" or "Activation email sent" messages

## Troubleshooting

### Emails Not Sending from Cloud Functions

**Error: "Invalid API key"**
- Verify API key is correct: `firebase functions:config:get`
- Check for typos or extra spaces
- Regenerate API key in SendGrid if needed

**Error: "Authentication failed"**
- Verify username is exactly `apikey` (lowercase, no spaces)
- Check API key has "Mail Send" permissions
- Try regenerating the API key

**Error: "Connection timeout"**
- Check firewall settings
- Verify port 587 is not blocked
- Try port 465 with `secure: true` in functions/index.js

### Emails Not Sending from Firebase Auth

**Error: "SMTP connection failed"**
- Verify SMTP settings in Firebase Console
- Check username is `apikey` (not your SendGrid username)
- Verify API key is correct
- Test connection in Firebase Console

**Emails Going to Spam**
- Complete domain authentication (Step 3, Option B)
- Set up SPF/DKIM records (SendGrid provides these)
- Warm up your sending domain gradually
- Avoid spam trigger words in subject lines

### Check Function Logs

```bash
firebase functions:log
```

Look for errors related to:
- `sendInvitationEmail`
- `sendActivationEmail`
- `onInvitationCreated`
- `onUserActivated`

## Configuration Summary

After setup, you should have:

✅ SendGrid account created
✅ API key generated and saved
✅ Sender identity verified
✅ Firebase Functions config set:
   - `sendgrid.api_key`
   - `email.from`
   - `app.url`
✅ Firebase Auth SMTP configured
✅ Functions deployed
✅ Email templates customized

## Quick Reference Commands

```bash
# Set SendGrid API key
firebase functions:config:set sendgrid.api_key="SG.your-key-here"

# Set email from address
firebase functions:config:set email.from="noreply@yourdomain.com"

# Set app URL
firebase functions:config:set app.url="https://your-app-url.com"

# View current config
firebase functions:config:get

# Deploy functions
firebase deploy --only functions

# View function logs
firebase functions:log
```

## Next Steps

1. ✅ Complete all setup steps above
2. ✅ Test all email functionality
3. ✅ Monitor email delivery in SendGrid dashboard
4. ✅ Set up domain authentication for better deliverability
5. ✅ Customize email templates with your branding
6. ✅ Set up email alerts for bounces/spam reports

## Support

- **SendGrid Support:** https://support.sendgrid.com
- **SendGrid Documentation:** https://docs.sendgrid.com
- **Firebase Functions Docs:** https://firebase.google.com/docs/functions

---

**You're all set!** SendGrid is now configured for all email functionality in Proppli.
