
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  try {
    // In development without API key, just log
    if (!process.env.RESEND_API_KEY) {
      console.log('\n📧 EMAIL (Development Mode - No API Key):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}\n`);
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: 'THS Portal <noreply@your-domain.com>', // Change this to your verified domain
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }

    console.log('✅ Email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
}

// Email templates
export function getPasswordResetEmailHTML(userName: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Treasure-Home School</h1>
      <p>"Honesty and Success"</p>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>You requested a password reset for your THS Portal account. Click the button below to set a new password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #1e40af;">${resetLink}</p>
      <div class="warning">
        <strong>⚠️ Important:</strong> This link expires in 15 minutes for security reasons.
      </div>
      <p>If you didn't request this password reset, please ignore this email or contact the school administrator if you have concerns.</p>
      <p><strong>Security Reminder:</strong></p>
      <ul>
        <li>Never share your password with anyone</li>
        <li>Use a strong, unique password</li>
        <li>Change your password if you suspect unauthorized access</li>
      </ul>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Treasure-Home School<br>
      Seriki-Soyinka Ifo, Ogun State, Nigeria<br>
      Email: treasurehomeschool@gmail.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordChangedEmailHTML(userName: string, ipAddress: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Changed</h1>
    </div>
    <div class="content">
      <h2>Password Successfully Changed</h2>
      <p>Hello ${userName},</p>
      <p>Your password was successfully changed on THS Portal.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Changed at: ${new Date().toLocaleString()}</li>
        <li>IP Address: ${ipAddress}</li>
      </ul>
      <div class="alert">
        <strong>⚠️ Didn't make this change?</strong><br>
        If you didn't change your password, contact the school administration immediately:<br>
        Email: admin@treasurehomeschool.edu.ng
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Treasure-Home School</p>
    </div>
  </div>
</body>
</html>
  `;
}
