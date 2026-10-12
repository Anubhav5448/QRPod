import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RestaurantStatus } from '../../generated/prisma/enums.js';

// Only ACTIVE, SUSPENDED, DEACTIVATED can be set manually
// PENDING is the initial state only
export enum RestaurantStatusUpdate {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export class UpdateRestaurantStatusDto {
  @IsEnum(RestaurantStatusUpdate)
  status!: RestaurantStatusUpdate;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}