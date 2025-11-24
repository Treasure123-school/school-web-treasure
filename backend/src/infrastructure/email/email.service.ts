import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP credentials not configured. Email service disabled.');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host,
      port: port || 587,
      secure: false,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('✅ Email service initialized');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Cannot send email: transporter not initialized');
      return false;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM', 'noreply@treasurehome.com');
      
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`✅ Email sent to: ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password for Treasure-Home School Management System.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    return this.sendEmail({
      to,
      subject: 'Password Reset Request - Treasure-Home School',
      html,
      text: `Password reset requested. Visit: ${resetUrl}`,
    });
  }

  async sendWelcomeEmail(to: string, name: string, temporaryPassword?: string): Promise<boolean> {
    const html = temporaryPassword
      ? `
        <h2>Welcome to Treasure-Home School!</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created successfully.</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        <p>Please log in and change your password immediately.</p>
        <p>Login at: ${this.configService.get('FRONTEND_URL')}/login</p>
      `
      : `
        <h2>Welcome to Treasure-Home School!</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created successfully.</p>
        <p>You can now log in at: ${this.configService.get('FRONTEND_URL')}/login</p>
      `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Treasure-Home School',
      html,
    });
  }
}
