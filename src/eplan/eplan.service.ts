import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';

const EPLAN_BASE = 'https://eplan.csb.gov.tr';
const RATE_LIMIT_MS = 3000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

interface ScrapedPlan {
  planExternalId: string;
  title: string;
  planType: string;
  status: string;
  province?: string;
  district?: string;
  approvalDate?: string;
  askiStartDate?: string;
  askiEndDate?: string;
  planNumber?: string;
  scale?: string;
  gmlUrl?: string;
  pdfUrl?: string;
  documentUrls: string[];
  metadata: Record<string, unknown>;
}

@Injectable()
export class EplanService {
  private readonly logger = new Logger(EplanService.name);

  constructor(private readonly db: DatabaseService) {}

  async scrapeAskidakiPlanlar(province?: string, district?: string): Promise<unknown> {
    const url = this.buildSearchUrl('askida', province, district);
    const html = await this.fetchPage(url);
    if (!html) {
      return {
        status: 'unavailable',
        issue: { code: IntegrationErrorCode.Unavailable, message: `Could not fetch e-Plan page: ${url}` }
      };
    }

    const plans = this.parsePlanList(html, 'askida');
    return {
      status: plans.length > 0 ? 'ok' : 'empty',
      count: plans.length,
      source: url,
      plans,
      scrapedAt: new Date().toISOString()
    };
  }

  async scrapeYururluktekiPlanlar(province?: string, district?: string): Promise<unknown> {
    const url = this.buildSearchUrl('yururlukte', province, district);
    const html = await this.fetchPage(url);
    if (!html) {
      return {
        status: 'unavailable',
        issue: { code: IntegrationErrorCode.Unavailable, message: `Could not fetch e-Plan page: ${url}` }
      };
    }

    const plans = this.parsePlanList(html, 'yururlukte');
    return {
      status: plans.length > 0 ? 'ok' : 'empty',
      count: plans.length,
      source: url,
      plans,
      scrapedAt: new Date().toISOString()
    };
  }

  async syncToDatabase(plans: ScrapedPlan[]): Promise<{ inserted: number; updated: number; changes: number }> {
    if (!this.db.isConfigured()) return { inserted: 0, updated: 0, changes: 0 };

    let inserted = 0;
    let updated = 0;
    let changes = 0;

    for (const plan of plans) {
      const existing = await this.db.query(
        `select id, status, metadata from eplan_plans where source_id = 'csb-e-plan' and plan_external_id = $1`,
        [plan.planExternalId]
      );

      if (existing.rowCount === 0) {
        await this.db.query(
          `insert into eplan_plans
            (source_id, plan_external_id, plan_type, status, title, province, district,
             approval_date, aski_start_date, aski_end_date, plan_number, scale,
             gml_url, pdf_url, document_urls, metadata, scraped_at)
           values ('csb-e-plan', $1, $2, $3, $4, $5, $6, $7::date, $8::date, $9::date, $10, $11, $12, $13, $14, $15, now())
           on conflict do nothing`,
          [
            plan.planExternalId, plan.planType, plan.status, plan.title,
            plan.province, plan.district, plan.approvalDate || null,
            plan.askiStartDate || null, plan.askiEndDate || null,
            plan.planNumber, plan.scale, plan.gmlUrl, plan.pdfUrl,
            plan.documentUrls, JSON.stringify(plan.metadata)
          ]
        );
        inserted++;

        const newRow = await this.db.query(
          `select id from eplan_plans where source_id = 'csb-e-plan' and plan_external_id = $1`,
          [plan.planExternalId]
        );
        if (newRow.rows[0]) {
          await this.logChange(newRow.rows[0].id, 'new_plan', null, plan);
          changes++;
        }
      } else {
        const row = existing.rows[0] as { id: string; status: string; metadata: Record<string, unknown> };

        if (row.status !== plan.status) {
          await this.logChange(row.id, 'status_change', { status: row.status }, { status: plan.status });
          changes++;
        }

        await this.db.query(
          `update eplan_plans set
            status = $2, title = $3, gml_url = $4, pdf_url = $5, document_urls = $6,
            metadata = $7, scraped_at = now(), updated_at = now()
           where id = $1`,
          [row.id, plan.status, plan.title, plan.gmlUrl, plan.pdfUrl, plan.documentUrls, JSON.stringify(plan.metadata)]
        );
        updated++;
      }
    }

    return { inserted, updated, changes };
  }

