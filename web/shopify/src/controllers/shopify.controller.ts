import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ShopifyService } from '../services/shopify.service';
import { ShopifyAuthGuard } from '../shared/shopify-auth.guard';
import { ShopifySession, ShopifyShop } from '../shared/shopify-auth.decorator';
import type {
  ProductCreateInput,
  InstallationData,
  ShopifySessionInfo,
} from '../types/shopify-api.types';

@Controller('api/shopify')
@UseGuards(ShopifyAuthGuard)
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Get('products')
  async getProducts(@ShopifyShop() shop: string) {
    return this.shopifyService.getProducts(shop);
  }

  @Post('products')
  async createProduct(
    @Body() productData: ProductCreateInput,
    @ShopifyShop() shop: string,
  ) {
    return this.shopifyService.createProduct(shop, productData);
  }

  @Get('orders')
  async getOrders(@ShopifyShop() shop: string) {
    return this.shopifyService.getOrders(shop);
  }

  @Get('customers')
  async getCustomers(@ShopifyShop() shop: string) {
    return this.shopifyService.getCustomers(shop);
  }

  @Get('shop-info')
  async getShopInfo(@ShopifyShop() shop: string) {
    return this.shopifyService.getShopInfo(shop);
  }

  @Get('session')
  async getSession(@ShopifySession() session: ShopifySessionInfo) {
    return {
      success: true,
      session: {
        shop: session.shop,
        userId: session.userId,
        sessionId: session.sessionId,
      },
    };
  }

  @Post('install')
  async installApp(
    @Body() installData: InstallationData,
    @ShopifySession() session: ShopifySessionInfo,
  ) {
    return this.shopifyService.handleAppInstall(installData);
  }

  @Get('health')
  getHealth() {
    return this.shopifyService.getHealth();
  }
}
