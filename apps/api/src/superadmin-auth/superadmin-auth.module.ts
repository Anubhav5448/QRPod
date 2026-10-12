import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SuperAdminAuthController } from './superadmin-auth.controller.js';
import { SuperAdminAuthService } from './superadmin-auth.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { SuperAdminJwtStrategy } from './strategies/superadmin-jwt.strategy.js';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [SuperAdminAuthController],
  providers: [
    SuperAdminAuthService,
    PasswordResetService,
    SuperAdminJwtStrategy,
  ],
})
export class SuperAdminAuthModule {}