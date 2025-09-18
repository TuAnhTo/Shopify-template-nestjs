import { Injectable } from '@nestjs/common';
import { WebhookEvent } from '../entities/webhook-event.entity';

export interface IWebhookRepository {
  saveWebhookEvent(event: Partial<WebhookEvent>): Promise<WebhookEvent>;
  findEventsByShop(shopDomain: string): Promise<WebhookEvent[]>;
  findEventsByType(type: string): Promise<WebhookEvent[]>;
}

@Injectable()
export class WebhookRepository implements IWebhookRepository {
  private events: WebhookEvent[] = [];

  async saveWebhookEvent(
    eventData: Partial<WebhookEvent>,
  ): Promise<WebhookEvent> {
    const event: WebhookEvent = {
      id: Date.now().toString(),
      type: eventData.type!,
      shopDomain: eventData.shopDomain!,
      payload: eventData.payload!,
      processedAt: eventData.processedAt || new Date(),
      createdAt: new Date(),
    };

    this.events.push(event);
    return await Promise.resolve(event);
  }

  async findEventsByShop(shopDomain: string): Promise<WebhookEvent[]> {
    return await Promise.resolve(
      this.events.filter((event) => event.shopDomain === shopDomain),
    );
  }

  async findEventsByType(type: string): Promise<WebhookEvent[]> {
    return await Promise.resolve(
      this.events.filter((event) => event.type === type),
    );
  }
}
