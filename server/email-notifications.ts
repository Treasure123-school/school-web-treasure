export interface ParentNotificationData {
  parentEmail: string;
  parentUsername: string;
  parentPassword: string;
  studentName: string;
  studentUsername: string;
}

export async function sendParentNotificationEmail(data: ParentNotificationData): Promise<void> {
  // Email stub for development
  console.log('\n📧 ========== PARENT NOTIFICATION EMAIL ==========');
  console.log(`📬 To: ${data.parentEmail}`);
  console.log(`📋 Subject: THS Portal — Parent Account Created for ${data.studentName}`);
  console.log('\n📝 Email Body:');
  console.log(`
Dear Parent/Guardian,

A student account has been successfully created for ${data.studentName} at Treasure-Home School.

Your parent portal account has been created with the following credentials:

Username: ${data.parentUsername}
Temporary Password: ${data.parentPassword}

IMPORTANT SECURITY NOTICE:
- This is a one-time password. Please change it immediately upon first login.
- Keep your credentials secure and do not share them with anyone.

To access the parent portal:
1. Visit: ${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://your-school-portal.com'}
2. Click on "Portal Login"
3. Enter your username and temporary password
4. You will be prompted to change your password

Your student's username is: ${data.studentUsername}

If you have any questions or need assistance, please contact the school administration.

Best regards,
Treasure-Home School Administration

---
This is an automated message. Please do not reply to this email.
  `);
  console.log('==================================================\n');

  // TODO: In production, integrate with SendGrid or other email service
  // Example SendGrid integration:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: data.parentEmail,
    from: process.env.SCHOOL_EMAIL || 'noreply@treasurehomeschool.com',
    subject: `THS Portal — Parent Account Created for ${data.studentName}`,
    text: emailBody,
    html: emailHtmlTemplate,
  };
  
  await sgMail.send(msg);
  */
}

export async function sendParentNotificationSMS(phone: string, username: string, password: string): Promise<void> {
  // SMS stub for development
  console.log('\n📱 ========== PARENT NOTIFICATION SMS ==========');
  console.log(`📞 To: ${phone}`);
  console.log(`📝 Message: Your THS parent account: Username: ${username}, Password: ${password}. Change password on first login.`);
  console.log('==================================================\n');

  // TODO: In production, integrate with Twilio or other SMS service
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `Your Treasure-Home School parent account has been created. Username: ${username}. Temporary Password: ${password}. Please change your password on first login.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
  */
}
