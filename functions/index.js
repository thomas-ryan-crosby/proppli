const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email configuration - Using SendGrid
const emailConfig = {
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // false for 587, true for 465
  auth: {
    user: 'apikey',
    pass: functions.config().sendgrid.api_key
  }
};

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
  invitation: (data) => ({
    subject: `You've been invited to join Proppli`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Proppli</h1>
          </div>
          <div class="content">
            <p>Hello ${data.displayName || data.email},</p>
            <p>You've been invited to join <strong>Proppli</strong>, a property management platform.</p>
            <p><strong>Your Role:</strong> ${data.role}</p>
            ${data.assignedProperties && data.assignedProperties.length > 0 ? 
              `<p><strong>Assigned Properties:</strong> ${data.assignedProperties.length} property(ies)</p>` : ''}
            <p>To get started, please create your account by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${data.signupUrl}" class="button">Create Account</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.signupUrl}</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Proppli. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Proppli!
      
      Hello ${data.displayName || data.email},
      
      You've been invited to join Proppli, a property management platform.
      
      Your Role: ${data.role}
      ${data.assignedProperties && data.assignedProperties.length > 0 ? 
        `Assigned Properties: ${data.assignedProperties.length} property(ies)` : ''}
      
      To get started, please create your account by visiting:
      ${data.signupUrl}
      
      If you have any questions, please contact your system administrator.
      
      This is an automated message from Proppli.
    `
  }),
  
  activation: (data) => ({
    subject: `Your Proppli account has been activated`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Activated</h1>
          </div>
          <div class="content">
            <p>Hello ${data.displayName || data.email},</p>
            <p>Great news! Your Proppli account has been activated by an administrator.</p>
            <p>You can now access the platform with your credentials:</p>
            <ul>
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>Role:</strong> ${data.role}</li>
            </ul>
            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Sign In Now</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.loginUrl}</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Proppli. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Account Activated
      
      Hello ${data.displayName || data.email},
      
      Great news! Your Proppli account has been activated by an administrator.
      
      You can now access the platform with your credentials:
      Email: ${data.email}
      Role: ${data.role}
      
      Sign in at: ${data.loginUrl}
      
      If you have any questions, please contact your system administrator.
      
      This is an automated message from Proppli.
    `
  })
};

// Check if email has pending invitation (for signup flow)
exports.checkPendingInvitation = functions.https.onCall(async (data, context) => {
  // This function can be called by unauthenticated users during signup
  // No authentication required - we're just checking if an email has a pending invitation
  
  if (!data || !data.email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }
  
  try {
    const normalizedEmail = (data.email || '').toLowerCase().trim();
    
    // Check pendingUsers collection
    const pendingUsersSnapshot = await admin.firestore()
      .collection('pendingUsers')
      .where('email', '==', normalizedEmail)
      .where('status', '==', 'pending_signup')
      .limit(1)
      .get();
    
    if (!pendingUsersSnapshot.empty) {
      const pendingUser = pendingUsersSnapshot.docs[0].data();
      // Don't return sensitive data, just indicate invitation exists
      return {
        hasInvitation: true,
        displayName: pendingUser.displayName,
        role: pendingUser.role
      };
    }
    
    return { hasInvitation: false };
  } catch (error) {
    console.error('Error checking pending invitation:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check pending invitation');
  }
});

// Send invitation email
exports.sendInvitationEmail = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated and is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user is admin
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found');
  }
  
  const userData = userDoc.data();
  if (userData.role !== 'admin' && userData.role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can send invitations');
  }
  
  // Validate input
  if (!data.email || !data.displayName || !data.role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  try {
    await sendInvitationEmailInternal({
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      assignedProperties: data.assignedProperties || []
    });
    
    return { success: true, message: 'Invitation email sent successfully' };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send invitation email', error.message);
  }
});

// Send activation email
exports.sendActivationEmail = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated and is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user is admin
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found');
  }
  
  const userData = userDoc.data();
  if (userData.role !== 'admin' && userData.role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can send activation emails');
  }
  
  // Validate input
  if (!data.email || !data.displayName || !data.role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  try {
    await sendActivationEmailInternal({
      email: data.email,
      displayName: data.displayName,
      role: data.role
    });
    
    return { success: true, message: 'Activation email sent successfully' };
  } catch (error) {
    console.error('Error sending activation email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send activation email', error.message);
  }
});

