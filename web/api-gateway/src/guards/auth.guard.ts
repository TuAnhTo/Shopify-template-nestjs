import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface SessionTokenPayload {
  iss: string;
  dest: string;
  aud: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid: string;
}

interface ShopifySessionToken {
  header: {
    alg: string;
    typ: string;
  };
  payload: SessionTokenPayload;
  signature: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  private readonly publicPaths = [
    '/',
    '/health',
    '/api/auth/shopify/oauth',
    '/api/auth/shopify/callback',
    '/api/webhooks',
    '/api/config',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;

    // Check if path is public
    if (this.isPublicPath(path)) {
      return true;
    }

    try {
      // Extract and validate session token
      const sessionToken = this.extractSessionToken(request);

      if (!sessionToken) {
        throw new UnauthorizedException('Session token required');
      }

      // Validate the session token
      const decodedToken = this.validateSessionToken(sessionToken);

      // Add session info to request for downstream services
      this.attachSessionToRequest(request, decodedToken, sessionToken);

      return true;
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Authentication failed',
      );
    }
  }

  private extractSessionToken(request: Request): string | null {
    // Try to get session token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get from custom header (App Bridge sometimes uses this)
    const customHeader = request.headers['x-shopify-session-token'] as string;
    if (customHeader) {
      return customHeader;
    }

    // Try to get from query parameter (fallback for some edge cases)
    const queryToken = request.query['session-token'] as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }

  private validateSessionToken(token: string): ShopifySessionToken {
    const clientSecret = this.configService.get('SHOPIFY_API_SECRET') as string;
    const clientId = this.configService.get('SHOPIFY_API_KEY') as string;

    if (!clientSecret || !clientId) {
      throw new UnauthorizedException('Shopify credentials not configured');
    }

    try {
      // Verify JWT signature and decode
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decodedRawToken = this.jwtService.verify(token, {
        secret: clientSecret,
        algorithms: ['HS256'],
      });

      if (!decodedRawToken || typeof decodedRawToken !== 'object') {
        throw new UnauthorizedException('Invalid session token format');
      }

      const payload = decodedRawToken as SessionTokenPayload;

      // Validate token claims
      this.validateTokenClaims(payload, clientId);

      // Return structured token
      return {
        header: {
          alg: 'HS256',
          typ: 'JWT',
        },
        payload,
        signature: token.split('.')[2],
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Invalid session token: ${error.message}`,
      );
    }
  }

  private validateTokenClaims(
    payload: SessionTokenPayload,
    clientId: string,
  ): void {
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp <= now) {
      throw new UnauthorizedException('Session token has expired');
    }

    // Check not before
    if (payload.nbf > now) {
      throw new UnauthorizedException('Session token is not yet valid');
    }

    // Check audience (should match our app's client ID)
    if (payload.aud !== clientId) {
      throw new UnauthorizedException('Invalid audience in session token');
    }

    // Check issuer (should be Shopify)
    if (!payload.iss || !payload.iss.includes('shopify.com')) {
      throw new UnauthorizedException('Invalid issuer in session token');
    }

    // Validate destination URL
    if (!payload.dest || !this.isValidShopDomain(payload.dest)) {
      throw new UnauthorizedException('Invalid destination in session token');
    }
  }

  private isValidShopDomain(dest: string): boolean {
    try {
      const url = new URL(dest);
      const hostname = url.hostname;

      // Check if it's a valid Shopify domain
      return (
        hostname.endsWith('.myshopify.com') ||
        hostname.endsWith('.shopify.com') ||
        hostname.endsWith('.shopifycloud.com')
      );
    } catch {
      return false;
    }
  }

  private attachSessionToRequest(
    request: Request,
    sessionToken: ShopifySessionToken,
    originalToken: string,
  ): void {
    // Extract shop domain from destination
    const shop = this.extractShopFromDest(sessionToken.payload.dest);
    /**
     * Attach session info to request for downstream services.
     * Extends the request object with custom properties using type assertion.
     */
    (
      request as Request & {
        shopifySession: ShopifySessionToken;
        shop: string;
        originalSessionToken: string;
        userId: string;
        sessionId: string;
      }
    ).shopifySession = sessionToken;

    (request as Request & { shop: string }).shop = shop;
    (
      request as Request & { originalSessionToken: string }
    ).originalSessionToken = originalToken;
    (request as Request & { userId: string }).userId = sessionToken.payload.sub;
    (request as Request & { sessionId: string }).sessionId =
      sessionToken.payload.sid;

    // Add to headers for forwarding to microservices
    request.headers['x-shopify-shop-domain'] = shop;
    request.headers['x-shopify-user-id'] = sessionToken.payload.sub;
    request.headers['x-shopify-session-id'] = sessionToken.payload.sid;
    request.headers['x-shopify-session-token'] = originalToken;
  }

  private extractShopFromDest(dest: string): string {
    try {
      return new URL(dest).hostname;
    } catch {
      throw new UnauthorizedException(
        'Invalid destination URL in session token',
      );
    }
  }

  private isPublicPath(path: string): boolean {
    return this.publicPaths.some((publicPath) => {
      if (publicPath.endsWith('*')) {
        return path.startsWith(publicPath.slice(0, -1));
      }
      return path === publicPath || path.startsWith(publicPath + '/');
    });
  }
}
