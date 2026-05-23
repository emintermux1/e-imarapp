import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildPushGatewayPayload, WatchlistNotificationPayload } from './notification-payloads';

export interface PushDeliveryResult {
  status: 'sent' | 'failed' | 'requires_provider' | 'dry_run';
  response: Record<string, unknown> | null;
}

@Injectable()
export class NotificationService {
  constructor(private readonly config: ConfigService) {}

  async sendWatchlistPush(token: string, payload: WatchlistNotificationPayload, platform?: string | null): Promise<PushDeliveryResult> {
    const gateway = this.config.get<string>('PUSH_GATEWAY_URL');
    const gatewayPayload = buildPushGatewayPayload(token, payload, platform);

    if (!gateway) {
      return { status: 'requires_provider', response: { message: 'PUSH_GATEWAY_URL not configured.', platform: gatewayPayload.platform } };
    }

    if (this.config.get<string>('PUSH_GATEWAY_DRY_RUN') === 'true') {
      return { status: 'dry_run', response: { gatewayConfigured: true, platform: gatewayPayload.platform, payload: gatewayPayload } };
    }

    try {
      const res = await fetch(gateway, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatewayPayload)
      });
      return { status: res.ok ? 'sent' : 'failed', response: { httpStatus: res.status } };
    } catch (error) {
      return { status: 'failed', response: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}
