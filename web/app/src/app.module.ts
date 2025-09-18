import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
// import { join } from 'path';

import { AppController } from './controllers/app.controller';
import { StaticController } from './controllers/static.controller';
import { AppService } from './services/app.service';
import { StaticService } from './services/static.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AppController, StaticController],
  providers: [AppService, StaticService],
})
export class AppModule {}
