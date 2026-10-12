import { IsString, MinLength } from 'class-validator';

export class RestaurantResetPasswordDto {
  @IsString()
  @MinLength(20)
  token!: string;

  @IsString()
  @MinLength(12)
  newPassword!: string;
}