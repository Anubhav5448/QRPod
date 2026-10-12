import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  getHello(): string {
    return `Env: ${this.config.get('NODE_ENV')}, Port: ${this.config.get('PORT')}`;
  }
}
