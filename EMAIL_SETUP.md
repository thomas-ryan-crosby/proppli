# Email Integration Setup Guide

This guide will help you set up email notifications for Proppli user management.

## Overview

Proppli uses **two different email systems**:

### 1. Firebase Authentication (Built-in) ✅ Already Configured
Firebase Auth automatically handles these emails (no setup needed):
- **Email verification** - Sent when users sign up
- **Password reset** - Sent when users request password reset
- **Email change verification** - Sent when users change their email

**Configuration:** These are managed in Firebase Console → Authentication → Templates
- You can customize the email templates, sender name, and reply-to address
- No Cloud Functions or external email service needed for these

### 2. Cloud Functions (Custom) - Setup Required
Firebase Cloud Functions with Nodemailer send:
- **Invitation emails** - When admins invite new users
- **Activation emails** - When user accounts are activated by admins

**Why Custom Functions?** These are specific to our user management workflow and not part of Firebase Auth's built-in features.

## Quick Start

**For Firebase Auth emails (verification, password reset):**
- ✅ Already working! Just customize templates in Firebase Console
- Go to: Firebase Console → Authentication → Templates
- Customize sender name, email templates, etc.

**For Custom emails (invitations, activations):**
- Follow the setup steps below to configure Cloud Functions

## Prerequisites (For Custom Emails Only)

1. **Firebase CLI** installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Node.js** (version 18 or higher)

3. **Firebase project** with Blaze plan (required for Cloud Functions)

4. **Email service account** (choose one):
   - Gmail (easiest for testing, not recommended for production)
   - SendGrid (recommended for production)
   - Mailgun
   - AWS SES
   - Custom SMTP server

## Setup Steps

### 1. Initialize Firebase Functions (if not already done)

```bash
cd functions
npm install
```

### 2. Configure Email Service

Choose your email service and configure it:

#### Option A: Gmail (Testing Only)

1. Enable "Less secure app access" in your Google Account settings, OR
2. Use OAuth2 (more secure, requires additional setup)

Update `functions/index.js`:
```javascript
const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password' // Use App Password, not regular password
  }
};
```

Set config:
```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password" email.from="noreply@proppli.com"
```

#### Option B: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Update `functions/index.js`:
```javascript
const emailConfig = {
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: functions.config().sendgrid.api_key
  }
};
```

Set config:
```bash
firebase functions:config:set sendgrid.api_key="your-sendgrid-api-key" email.from="noreply@yourdomain.com"
```

#### Option C: Mailgun

1. Sign up at https://mailgun.com
2. Get your SMTP credentials
3. Update `functions/index.js`:
```javascript
const emailConfig = {
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: functions.config().mailgun.user,
    pass: functions.config().mailgun.password
  }
};
```

Set config:
```bash
firebase functions:config:set mailgun.user="your-mailgun-user" mailgun.password="your-mailgun-password" email.from="noreply@yourdomain.com"
```

#### Option D: Custom SMTP

Update `functions/index.js` with your SMTP settings, then:
```bash
firebase functions:config:set smtp.host="smtp.yourdomain.com" smtp.port="587" smtp.user="your-smtp-user" smtp.password="your-smtp-password" email.from="noreply@yourdomain.com"
```

### 3. Configure App URL

Set your application URL so email links work correctly:

```bash
firebase functions:config:set app.url="https://your-proppli-app-url.com"
```

### 4. Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Verify Deployment

Check that functions are deployed:
```bash
firebase functions:list
```

You should see:
- `sendInvitationEmail`
- `sendActivationEmail`
- `onInvitationCreated`
- `onUserActivated`

## Testing

### Test Invitation Email

1. Go to User Management page
2. Click "Invite User"
3. Fill in the form and check "Send invitation email"
4. Submit the form
5. Check the user's email inbox

### Test Activation Email

1. Activate a user account in User Management
2. Check the user's email inbox

### View Function Logs

```bash
firebase functions:log
```

Or in Firebase Console:
1. Go to Functions
2. Click on a function
3. View "Logs" tab

## Troubleshooting

### Emails Not Sending

1. **Check function logs:**
   ```bash
   firebase functions:log
   ```

2. **Verify email configuration:**
   ```bash
   firebase functions:config:get
   ```

3. **Test email service credentials:**
   - For Gmail: Try logging in with the credentials
   - For SendGrid: Test API key in SendGrid dashboard
   - For Mailgun: Test SMTP credentials

4. **Check function permissions:**
   - Ensure functions have proper IAM permissions
   - Check Firestore security rules allow function access

### Common Issues

**"Authentication failed"**
- Verify email service credentials are correct
- For Gmail, use App Password, not regular password
- Check if 2FA is enabled (may need App Password)

**"Connection timeout"**
- Check firewall settings
- Verify SMTP port is correct (587 for TLS, 465 for SSL)
- Check if your IP is blocked by email service

**"Function not found"**
- Ensure functions are deployed: `firebase deploy --only functions`
- Check function names match in client code

**"Permission denied"**
- Verify user is admin/super_admin
- Check Firestore security rules
- Ensure function has proper IAM permissions

## Security Best Practices

1. **Never commit credentials to git**
   - Use Firebase Functions config for sensitive data
   - Add `.env` to `.gitignore`

2. **Use environment-specific configs**
   - Different email settings for dev/staging/production

3. **Rate limiting**
   - Consider adding rate limiting to prevent abuse
   - Monitor function usage in Firebase Console

4. **Email validation**
   - Validate email addresses before sending
   - Handle bounces and invalid emails gracefully

## Cost Considerations

- Firebase Cloud Functions: Free tier includes 2 million invocations/month
- Email service costs vary:
  - SendGrid: Free tier (100 emails/day)
  - Mailgun: Free tier (5,000 emails/month)
  - Gmail: Free but not recommended for production
  - AWS SES: Very cheap ($0.10 per 1,000 emails)

## Next Steps

After setup:
1. Test invitation emails
2. Test activation emails
3. Customize email templates in `functions/index.js`
4. Add your branding to email templates
5. Set up email monitoring/alerts

## Support

For issues or questions:
- Check Firebase Functions documentation
- Check your email service provider's documentation
- Review function logs for error messages
