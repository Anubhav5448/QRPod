import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EmailModule } from './common/email/email.module.js';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module.js';
import { SuperAdminAuthModule } from './superadmin-auth/superadmin-auth.module.js';
import { SuperAdminRestaurantsModule } from './superadmin-restaurants/superadmin-restaurants.module.js';
import { RestaurantAuthModule } from './restaurant-auth/restaurant-auth.module.js';
import { OwnerTablesModule } from './owner-tables/owner-tables.module.js';
import { PublicQrModule } from './public-qr/public-qr.module.js';
import { OwnerMenuModule } from './owner-menu/owner-menu.module.js';
import { PublicOrdersModule } from './public-orders/public-orders.module.js';
import { OwnerOrdersModule } from './owner-orders/owner-orders.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    EmailModule,
    CloudinaryModule,
    SuperAdminAuthModule,
    SuperAdminRestaurantsModule,
    RestaurantAuthModule,
    OwnerTablesModule,
    PublicQrModule,
    OwnerMenuModule,
    PublicOrdersModule,
    OwnerOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
