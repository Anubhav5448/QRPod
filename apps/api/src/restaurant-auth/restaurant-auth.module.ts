import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RestaurantAuthController } from './restaurant-auth.controller.js';
import { RestaurantAuthService } from './restaurant-auth.service.js';
import { RestaurantJwtStrategy } from './strategies/restaurant-jwt.strategy.js';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [RestaurantAuthController],
  providers: [RestaurantAuthService, RestaurantJwtStrategy],
})
export class RestaurantAuthModule {}