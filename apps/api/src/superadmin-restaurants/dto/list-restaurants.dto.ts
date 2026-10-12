import { IsEnum, IsInt, IsOptional, Max, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { RestaurantStatus } from '../../generated/prisma/enums.js';

export class ListRestaurantsDto {
  @IsOptional()
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
}