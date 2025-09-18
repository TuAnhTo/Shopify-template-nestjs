import { Injectable, Logger } from '@nestjs/common';
import { ShopifyRepository } from '../repositories/shopify.repository';
import {
  InstallationData,
  ProductCreateInput,
} from '../types/shopify-api.types';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  constructor(private readonly shopifyRepository: ShopifyRepository) {}

  async getProducts(shop: string) {
    this.logger.log(`Fetching products for shop: ${shop}`);

    try {
      const products =
        await this.shopifyRepository.getProductsFromShopify(shop);

      return {
        products: products.map((product) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          status: product.status,
          vendor: product.vendor,
          productType: product.productType,
          tags: product.tags,
          price: product.priceRangeV2?.minVariantPrice?.amount
            ? parseFloat(product.priceRangeV2.minVariantPrice.amount)
            : 0,
          currency: product.priceRangeV2?.minVariantPrice?.currencyCode,
          inventory: product.totalInventory || 0,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
        shop,
      };
    } catch (error) {
      this.logger.error(`Error fetching products for shop ${shop}:`, error);
      throw error;
    }
  }

  async createProduct(shop: string, productData: ProductCreateInput) {
    this.logger.log(`Creating product for shop: ${shop}`);

    try {
      const shopifyProduct =
        await this.shopifyRepository.createProductInShopify(shop, productData);

      // Also save to local storage for caching
      const product = await this.shopifyRepository.saveProduct({
        title: shopifyProduct.title,
        price: shopifyProduct.priceRangeV2?.minVariantPrice?.amount
          ? parseFloat(shopifyProduct.priceRangeV2.minVariantPrice.amount)
          : 0,
        shop,
        inventory: shopifyProduct.totalInventory || 0,
        createdAt: new Date(shopifyProduct.createdAt),
      });

      return {
        success: true,
        product: {
          ...product,
          shopifyId: shopifyProduct.id,
          handle: shopifyProduct.handle,
          status: shopifyProduct.status,
          vendor: shopifyProduct.vendor,
          productType: shopifyProduct.productType,
          tags: shopifyProduct.tags,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating product for shop ${shop}:`, error);
      throw error;
    }
  }

  async getOrders(shop: string) {
    this.logger.log(`Fetching orders for shop: ${shop}`);

    try {
      const orders = await this.shopifyRepository.getOrdersFromShopify(shop);

      return {
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.name,
          customer: order.customer?.displayName || 'Guest',
          customerEmail: order.customer?.email,
          total: order.totalPriceSet?.shopMoney?.amount
            ? parseFloat(order.totalPriceSet.shopMoney.amount)
            : 0,
          currency: order.totalPriceSet?.shopMoney?.currencyCode,
          status: order.displayFulfillmentStatus,
          financialStatus: order.displayFinancialStatus,
          processedAt: order.processedAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
        shop,
      };
    } catch (error) {
      this.logger.error(`Error fetching orders for shop ${shop}:`, error);
      throw error;
    }
  }

  async getCustomers(shop: string) {
    this.logger.log(`Fetching customers for shop: ${shop}`);

    try {
      const customers =
        await this.shopifyRepository.getCustomersFromShopify(shop);

      return {
        customers: customers.map((customer) => ({
          id: customer.id,
          name: customer.displayName,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          totalSpent: customer.totalSpentV2?.amount
            ? parseFloat(customer.totalSpentV2.amount)
            : 0,
          currency: customer.totalSpentV2?.currencyCode,
          ordersCount: customer.ordersCount?.count || 0,
          state: customer.state,
          tags: customer.tags,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        })),
        shop,
      };
    } catch (error) {
      this.logger.error(`Error fetching customers for shop ${shop}:`, error);
      throw error;
    }
  }

  async getShopInfo(shop: string) {
    this.logger.log(`Fetching shop info for: ${shop}`);

    try {
      const shopInfo =
        await this.shopifyRepository.getShopInfoFromShopify(shop);

      return {
        shop: {
          id: shopInfo.id,
          name: shopInfo.name,
          domain: shopInfo.primaryDomain?.host,
          myshopifyDomain: shopInfo.myshopifyDomain,
          email: shopInfo.contactEmail,
          currency: shopInfo.currencyCode,
          timezone: shopInfo.ianaTimezone,
          plan: shopInfo.plan?.displayName,
          description: shopInfo.description,
          country: shopInfo.billingAddress?.country,
          province: shopInfo.billingAddress?.province,
          city: shopInfo.billingAddress?.city,
          createdAt: shopInfo.createdAt,
          updatedAt: shopInfo.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching shop info for shop ${shop}:`, error);
      throw error;
    }
  }

  async handleAppInstall(installData: InstallationData) {
    this.logger.log(`Handling app installation:`, installData);

    await this.shopifyRepository.saveInstallation({
      ...installData,
      installedAt: new Date(),
    });

    return { success: true, message: 'App installed successfully' };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'shopify',
      timestamp: new Date().toISOString(),
    };
  }
}
