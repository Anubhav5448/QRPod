import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RestaurantMemberGuard extends AuthGuard('restaurant-jwt') {}