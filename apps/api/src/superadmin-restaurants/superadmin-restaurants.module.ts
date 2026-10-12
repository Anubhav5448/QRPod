import { Module } from '@nestjs/common';
import { SuperAdminRestaurantsController } from './superadmin-restaurants.controller.js';
import { SuperAdminAuditController } from './superadmin-audit.controller.js';
import { SuperAdminRestaurantsService } from './superadmin-restaurants.service.js';

@Module({
  controllers: [
    SuperAdminRestaurantsController,
    SuperAdminAuditController,
  ],
  providers: [SuperAdminRestaurantsService],
})
export class SuperAdminRestaurantsModule {}