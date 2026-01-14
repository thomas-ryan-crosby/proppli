# Troubleshooting Email Issues

## Password Reset Email Not Sending

### Step 1: Check Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try password reset again
5. Look for any error messages

**Common errors to look for:**
- `auth/invalid-email`
- `auth/user-not-found`
- `auth/too-many-requests`
- Network errors
- SMTP connection errors

### Step 2: Check Firebase Console Logs

1. Go to Firebase Console
2. Go to **Authentication** → **Users**
3. Find the user you're testing with
4. Check if the user exists and email is correct

### Step 3: Verify SMTP Configuration

1. Go to **Authentication** → **Templates** → **SMTP settings**
2. Verify all settings:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey` (exactly this word, lowercase)
   - Password: Your SendGrid API key (starts with SG.)
   - Security: TLS
   - Sender: Your verified SendGrid email
3. Click **"Test connection"**
   - Should show: ✅ "Connection successful"
   - If it fails, check the error message

### Step 4: Check SendGrid Activity

1. Go to SendGrid Dashboard
2. Go to **Activity** → **Email Activity**
3. Look for any emails sent
4. Check status:
   - ✅ Delivered
   - ⚠️ Bounced
   - ⚠️ Blocked
   - ⚠️ Dropped

**If no emails appear:**
- Firebase Auth isn't reaching SendGrid
- Check SMTP configuration again
- Verify API key is correct

### Step 5: Verify Sender Identity

1. Go to SendGrid Dashboard
2. Go to **Settings** → **Sender Authentication**
3. Check if your sender is verified:
   - Should show ✅ "Verified"
   - If not verified, verify it now

**Important:** The sender email in Firebase must match the verified sender in SendGrid!

### Step 6: Test with Different Email

1. Try password reset with a different email address
2. Make sure the user exists in Firebase Auth
3. Check if that email receives the reset link

### Step 7: Check Email Templates

1. Go to **Authentication** → **Templates**
2. Click on **"Password reset"** template
3. Verify:
   - Sender name is set
   - From address matches verified sender
   - Template is enabled

### Step 8: Check Spam Folder

- Check the user's spam/junk folder
- SendGrid emails sometimes go to spam initially
- Mark as "Not Spam" to improve deliverability

## Common Issues & Solutions

### Issue: "Connection failed" in Firebase

**Solution:**
- Double-check username is exactly `apikey` (not your SendGrid username)
- Verify API key is correct (copy/paste to avoid typos)
- Check port is `587` (not `465`)
- Ensure TLS is enabled

### Issue: "Authentication failed"

**Solution:**
- Verify API key has "Mail Send" permissions
- Regenerate API key if needed
- Check API key hasn't been revoked

### Issue: Emails sent but not received

**Solution:**
- Check SendGrid Activity dashboard
- Look for bounces or blocks
- Verify sender is authenticated
- Check spam folder
- Try different email address

### Issue: "User not found" error

**Solution:**
- User must exist in Firebase Auth first
- Check email address is correct
- Verify user hasn't been deleted

### Issue: No errors but no email

**Solution:**
- Check SendGrid Activity (emails might be getting dropped)
- Verify sender authentication is complete
- Check if you've hit SendGrid rate limits (100/day on free tier)
- Look at Firebase Console → Functions → Logs for errors

## Debug Commands

### Check Firebase Functions Config

```bash
firebase functions:config:get
```

Should show:
```
{
  "sendgrid": {
    "api_key": "SG.xxxxx"
  },
  "email": {
    "from": "noreply@yourdomain.com"
  },
  "app": {
    "url": "https://your-app-url.com"
  }
}
```

### View Function Logs

```bash
firebase functions:log
```

Look for:
- Email sending errors
- Authentication errors
- SMTP connection errors

### Test SendGrid API Key

You can test if your API key works by checking SendGrid dashboard:
1. Go to **Activity** → **Email Activity**
2. If you see any activity, API key is working
3. If no activity, API key might be invalid

## Still Not Working?

1. **Double-check all settings match exactly:**
   - SMTP host, port, username, password
   - Sender email matches verified sender
   - API key is correct

2. **Try regenerating API key:**
   - Create new API key in SendGrid
   - Update Firebase config
   - Update Firebase Auth SMTP settings

3. **Check SendGrid account status:**
   - Account not suspended
   - Not over rate limits
   - Sender authentication complete

4. **Contact support:**
   - SendGrid support: https://support.sendgrid.com
   - Firebase support: https://firebase.google.com/support
