import { Controller, Get, All, Req, Res, Query, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from '../services/proxy.service';
import { ShopifyAuthService } from '../services/shopify-auth.service';

/**
 * 🔐 Enhanced Shopify Auth Controller for Gateway
 * 
 * Handles Shopify embedded app authentication flow at Gateway level
 * Based on successful boostbar-smart-discount implementation
 */
@Controller()
export class ShopifyAuthController {
  private readonly logger = new Logger(ShopifyAuthController.name);

  constructor(
    private readonly proxyService: ProxyService,
    private readonly shopifyAuthService: ShopifyAuthService,
  ) {}

  /**
   * 🏠 Root Route Handler
   * Handle "/" route for embedded Shopify apps
   * Based on boostbar EnsureInstalledOnShop middleware logic
   */
  @Get()
  async handleRoot(@Req() req: Request, @Res() res: Response) {
    const shop = req.query.shop as string;
    const embedded = req.query.embedded as string;
    const host = req.query.host as string;

    this.logger.log(`Root request: shop=${shop}, embedded=${embedded}, host=${host}`);

    // Always forward to app service for static file serving
    // App service will handle SHOPIFY_API_KEY injection and static files
    // But first, check auth for Shopify requests
    
    if (shop) {
      // This is a Shopify request, apply auth middleware logic
      const isInstalled = await this.shopifyAuthService.checkShopInstallation(shop);
      
      // For embedded requests with valid session token, handle token exchange
      if (embedded === '1' && req.query.id_token) {
        const isValidToken = await this.shopifyAuthService.validateSessionToken(req.query.id_token as string);
        
        if (!isValidToken) {
          this.logger.warn(`Invalid session token for shop ${shop}, redirecting to auth`);
          return this.redirectToAuth(req, res);
        }

        // If valid session token but no stored session, perform token exchange
        if (!isInstalled) {
          this.logger.log(`Valid session token but no stored session for ${shop}, performing token exchange`);
          
          try {
            await this.shopifyAuthService.performTokenExchange(req.query.id_token as string);
            this.logger.log(`Token exchange successful for shop ${shop}`);
          } catch (error) {
            this.logger.error(`Token exchange failed for shop ${shop}:`, error.message);
            return this.redirectToAuth(req, res);
          }
        }
      } else {
        // For non-embedded or requests without session token
        if (!isInstalled) {
          this.logger.log(`Shop ${shop} not installed, redirecting to auth`);
          return this.redirectToAuth(req, res);
        }

        // For non-embedded requests, check active session
        if (embedded !== '1') {
          const hasActiveSession = await this.shopifyAuthService.checkActiveSession(shop);
          if (!hasActiveSession) {
            this.logger.log(`No active session for shop ${shop}, redirecting to auth`);
            return this.redirectToAuth(req, res);
          }
        }
      }
    }

    // Forward to app service to serve static files with SHOPIFY_API_KEY injection
    this.logger.log('Forwarding to app service for static file serving');
    return this.proxyService.forwardRequest(req, res, 'app');
  }

  /**
   * 🔑 OAuth Initiation
   * Handle /api/auth route for OAuth start
   */
  @Get('api/auth')
  async initiateAuth(@Req() req: Request, @Res() res: Response) {
    const shop = req.query.shop as string;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter required' });
    }

    this.logger.log(`OAuth initiation for shop: ${shop}`);
    
    // Forward to auth service for OAuth handling
    return this.proxyService.forwardRequest(req, res, 'auth');
  }

  /**
   * 🔄 OAuth Callback
   * Handle /api/auth/callback route for OAuth completion
   */
  @Get('api/auth/callback')
  async handleCallback(@Req() req: Request, @Res() res: Response) {
    this.logger.log('OAuth callback received');
    
    // Forward to auth service for callback processing
    return this.proxyService.forwardRequest(req, res, 'auth');
  }

  /**
   * 🚪 Exit iFrame Handler
   * Handle exit-iframe route for embedded app authentication
   */
  @Get('exit-iframe')
  async exitIframe(@Req() req: Request, @Res() res: Response) {
    const shop = req.query.shop as string;
    const host = req.query.host as string;

    this.logger.log(`Exit iframe request for shop: ${shop}`);

    if (!shop) {
      return res.status(400).send('Shop parameter required');
    }

    // Generate auth URL
    const authUrl = this.shopifyAuthService.generateAuthUrl(shop, host);
    
    // Return exit iframe page that redirects to auth
    const exitIframeHtml = this.generateExitIframeHtml(authUrl);
    return res.setHeader('Content-Type', 'text/html').send(exitIframeHtml);
  }

  /**
   * 🔀 App Routes Handler
   * Handle /app/* routes for embedded apps
   */
  @All(['app', 'app/*path'])
  async handleAppRoutes(@Req() req: Request, @Res() res: Response) {
    const shop = req.query.shop as string;
    
    this.logger.log(`App route: ${req.path}, shop: ${shop}`);

    // If embedded app with shop, ensure authentication
    if (shop && req.query.embedded === '1') {
      const isInstalled = await this.shopifyAuthService.checkShopInstallation(shop);
      
      if (!isInstalled) {
        return this.redirectToAuth(req, res);
      }
    }

    // Forward to app service
    return this.proxyService.forwardRequest(req, res, 'app');
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Redirect to authentication
   */
  private async redirectToAuth(req: Request, res: Response) {
    const shop = req.query.shop as string;
    const embedded = req.query.embedded as string;

    if (!shop) {
      return res.status(400).send('Shop parameter required');
    }

    // For embedded apps, use client-side redirect
    if (embedded === '1') {
      return this.clientSideRedirect(req, res);
    }

    // For non-embedded, use server-side redirect
    return this.serverSideRedirect(req, res);
  }

  /**
   * Client-side redirect for embedded apps
   */
  private clientSideRedirect(req: Request, res: Response) {
    const shop = req.query.shop as string;
    const host = req.query.host as string;

    const redirectUriParams = new URLSearchParams({
      shop,
      host: host || '',
    }).toString();

    const queryParams = new URLSearchParams({
      ...req.query as Record<string, string>,
      shop,
      redirectUri: `${process.env.GATEWAY_HOST}/api/auth?${redirectUriParams}`,
    }).toString();

    return res.redirect(`/exit-iframe?${queryParams}`);
  }

  /**
   * Server-side redirect for non-embedded apps
   */
  private async serverSideRedirect(req: Request, res: Response) {
    const shop = req.query.shop as string;
    
    // Generate OAuth URL and redirect
    const authUrl = this.shopifyAuthService.generateOAuthUrl(shop);
    return res.redirect(authUrl);
  }

  /**
   * Generate exit iframe HTML page
   */
  private generateExitIframeHtml(authUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <script src="https://unpkg.com/@shopify/app-bridge@3"></script>
        </head>
        <body>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              if (window.top === window.self) {
                // Not in iframe, redirect directly
                window.location.href = '${authUrl}';
              } else {
                // In iframe, use App Bridge redirect
                const urlParams = new URLSearchParams(window.location.search);
                const shop = urlParams.get('shop');
                
                if (shop) {
                  const app = createApp({
                    apiKey: '${process.env.SHOPIFY_API_KEY}',
                    host: urlParams.get('host') || '',
                  });
                  
                  const redirect = Redirect.create(app);
                  redirect.dispatch(Redirect.Action.REMOTE, '${authUrl}');
                } else {
                  window.location.href = '${authUrl}';
                }
              }
            });
          </script>
          <p>Redirecting to authentication...</p>
        </body>
      </html>
    `;
  }
}