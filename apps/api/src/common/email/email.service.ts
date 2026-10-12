import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: Transporter;
  private fromAddress = 'no-reply@hospitality.local';

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'ethereal');

    if (provider === 'ethereal') {
      // Create a fake SMTP account
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.fromAddress = testAccount.user;
      this.logger.log(`📧 Ethereal mail ready: ${testAccount.user}`);
      this.logger.log(
        `📬 Preview inbox: https://ethereal.email/login (use above credentials)`,
      );
    } else {
      // Placeholder for real SMTP providers (Resend, SendGrid, Gmail, etc.)
      // For now, throw — we'll add real providers later.
      throw new Error(
        `EMAIL_PROVIDER=${provider} not configured yet. Use "ethereal" for dev.`,
      );
    }
  }

  async sendPasswordResetEmail(params: {
    to: string;
    name: string;
    resetUrl: string;
    expiresInMinutes: number;
  }) {
    const { to, name, resetUrl, expiresInMinutes } = params;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #171717;">
        <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 16px;">Reset your password</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #525252;">Hi ${name},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #525252;">
          We received a request to reset the password for your account.
          Click the button below to set a new password.
        </p>
        <p style="margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #171717; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 13px; color: #737373;">
          Or copy and paste this link into your browser:<br />
          <a href="${resetUrl}" style="color: #171717; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="font-size: 13px; color: #737373; margin-top: 32px;">
          This link expires in ${expiresInMinutes} minutes. If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
        <p style="font-size: 12px; color: #a3a3a3;">
          Platform Admin — Automated message, do not reply
        </p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: `"Platform Admin" <${this.fromAddress}>`,
      to,
      subject: 'Reset your password',
      html,
    });

    // For Ethereal, log the preview URL so you can see the email in dev
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`📧 Password reset email sent to ${to}`);
      this.logger.log(`👀 Preview: ${previewUrl}`);
    }

    return info;
  }
}