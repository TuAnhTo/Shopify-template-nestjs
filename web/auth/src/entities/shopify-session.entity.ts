import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shopify_sessions')
export class ShopifySession {
  @PrimaryColumn()
  id: string; // session ID từ JWT

  @Column()
  shop: string; // shop domain

  @Column()
  userId: string; // user ID từ session token

  @Column({ type: 'text' })
  accessToken: string; // offline/online access token

  @Column({ nullable: true })
  onlineAccessToken?: string; // online access token riêng biệt

  @Column({ type: 'simple-array' })
  scope: string[]; // access scopes được grant

  @Column({ nullable: true })
  expiresAt?: Date; // expiry time cho online tokens

  @Column({ type: 'json', nullable: true })
  userInfo?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    account_owner: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
