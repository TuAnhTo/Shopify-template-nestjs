import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ShopifyController } from './controllers/shopify.controller';
import { ShopifyService } from './services/shopify.service';
import { ShopifyRepository } from './repositories/shopify.repository';
import { ShopifyGraphQLService } from './services/shopify-graphql.service';

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
  controllers: [ShopifyController],
  providers: [ShopifyService, ShopifyRepository, ShopifyGraphQLService],
})
export class AppModule {}
