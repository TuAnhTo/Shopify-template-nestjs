import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'app-service',
    };
  }

  getDashboard(userId: string) {
    return {
      userId,
      data: {
        totalOrders: 150,
        revenue: 25000,
        customers: 89,
        products: 234,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  trackAnalytics(userId: string, data: unknown) {
    console.log(`Analytics for user ${userId}:`, data);

    return {
      success: true,
      tracked: true,
      timestamp: new Date().toISOString(),
    };
  }
}
