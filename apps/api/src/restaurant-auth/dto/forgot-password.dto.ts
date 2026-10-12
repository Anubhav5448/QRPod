import { IsEmail } from 'class-validator';

export class RestaurantForgotPasswordDto {
  @IsEmail()
  email!: string;
}