  async triggerWatchlistNotifications(): Promise<{ notified: number }> {
    if (!this.db.isConfigured()) return { notified: 0 };

    const unnotified = await this.db.query(
      `select cl.id as change_id, cl.change_type, cl.new_value,
              ep.title as plan_title, ep.province, ep.district,
              w.user_reference, w.webhook_url, w.notify_channels
       from plan_changes_log cl
       join eplan_plans ep on ep.id = cl.eplan_plan_id
       join watchlist w on w.active = true
         and (
           (w.watch_type = 'province' and w.watch_target = ep.province)
           or (w.watch_type = 'district' and w.watch_target = ep.district)
           or (w.watch_type = 'municipality' and ep.municipality_id::text = w.watch_target)
         )
       where cl.notified = false
       order by cl.detected_at
       limit 100`
    );

    let notified = 0;
    for (const row of unnotified.rows as { change_id: string; webhook_url?: string; notify_channels: string[] }[]) {
      if (row.webhook_url && row.notify_channels.includes('webhook')) {
        try {
          await fetch(row.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(row)
          });
        } catch (err) {
          this.logger.warn(`Webhook failed for change ${row.change_id}: ${err}`);
        }
      }

      await this.db.query(`update plan_changes_log set notified = true where id = $1`, [row.change_id]);
      notified++;
    }