// Helper function to send invitation email (used by both callable and trigger)
async function sendInvitationEmailInternal(data) {
  // Get app URL from config or use default
  const appUrl = functions.config().app?.url || 'https://www.proppli.com';
  const signupUrl = `${appUrl}#signup`;
  
  // Prepare email data
  const emailData = {
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    assignedProperties: data.assignedProperties || [],
    signupUrl: signupUrl
  };
  
  // Get email template
  const template = emailTemplates.invitation(emailData);
  
  // Send email
  // Get from address from config, with fallback
  const fromAddress = functions.config().email?.from || 'noreply@proppli.com';
  
  const mailOptions = {
    from: fromAddress,
    to: data.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`Invitation email sent to ${data.email}`);
}

// Helper function to send activation email (used by both callable and trigger)
async function sendActivationEmailInternal(data) {
  // Get app URL from config or use default
  const appUrl = functions.config().app?.url || 'https://your-app-url.com';
  const loginUrl = `${appUrl}/#login`;
  
  // Prepare email data
  const emailData = {
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    loginUrl: loginUrl
  };
  
  // Get email template
  const template = emailTemplates.activation(emailData);
  
  // Send email
  // Get from address from config, with fallback
  const fromAddress = functions.config().email?.from || 'noreply@proppli.com';
  
  const mailOptions = {
    from: fromAddress,
    to: data.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`Activation email sent to ${data.email}`);
}

// Helper function to send welcome email (for self-registration)
async function sendWelcomeEmailInternal(data) {
  // Prepare email data
  const emailData = {
    email: data.email,
    displayName: data.displayName
  };
  
  // Get email template
  const template = emailTemplates.welcome(emailData);
  
  // Send email
  // Get from address from config, with fallback
  const fromAddress = functions.config().email?.from || 'noreply@proppli.com';
  
  const mailOptions = {
    from: fromAddress,
    to: data.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`Welcome email sent to ${data.email}`);
}

// Triggered when a user invitation is created (if sendEmail is true)
exports.onInvitationCreated = functions.firestore
  .document('userInvitations/{invitationId}')
  .onCreate(async (snap) => {
    const invitation = snap.data();
    
    // Only send email if sendEmail is true
    if (!invitation.sendEmail) {
      console.log('Email sending disabled for this invitation');
      return null;
    }
    
    try {
      await sendInvitationEmailInternal({
        email: invitation.email,
        displayName: invitation.displayName,
        role: invitation.role,
        assignedProperties: invitation.assignedProperties || []
      });
      
      console.log(`Invitation email triggered for ${invitation.email}`);
      return null;
    } catch (error) {
      console.error('Error triggering invitation email:', error);
      return null;
    }
  });

// Triggered when a user is activated
exports.onUserActivated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if user was just activated (isActive changed from false to true)
    if (!before.isActive && after.isActive) {
      try {
        await sendActivationEmailInternal({
          email: after.email,
          displayName: after.displayName,
          role: after.role
        });
        
        console.log(`Activation email triggered for ${after.email}`);
        return null;
      } catch (error) {
        console.error('Error triggering activation email:', error);
        return null;
      }
    }
    
    return null;
  });

// Triggered when a new user profile is created (for self-registration welcome email)
exports.onUserSignup = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap) => {
    const userData = snap.data();
    
    // Only send welcome email for self-registered users (isActive: false or undefined/null)
    // Admin-invited users will be active immediately and get activation email instead
    // Check for false, null, or undefined (new self-registered users)
    if (userData.isActive === false || userData.isActive === null || userData.isActive === undefined) {
      try {
        await sendWelcomeEmailInternal({
          email: userData.email,
          displayName: userData.displayName
        });
        
        console.log(`Welcome email triggered for ${userData.email}`);
        return null;
      } catch (error) {
        console.error('Error triggering welcome email:', error);
        return null;
      }
    }
    
    return null;
  });
