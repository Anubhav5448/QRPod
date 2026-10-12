import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../superadmin-auth/guards/superadmin.guard.js';
import { SuperAdminRestaurantsService } from './superadmin-restaurants.service.js';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto.js';

@Controller('superadmin/audit-logs')
@UseGuards(SuperAdminGuard)
export class SuperAdminAuditController {
  constructor(private service: SuperAdminRestaurantsService) {}

  @Get()
  async list(@Query() query: ListAuditLogsDto) {
    const data = await this.service.listAuditLogs(query);
    return { success: true, data };
  }
}