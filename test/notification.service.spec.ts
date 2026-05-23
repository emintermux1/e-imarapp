import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../src/notifications/notification.service';
import { buildWatchlistNotificationPayload } from '../src/notifications/notification-payloads';

function config(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as ConfigService;
}

describe('NotificationService', () => {
  afterEach(() => jest.restoreAllMocks());

  test('returns requires_provider without PUSH_GATEWAY_URL', async () => {
    const service = new NotificationService(config({}));
    const result = await service.sendWatchlistPush('token-1', buildWatchlistNotificationPayload({ change_id: 'change-1', user_reference: 'user-1' }), 'web');
    expect(result.status).toBe('requires_provider');
  });

  test('supports dry-run without external notification calls', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = new NotificationService(config({ PUSH_GATEWAY_URL: 'https://push.invalid/send', PUSH_GATEWAY_DRY_RUN: 'true' }));
    const result = await service.sendWatchlistPush('token-1', buildWatchlistNotificationPayload({
      change_id: 'change-1',
      change_type: 'aski_started',
      user_reference: 'user-1',
      plan_title: '1/1000 Uygulama İmar Planı',
      target: 'secret-token'
    }), 'ios');

    expect(result.status).toBe('dry_run');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.response?.payload).toMatchObject({
      token: 'token-1',
      platform: 'ios',
      title: 'Yeni askı planı bildirimi'
    });
    expect(JSON.stringify(result.response)).not.toContain('secret-token');
  });

  test('posts the defined gateway payload when configured', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 202 } as Response);
    const service = new NotificationService(config({ PUSH_GATEWAY_URL: 'https://push.example.test/send' }));
    const payload = buildWatchlistNotificationPayload({ change_id: 'change-2', change_type: 'status_change', user_reference: 'user-2', province: 'İstanbul' });

    const result = await service.sendWatchlistPush('token-2', payload, 'android');

    expect(result).toEqual({ status: 'sent', response: { httpStatus: 202 } });
    expect(fetchSpy).toHaveBeenCalledWith('https://push.example.test/send', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('token-2')
    }));
  });
});
