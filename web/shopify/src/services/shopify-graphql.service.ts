import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { shopifyApi, Session, ApiVersion } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import {
  GET_PRODUCTS,
  GET_ORDERS,
  GET_CUSTOMERS,
  GET_SHOP,
  CREATE_PRODUCT,
} from '../graphql';
import {
  ShopifyGraphQLResponse,
  ShopifyGraphQLProduct,
  ProductCreateInput,
  ProductCreateResponse,
} from '../types/shopify-api.types';

// Additional types for the service that aren't in the main types file
export interface ShopifyOrder {
  id: string;
  name: string;
  customer?: {
    displayName: string;
    email: string;
  };
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyCustomer {
  id: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  totalSpentV2: {
    amount: string;
    currencyCode: string;
  };
  ordersCount: {
    count: number;
  };
  state: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyShop {
  id: string;
  name: string;
  primaryDomain?: {
    host: string;
  };
  myshopifyDomain: string;
  contactEmail: string;
  currencyCode: string;
  ianaTimezone: string;
  plan?: {
    displayName: string;
  };
  description: string;
  billingAddress?: {
    country: string;
    province: string;
    city: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ShopifyGraphQLService {
  private readonly logger = new Logger(ShopifyGraphQLService.name);
  private readonly shopify: ReturnType<typeof shopifyApi>;

  constructor(private readonly configService: ConfigService) {
    this.shopify = shopifyApi({
      apiKey: this.configService.get('SHOPIFY_API_KEY') || 'your-api-key',
      apiSecretKey:
        this.configService.get('SHOPIFY_API_SECRET') || 'your-api-secret',
      scopes: [
        'read_products',
        'write_products',
        'read_orders',
        'read_customers',
        'read_shop',
      ],
      hostName: this.configService.get('HOST_NAME') || 'localhost',
      apiVersion: ApiVersion.October25,
      isEmbeddedApp: true,
    });
  }

  private createSession(shop: string, accessToken: string): Session {
    const session = this.shopify.session.customAppSession(shop);
    session.accessToken = accessToken;
    return session;
  }

  private async executeQuery<T>(
    shop: string,
    accessToken: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    try {
      const session = this.createSession(shop, accessToken);

      const client = new this.shopify.clients.Graphql({ session });
      const response = await client.query({
        data: {
          query,
          variables,
        },
      });

      if (!response.body) {
        throw new Error('No response body received from Shopify GraphQL API');
      }

      const typedResponse =
        response.body as unknown as ShopifyGraphQLResponse<T>;

      if (typedResponse.errors) {
        this.logger.error('GraphQL errors:', typedResponse.errors);
        throw new Error('GraphQL query failed with errors');
      }

      return typedResponse.data;
    } catch (error) {
      this.logger.error('GraphQL query failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Shopify GraphQL API error: ${errorMessage}`);
    }
  }

  async getProducts(
    shop: string,
    accessToken: string,
    first: number = 10,
  ): Promise<ShopifyGraphQLProduct[]> {
    const variables = { first };
    const result = await this.executeQuery<{
      products: { nodes: ShopifyGraphQLProduct[] };
    }>(shop, accessToken, GET_PRODUCTS, variables);

    return result.products.nodes;
  }

  async getOrders(
    shop: string,
    accessToken: string,
    first: number = 10,
  ): Promise<ShopifyOrder[]> {
    const variables = { first };
    const result = await this.executeQuery<{
      orders: { nodes: ShopifyOrder[] };
    }>(shop, accessToken, GET_ORDERS, variables);

    return result.orders.nodes;
  }

  async getCustomers(
    shop: string,
    accessToken: string,
    first: number = 10,
  ): Promise<ShopifyCustomer[]> {
    const variables = { first };
    const result = await this.executeQuery<{
      customers: { nodes: ShopifyCustomer[] };
    }>(shop, accessToken, GET_CUSTOMERS, variables);

    return result.customers.nodes;
  }

  async getShopInfo(shop: string, accessToken: string): Promise<ShopifyShop> {
    const result = await this.executeQuery<{ shop: ShopifyShop }>(
      shop,
      accessToken,
      GET_SHOP,
    );

    return result.shop;
  }

  async createProduct(
    shop: string,
    accessToken: string,
    productInput: ProductCreateInput,
  ): Promise<ShopifyGraphQLProduct> {
    const variables = {
      input: productInput,
    };

    const result = await this.executeQuery<ProductCreateResponse>(
      shop,
      accessToken,
      CREATE_PRODUCT,
      variables,
    );

    if (result.productCreate.userErrors.length > 0) {
      this.logger.error(
        'Product creation errors:',
        result.productCreate.userErrors,
      );
      throw new Error('Failed to create product in Shopify');
    }

    return result.productCreate.product;
  }
}
