import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JWKSService } from '../services/jwks.service';
import { SessionTokenPayload } from '../types/jwt.types';

@Injectable()
export class ShopifySessionGuard implements CanActivate {
  private readonly logger = new Logger(ShopifySessionGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly jwksService: JWKSService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const sessionToken = this.extractSessionToken(request);
      if (!sessionToken) {
        throw new UnauthorizedException('Session token not found');
      }

      const decodedToken = await this.validateSessionToken(sessionToken);

      (
        request as Request & {
          shopifySession: SessionTokenPayload;
          shop: string;
          originalSessionToken: string;
        }
      ).shopifySession = decodedToken;
      (
        request as Request & {
          shopifySession: SessionTokenPayload;
          shop: string;
          originalSessionToken: string;
        }
      ).shop = this.extractShopFromDest(decodedToken.dest);
      (
        request as Request & {
          shopifySession: SessionTokenPayload;
          shop: string;
          originalSessionToken: string;
        }
      ).originalSessionToken = sessionToken; // Preserve original JWT string for token exchange

      return true;
    } catch (error) {
      this.logger.error(
        'Session token validation failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new UnauthorizedException('Invalid session token');
    }
  }

  private extractSessionToken(request: Request): string | null {
    // Try header first (recommended)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try URL parameter as fallback
    const urlToken = request.query.id_token as string;
    if (urlToken) {
      return urlToken;
    }

    return null;
  }

  private async validateSessionToken(
    token: string,
  ): Promise<SessionTokenPayload> {
    try {
      // Use JWKS service for proper validation with Shopify's public keys
      const decoded = (await this.jwksService.validateSessionToken(
        token,
      )) as SessionTokenPayload;

      // Additional validation
      this.validateTokenClaims(decoded);

      return decoded;
    } catch (error) {
      // Fallback to secret-based validation for backward compatibility
      this.logger.warn(
        'JWKS validation failed, falling back to secret-based validation:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return this.validateWithSecret(token);
    }
  }

  private validateWithSecret(token: string): SessionTokenPayload {
    const clientSecret = this.configService.get('SHOPIFY_API_SECRET') as string;
    if (!clientSecret) {
      throw new Error('SHOPIFY_API_SECRET not configured');
    }

    try {
      // Decode and verify JWT using client secret (fallback method)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decoded = this.jwtService.verify(token, {
        secret: clientSecret,
        algorithms: ['HS256'],
      });

      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token format');
      }

      const typedDecoded = decoded as SessionTokenPayload;
      this.validateTokenClaims(typedDecoded);

      return typedDecoded;
    } catch (error) {
      throw new Error(
        `JWT validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private validateTokenClaims(token: SessionTokenPayload): void {
    const now = Math.floor(Date.now() / 1000);
    const clientId = this.configService.get('SHOPIFY_API_KEY') as string;

    // Check expiration
    if (token.exp <= now) {
      throw new Error('Session token has expired');
    }

    // Check not before
    if (token.nbf > now) {
      throw new Error('Session token is not yet valid');
    }

    // Check audience (client ID)
    if (token.aud !== clientId) {
      throw new Error('Invalid audience in session token');
    }

    // Check issuer and destination domains match
    const issuerDomain = this.extractDomainFromUrl(token.iss || '');
    const destDomain = this.extractDomainFromUrl(token.dest || '');

    if (issuerDomain !== destDomain) {
      throw new Error('Issuer and destination domains do not match');
    }

    // Validate shop domain format
    if (!destDomain.endsWith('.myshopify.com')) {
      throw new Error('Invalid shop domain format');
    }
  }

  private extractDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private extractShopFromDest(dest: string): string {
    try {
      return new URL(dest).hostname;
    } catch {
      throw new Error('Invalid destination URL');
    }
  }
}
