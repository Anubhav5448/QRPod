import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SuperAdminGuard extends AuthGuard('superadmin-jwt') {}