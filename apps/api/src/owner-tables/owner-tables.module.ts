import { Module } from '@nestjs/common';
import { OwnerTablesController } from './owner-tables.controller.js';
import { OwnerTablesService } from './owner-tables.service.js';

@Module({
  controllers: [OwnerTablesController],
  providers: [OwnerTablesService],
})
export class OwnerTablesModule {}