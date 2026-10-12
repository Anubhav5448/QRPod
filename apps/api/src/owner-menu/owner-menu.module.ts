import { Module } from '@nestjs/common';
import { OwnerMenuController } from './owner-menu.controller.js';
import { OwnerMenuService } from './owner-menu.service.js';

@Module({
  controllers: [OwnerMenuController],
  providers: [OwnerMenuService],
})
export class OwnerMenuModule {}