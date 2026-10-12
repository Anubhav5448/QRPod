import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';


import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../common/email/email.service.js';

const TOKEN_BYTES = 32; // 256 bits
const TOKEN_EXPIRY_MINUTES = 15;

interface AuditMeta {
  ip: string;
  userAgent: string;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  /**
   * Step 1: User requests a reset link.
   * Always returns success (prevents email enumeration).
   */
  async requestReset(email: string, meta: AuditMeta) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return 200, even if user doesn't exist
    if (!user || !user.isActive) {
      this.logger.warn(`Reset requested for unknown/inactive email: ${email}`);
      return { ok: true };
    }

    // Invalidate any existing unused tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate a random token
    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = await argon2.hash(rawToken, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    // Build reset URL
    const frontendUrl = this.config.getOrThrow<string>(
      'FRONTEND_SUPERADMIN_URL',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    // ⚠️ DEV ONLY — REMOVE BEFORE PRODUCTION
    this.logger.debug(`🔑 DEV reset URL: ${resetUrl}`);

    // Send email
    try {
      await this.email.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresInMinutes: TOKEN_EXPIRY_MINUTES,
      });
    } catch (err) {
      this.logger.error('Failed to send reset email', err);
      // Don't leak email errors to the client
    }

    // Audit log
    await this.prisma.superAdminAuditLog.create({
      data: {
        superadminId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        targetType: 'USER',
        targetId: user.id,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        metadata: { email: user.email },
      },
    });

    return { ok: true };
  }

  /**
   * Step 2: User submits token + new password.
   */
  async resetPassword(
    rawToken: string,
    newPassword: string,
    meta: AuditMeta,
  ) {
    // Find candidate tokens that are unused and not expired
    const candidates = await this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    // Because tokens are hashed, we must scan to find a match
    // (this is why we limit unused tokens per user — reduces N)
    let matched: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      const ok = await argon2
        .verify(candidate.tokenHash, rawToken)
        .catch(() => false);
      if (ok) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = matched.user;
    if (!user.isActive) {
      throw new BadRequestException('Account is not active');
    }

    // Hash the new password
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Transaction: update password + mark token used + audit
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: matched!.id },
        data: { usedAt: new Date() },
      });

      // Invalidate any other pending tokens for this user
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          id: { not: matched!.id },
        },
        data: { usedAt: new Date() },
      });

      await tx.superAdminAuditLog.create({
        data: {
          superadminId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          targetType: 'USER',
          targetId: user.id,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
      });
    });

    return { ok: true };
  }

  /**
   * Step 3: User changes password while logged in (knows current password).
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    meta: AuditMeta,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await argon2
      .verify(user.passwordHash, currentPassword)
      .catch(() => false);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.superAdminAuditLog.create({
        data: {
          superadminId: user.id,
          action: 'PASSWORD_CHANGED',
          targetType: 'USER',
          targetId: user.id,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
      });
    });

    return { ok: true };
  }
}