    return { notified };
  }

  async searchPlans(query: {
    province?: string;
    district?: string;
    status?: string;
    planType?: string;
    limit?: number;
  }): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 0;

    if (query.province) { conditions.push(`province = $${++idx}`); params.push(query.province); }
    if (query.district) { conditions.push(`district = $${++idx}`); params.push(query.district); }
    if (query.status) { conditions.push(`status = $${++idx}`); params.push(query.status); }
    if (query.planType) { conditions.push(`plan_type = $${++idx}`); params.push(query.planType); }

    const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
    const limit = query.limit ?? 100;

    const result = await this.db.query(
      `select id, plan_external_id, plan_type, status, title, province, district,
              approval_date, aski_start_date, aski_end_date, plan_number, scale,
              gml_url, pdf_url, document_urls, ST_AsGeoJSON(geom)::json as geometry,
              scraped_at
       from eplan_plans ${where}
       order by scraped_at desc
       limit $${++idx}`,
      [...params, limit]
    );

    return { status: result.rowCount ? 'ok' : 'empty', count: result.rowCount, plans: result.rows };
  }

  // --- HTML parsing ---

  private parsePlanList(html: string, defaultStatus: string): ScrapedPlan[] {
    const $ = cheerio.load(html);
    const plans: ScrapedPlan[] = [];

    // e-Plan genellikle tablo veya kart yapısıyla plan listeler
    // Birden fazla selector deneriz çünkü sayfa yapısı değişebilir
    $('table tbody tr, .plan-card, .plan-item, [class*="plan"]').each((_i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!text || text.length < 10) return;

      const links = $el.find('a[href]').toArray().map((a) => $(a).attr('href') || '');
      const gmlUrl = links.find((l) => l.includes('.gml') || l.includes('gml'));
      const pdfUrl = links.find((l) => l.includes('.pdf') || l.includes('pdf'));
      const documentUrls = links
        .filter((l) => l.startsWith('http') || l.startsWith('/'))
        .map((l) => (l.startsWith('/') ? `${EPLAN_BASE}${l}` : l));

      const cells = $el.find('td').toArray().map((td) => $(td).text().trim());

      const plan: ScrapedPlan = {
        planExternalId: this.extractId($el, cells),
        title: cells[1] || cells[0] || text.slice(0, 200),
        planType: this.detectPlanType(text),
        status: defaultStatus,
        province: cells.find((c) => c.match(/^[A-ZÇĞİÖŞÜ]{2,}/)) || undefined,
        district: undefined,
        approvalDate: this.extractDate(text, 'onay'),
        askiStartDate: this.extractDate(text, 'askı başl'),
        askiEndDate: this.extractDate(text, 'askı bit'),
        planNumber: cells.find((c) => c.match(/^\d{4,}/)) || undefined,
        scale: this.extractScale(text),
        gmlUrl: gmlUrl ? (gmlUrl.startsWith('/') ? `${EPLAN_BASE}${gmlUrl}` : gmlUrl) : undefined,
        pdfUrl: pdfUrl ? (pdfUrl.startsWith('/') ? `${EPLAN_BASE}${pdfUrl}` : pdfUrl) : undefined,
        documentUrls,
        metadata: { rawText: text.slice(0, 500), cellCount: cells.length }
      };

      if (plan.planExternalId && plan.title) {
        plans.push(plan);
      }
    });

    return plans;
  }

  private extractId($el: cheerio.Cheerio<any>, cells: string[]): string {
    const dataId = $el.attr('data-id') || $el.attr('data-plan-id') || $el.find('[data-id]').attr('data-id');
    if (dataId) return dataId;
    const linkWithId = $el.find('a[href*="id="]').attr('href') ?? '';
    if (linkWithId) {
      const match = linkWithId.match(/id=([^&]+)/);
      if (match?.[1]) return match[1];
    }
    return cells[0] || `unknown-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private detectPlanType(text: string): string {
    const lower = text.toLocaleLowerCase('tr-TR');
    if (lower.includes('nazım') || lower.includes('nip') || lower.includes('1/5000')) return 'nip';
    if (lower.includes('uygulama') || lower.includes('uip') || lower.includes('1/1000')) return 'uip';
    if (lower.includes('çevre düzeni')) return 'cevreduzeni';
    if (lower.includes('özel')) return 'ozel';
    return 'diger';
  }

  private extractDate(text: string, keyword: string): string | undefined {
    const lower = text.toLocaleLowerCase('tr-TR');
    const idx = lower.indexOf(keyword);
    if (idx === -1) return undefined;
    const after = text.slice(idx, idx + 60);
    const match = after.match(/(\d{2}[./-]\d{2}[./-]\d{4})/);
    return match ? match[1] : undefined;
  }

  private extractScale(text: string): string | undefined {
    const match = text.match(/1\/(\d{1,6}\.?\d{0,3})/);
    return match ? `1/${match[1]}` : undefined;
  }

  // --- HTTP ---

  private buildSearchUrl(status: string, province?: string, district?: string): string {
    const params = new URLSearchParams();
    if (status === 'askida') params.set('status', 'askida');
    if (status === 'yururlukte') params.set('status', 'yururlukte');
    if (province) params.set('il', province);
    if (district) params.set('ilce', district);
    return `${EPLAN_BASE}/Plan/PlanAra?${params.toString()}`;
  }

  private async fetchPage(url: string): Promise<string | null> {
    try {
      await this.delay(RATE_LIMIT_MS);
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': EPLAN_BASE,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'tr-TR,tr;q=0.9'
        }
      });
      if (!response.ok) {
        this.logger.warn(`e-Plan fetch failed: ${response.status} for ${url}`);
        return null;
      }
      return await response.text();
    } catch (err) {
      this.logger.error(`e-Plan fetch error: ${err}`);
      return null;
    }
  }

  private async logChange(
    eplanPlanId: string,
    changeType: string,
    previousValue: unknown,
    newValue: unknown
  ): Promise<void> {
    await this.db.query(
      `insert into plan_changes_log (eplan_plan_id, change_type, previous_value, new_value)
       values ($1, $2, $3, $4)`,
      [eplanPlanId, changeType, previousValue ? JSON.stringify(previousValue) : null, JSON.stringify(newValue)]
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
