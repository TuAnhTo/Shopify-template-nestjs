import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// 🎯 Controllers - Clean & Simple
import { AuthController } from './controllers/auth.controller';
import { ShopifyAuthController } from './controllers/shopify-auth.controller';
import { ConfigController } from './controllers/config.controller';

// 🔧 Services
import { ShopifyAuthService } from './services/shopify-auth.service';
import { ShopifyClientService } from './services/shopify-client.service';
import { JWKSService } from './services/jwks.service';

// 🗄️ Database
import { User } from './entities/user.entity';
import { ShopifySession } from './entities/shopify-session.entity';

// 🔐 Guards & Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { ShopifySessionGuard } from './guards/shopify-session.guard';

/**
 * 🏗️ AuthModule - Clean Architecture for Shopify Embedded Apps
 *
 * ✅ Session Token Authentication
 * ✅ Token Exchange Flow
 * ✅ Simple Controllers
 * ✅ Clean Services
 * ❌ No OAuth Controllers
 * ❌ No Complex Logic
 */
@Module({
  imports: [
    // 📝 Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env', '.env.local'],
    }),

    // 🗄️ Database - Use unified DATABASE_URL
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/microservice_app',
      entities: [User, ShopifySession],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    TypeOrmModule.forFeature([User, ShopifySession]),

    // 🔐 Authentication
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        process.env.SHOPIFY_API_SECRET ||
        'fallback-secret',
      signOptions: {
        expiresIn: '1h',
        algorithm: 'HS256', // Shopify uses HS256
      },
    }),
  ],

  // 🎯 Controllers - Simple & Clean
  controllers: [
    AuthController, // Main auth endpoints (/api/auth/*)
    ShopifyAuthController, // Internal service APIs (/api/auth/shopify/*)
    ConfigController, // Public config (/api/config/*)
  ],

  // 🔧 Services & Providers
  providers: [
    // Core Services
    ShopifyAuthService,
    ShopifyClientService,
    JWKSService,

    // Security
    JwtStrategy,
    ShopifySessionGuard,
  ],

  // 📤 Exports for other modules
  exports: [ShopifyAuthService, ShopifyClientService, JWKSService],
})
export class AppModule {}

/**
 * 📋 Architecture Overview:
 *
 * 🔸 AuthController (/api/auth/*)
 *   - validate: Validate session token
 *   - exchange: Exchange session token for access token
 *   - session: Get session info
 *   - logout: Invalidate sessions
 *   - health: Health check
 *
 * 🔸 ShopifyAuthController (/api/auth/shopify/*)
 *   - check-shop/{shop}: Internal session check
 *   - exchange: Internal token exchange
 *   - health: Internal health check
 *   - info: Service information
 *
 * 🔸 ConfigController (/api/config/*)
 *   - /: Public configuration
 *   - frontend: Frontend-specific config
 *   - health: Config health check
 *
 * 🔸 ShopifyAuthService
 *   - validateSessionToken(): Core JWT validation
 *   - exchangeSessionToken(): Token exchange with Shopify
 *   - getSessionByShop(): Session management
 *   - invalidateSession(): Logout functionality
 *   - healthCheck(): Service health
 */
