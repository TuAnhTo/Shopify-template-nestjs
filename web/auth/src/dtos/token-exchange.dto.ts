import { IsString, IsOptional, IsIn } from 'class-validator';

export class TokenExchangeDto {
  @IsString()
  sessionToken: string;

  @IsOptional()
  @IsIn(['online', 'offline'])
  requestedTokenType?: 'online' | 'offline' = 'offline';
}

export class ShopifyAuthResponseDto {
  success: boolean;
  message?: string;
  shop?: string;
  sessionId?: string;
  accessToken?: string;
  expiresIn?: number;
  userInfo?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    account_owner: boolean;
  };
}
