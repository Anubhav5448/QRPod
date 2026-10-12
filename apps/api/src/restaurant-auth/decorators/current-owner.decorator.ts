import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RestaurantOwnerContext {
  userId: string;
  email: string;
  name: string;
  restaurantId: string;
  restaurantSlug: string;
  role: 'OWNER' | 'MANAGER' | 'EMPLOYEE' | 'KITCHEN';
  memberId: string;
}

export const CurrentOwner = createParamDecorator(
  (data: keyof RestaurantOwnerContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RestaurantOwnerContext;
    return data ? user?.[data] : user;
  },
);