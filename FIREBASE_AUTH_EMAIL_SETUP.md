# Firebase Authentication Email Setup

## Problem: Password Reset Emails Not Sending

If password reset emails (or email verification) aren't being received, Firebase Auth needs SMTP configuration.

## Solution: Configure SMTP in Firebase Console

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., `proppli-production`)
3. Go to **Authentication** → **Templates** tab
4. Click on **SMTP settings** (gear icon in the left sidebar)

### Step 2: Configure SMTP

You have two options:

#### Option A: Use Firebase Default (Limited)

- Firebase provides a default email service
- Uses `noreply@[project].firebaseapp.com` as sender
- **Limitations:**
  - May have delivery issues
  - Limited customization
  - May go to spam

#### Option B: Configure Custom SMTP (Recommended)

1. **Click "Configure SMTP"** in SMTP settings
2. **Choose your email service:**

   **For Gmail:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: Gmail App Password (not your regular password)
     - Go to Google Account → Security → 2-Step Verification → App Passwords
     - Generate an app password for "Mail"
   - Enable TLS: Yes

   **For SendGrid (Recommended for Production):**
   - Sign up at https://sendgrid.com
   - Create an API key
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key
   - Enable TLS: Yes

   **For Mailgun:**
   - Sign up at https://mailgun.com
   - Get SMTP credentials from dashboard
   - Host: `smtp.mailgun.org`
   - Port: `587`
   - Username: Your Mailgun SMTP username
   - Password: Your Mailgun SMTP password
   - Enable TLS: Yes

   **For Custom SMTP:**
   - Use your email provider's SMTP settings
   - Common ports: 587 (TLS) or 465 (SSL)

3. **Test the connection**
   - Firebase will send a test email
   - Check your inbox to verify it works

### Step 3: Customize Email Templates (Optional)

1. Go to **Authentication** → **Templates**
2. Click on **Password reset** template
3. Customize:
   - **Sender name:** e.g., "Proppli"
   - **From:** Your email address (must match SMTP)
   - **Reply to:** Your support email
   - **Subject:** Customize the subject line
   - **Message body:** Customize the email content

4. Click **Save**

### Step 4: Test Password Reset

1. Go to your app's password reset page
2. Enter a valid user email
3. Click "Send Reset Link"
4. Check the email inbox (and spam folder)
5. You should receive the password reset email

## Troubleshooting

### Emails Still Not Arriving?

1. **Check Spam Folder**
   - Firebase emails often go to spam initially
   - Mark as "Not Spam" to improve delivery

2. **Verify SMTP Settings**
   - Double-check host, port, username, password
   - Test connection in Firebase Console
   - Check for typos

3. **Check Email Service Limits**
   - Gmail: 500 emails/day (free account)
   - SendGrid: 100 emails/day (free tier)
   - Mailgun: 5,000 emails/month (free tier)

4. **Verify User Exists**
   - Password reset only works for existing users
   - Check Firebase Console → Authentication → Users

5. **Check Firebase Console Logs**
   - Go to Firebase Console → Functions → Logs
   - Look for email-related errors

6. **Test with Different Email**
   - Try with a different email address
   - Some email providers block automated emails

### Common Error Messages

**"Invalid SMTP credentials"**
- Check username and password
- For Gmail, use App Password, not regular password
- Verify SMTP settings match your email provider

**"Connection timeout"**
- Check firewall settings
- Verify SMTP port is correct
- Try port 465 (SSL) instead of 587 (TLS)

**"Authentication failed"**
- Verify email service credentials
- Check if 2FA is enabled (may need App Password)
- Ensure SMTP is enabled for your email account

## Best Practices

1. **Use a Dedicated Email Service for Production**
   - SendGrid, Mailgun, or AWS SES
   - Better deliverability than Gmail
   - Higher sending limits

2. **Set Up SPF/DKIM Records**
   - Improves email deliverability
   - Reduces spam classification
   - Required for some email services

3. **Monitor Email Delivery**
   - Check Firebase Console → Authentication → Templates
   - Review email delivery statistics
   - Set up alerts for failures

4. **Customize Email Templates**
   - Add your branding
   - Include clear instructions
   - Add support contact information

## Quick Checklist

- [ ] SMTP configured in Firebase Console
- [ ] SMTP connection test successful
- [ ] Email templates customized
- [ ] Test password reset email received
- [ ] Checked spam folder
- [ ] Verified user exists in Firebase Auth

## Need Help?

If emails still aren't working:
1. Check Firebase Console → Authentication → Templates for errors
2. Review browser console for error messages
3. Verify SMTP settings are correct
4. Test with a different email service
5. Contact Firebase support if issues persist
