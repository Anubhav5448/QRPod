import { Module } from '@nestjs/common';
import { PublicQrController } from './public-qr.controller.js';
import { PublicQrService } from './public-qr.service.js';
import { PublicMenuService } from './public-menu.service.js';

@Module({
  controllers: [PublicQrController],
  providers: [PublicQrService, PublicMenuService],
})
export class PublicQrModule {}