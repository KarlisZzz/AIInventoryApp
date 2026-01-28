/**
 * Email Service
 * 
 * Handles sending email notifications to users.
 * Currently a stub implementation - in production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - SMTP server
 * 
 * @see specs/004-admin-management/spec.md (FR-011)
 */

/**
 * Send email notification when a new user account is created
 * 
 * In production, this would:
 * - Send an email with login credentials or activation link
 * - Include welcome message and getting started instructions
 * - Provide password reset link if using temporary passwords
 * 
 * @param {Object} userData - User data
 * @param {string} userData.email - User email address
 * @param {string} userData.name - User full name
 * @param {string} userData.role - User role ('administrator' or 'standard user')
 * @param {string} [userData.temporaryPassword] - Temporary password if generated
 * @returns {Promise<Object>} Email send result
 * 
 * @example
 * await sendUserCreatedEmail({
 *   email: 'john@example.com',
 *   name: 'John Doe',
 *   role: 'standard user',
 *   temporaryPassword: 'temp123'
 * });
 */
async function sendUserCreatedEmail(userData) {
  try {
    console.log('📧 Email Service (STUB): User account created email');
    console.log('   To:', userData.email);
    console.log('   Name:', userData.name);
    console.log('   Role:', userData.role);
    if (userData.temporaryPassword) {
      console.log('   Temporary Password:', userData.temporaryPassword);
    }
    console.log('   ℹ️ This is a stub - no actual email sent');

    // Simulate successful email send
    return {
      success: true,
      messageId: `stub-${Date.now()}`,
      recipient: userData.email,
      subject: 'Your Account Has Been Created',
      stub: true,
    };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send user creation email');
  }
}

/**
 * Send email notification when a user's role is changed
 * 
 * @param {Object} userData - User data
 * @param {string} userData.email - User email address
 * @param {string} userData.name - User full name
 * @param {string} userData.oldRole - Previous role
 * @param {string} userData.newRole - New role
 * @returns {Promise<Object>} Email send result
 */
async function sendRoleChangedEmail(userData) {
  try {
    console.log('📧 Email Service (STUB): Role changed email');
    console.log('   To:', userData.email);
    console.log('   Name:', userData.name);
    console.log('   Role Change:', `${userData.oldRole} → ${userData.newRole}`);
    console.log('   ℹ️ This is a stub - no actual email sent');

    return {
      success: true,
      messageId: `stub-${Date.now()}`,
      recipient: userData.email,
      subject: 'Your Account Role Has Been Updated',
      stub: true,
    };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send role change email');
  }
}

/**
 * Send email notification when a user account is deactivated
 * 
 * @param {Object} userData - User data
 * @param {string} userData.email - User email address
 * @param {string} userData.name - User full name
 * @returns {Promise<Object>} Email send result
 */
async function sendAccountDeactivatedEmail(userData) {
  try {
    console.log('📧 Email Service (STUB): Account deactivated email');
    console.log('   To:', userData.email);
    console.log('   Name:', userData.name);
    console.log('   ℹ️ This is a stub - no actual email sent');

    return {
      success: true,
      messageId: `stub-${Date.now()}`,
      recipient: userData.email,
      subject: 'Your Account Has Been Deactivated',
      stub: true,
    };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send account deactivation email');
  }
}

/**
 * Send test email (for service health checks)
 * 
 * @param {string} recipientEmail - Test recipient email
 * @returns {Promise<Object>} Email send result
 */
async function sendTestEmail(recipientEmail) {
  try {
    console.log('📧 Email Service (STUB): Test email');
    console.log('   To:', recipientEmail);
    console.log('   ℹ️ This is a stub - no actual email sent');

    return {
      success: true,
      messageId: `stub-test-${Date.now()}`,
      recipient: recipientEmail,
      subject: 'Test Email',
      stub: true,
    };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send test email');
  }
}

module.exports = {
  sendUserCreatedEmail,
  sendRoleChangedEmail,
  sendAccountDeactivatedEmail,
  sendTestEmail,
};
