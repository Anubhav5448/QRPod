import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPERADMIN';
}

export const CurrentUser = createParamDecorator(
  (data: keyof SuperAdminUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as SuperAdminUser;
    return data ? user?.[data] : user;
  },
);