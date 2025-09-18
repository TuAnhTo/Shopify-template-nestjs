import { Injectable, Logger } from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { Installation } from '../entities/installation.entity';
import { ProductCreateInput } from '../types/shopify-api.types';
import {
  ShopifyGraphQLService,
  ShopifyOrder,
  ShopifyCustomer,
  ShopifyShop,
} from '../services/shopify-graphql.service';
import { ShopifyGraphQLProduct } from '../types/shopify-api.types';

export interface IShopifyRepository {
  saveProduct(productData: Partial<Product>): Promise<Product>;
  findProductsByShop(shop: string): Promise<Product[]>;
  saveInstallation(installData: Partial<Installation>): Promise<Installation>;
  findInstallationByShop(shop: string): Promise<Installation | null>;
  getProductsFromShopify(shop: string): Promise<ShopifyGraphQLProduct[]>;
  getOrdersFromShopify(shop: string): Promise<ShopifyOrder[]>;
  getCustomersFromShopify(shop: string): Promise<ShopifyCustomer[]>;
  getShopInfoFromShopify(shop: string): Promise<ShopifyShop>;
  createProductInShopify(
    shop: string,
    productData: ProductCreateInput,
  ): Promise<ShopifyGraphQLProduct>;
}

@Injectable()
export class ShopifyRepository implements IShopifyRepository {
  private readonly logger = new Logger(ShopifyRepository.name);
  private products: Product[] = [];
  private installations: Installation[] = [];

  constructor(private readonly shopifyGraphQLService: ShopifyGraphQLService) {}

  async saveProduct(productData: Partial<Product>): Promise<Product> {
    const product: Product = {
      id: Date.now().toString(),
      title: productData.title!,
      price: productData.price!,
      shop: productData.shop!,
      inventory: productData.inventory || 0,
      createdAt: productData.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.products.push(product);
    return await Promise.resolve(product);
  }

  async findProductsByShop(shop: string): Promise<Product[]> {
    return await Promise.resolve(
      this.products.filter((product) => product.shop === shop),
    );
  }

  async saveInstallation(
    installData: Partial<Installation>,
  ): Promise<Installation> {
    const installation: Installation = {
      id: Date.now().toString(),
      shop: installData.shop!,
      accessToken: installData.accessToken!,
      scope: installData.scope || '',
      installedAt: installData.installedAt || new Date(),
    };

    this.installations.push(installation);
    return await Promise.resolve(installation);
  }

  async findInstallationByShop(shop: string): Promise<Installation | null> {
    return await Promise.resolve(
      this.installations.find((install) => install.shop === shop) || null,
    );
  }

  // Real Shopify API implementations
  async getProductsFromShopify(shop: string): Promise<ShopifyGraphQLProduct[]> {
    const installation = await this.findInstallationByShop(shop);
    if (!installation) {
      throw new Error(`No installation found for shop: ${shop}`);
    }

    try {
      return await this.shopifyGraphQLService.getProducts(
        shop,
        installation.accessToken,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch products for shop ${shop}:`, error);
      throw error;
    }
  }

  async getOrdersFromShopify(shop: string): Promise<ShopifyOrder[]> {
    const installation = await this.findInstallationByShop(shop);
    if (!installation) {
      throw new Error(`No installation found for shop: ${shop}`);
    }

    try {
      return await this.shopifyGraphQLService.getOrders(
        shop,
        installation.accessToken,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch orders for shop ${shop}:`, error);
      throw error;
    }
  }

  async getCustomersFromShopify(shop: string): Promise<ShopifyCustomer[]> {
    const installation = await this.findInstallationByShop(shop);
    if (!installation) {
      throw new Error(`No installation found for shop: ${shop}`);
    }

    try {
      return await this.shopifyGraphQLService.getCustomers(
        shop,
        installation.accessToken,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch customers for shop ${shop}:`, error);
      throw error;
    }
  }

  async getShopInfoFromShopify(shop: string): Promise<ShopifyShop> {
    const installation = await this.findInstallationByShop(shop);
    if (!installation) {
      throw new Error(`No installation found for shop: ${shop}`);
    }

    try {
      return await this.shopifyGraphQLService.getShopInfo(
        shop,
        installation.accessToken,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch shop info for shop ${shop}:`, error);
      throw error;
    }
  }

  async createProductInShopify(
    shop: string,
    productData: ProductCreateInput,
  ): Promise<ShopifyGraphQLProduct> {
    const installation = await this.findInstallationByShop(shop);
    if (!installation) {
      throw new Error(`No installation found for shop: ${shop}`);
    }

    try {
      return await this.shopifyGraphQLService.createProduct(
        shop,
        installation.accessToken,
        productData,
      );
    } catch (error) {
      this.logger.error(`Failed to create product for shop ${shop}:`, error);
      throw error;
    }
  }
}
