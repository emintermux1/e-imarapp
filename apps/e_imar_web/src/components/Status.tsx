import type { ApiFailure, BackendStatus, StatusEnvelope } from '../api/types';

const criticalStates = new Set<BackendStatus>([
  'not_ready',
  'empty',
  'requires_credentials',
  'requires_legal_agreement',
  'unavailable',
  'captcha_required',
  'rate_limited',
  'requires_geocoder',
  'requires_data',
  'provider_error',
  'network_error'
]);

export function statusTone(status?: BackendStatus): 'good' | 'warn' | 'bad' | 'neutral' {
  if (status === 'ok') return 'good';
  if (status === 'unavailable' || status === 'provider_error' || status === 'network_error') return 'bad';
  if (status && criticalStates.has(status)) return 'warn';
  return 'neutral';
}

export function issueMessage(input?: StatusEnvelope | ApiFailure | null): string | null {
  if (!input) return null;
  if ('message' in input && typeof input.message === 'string') return input.message;
  const issue = 'issue' in input ? input.issue : undefined;
  if (typeof issue === 'string') return issue;
  if (issue && typeof issue.message === 'string') return issue.message;
  return null;
}

export function StatusBadge({ status }: { status?: BackendStatus }) {
  return <span className={`status-badge ${statusTone(status)}`}>{status || 'unknown'}</span>;
}

export function StateCard({
  title,
  state,
  compact = false,
  children
}: {
  title: string;
  state?: StatusEnvelope | ApiFailure | null;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const status = state?.status;
  const message = issueMessage(state);
  const nextActions = state && 'nextActions' in state && Array.isArray(state.nextActions) ? state.nextActions : [];
  return (
    <section className={`state-card ${statusTone(status)} ${compact ? 'compact' : ''}`}>
      <div className="state-card-head">
        <span>{title}</span>
        <StatusBadge status={status} />
      </div>
      {message ? <p>{message}</p> : null}
      {nextActions.length > 0 ? (
        <ul>
          {nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </section>
  );
}

export function DataList({ title, items }: { title: string; items?: Record<string, unknown>[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="empty-list">
        <span>{title}</span>
        <p>Kayıt yok. Backend boş durum döndürdüyse sonuç üretilmedi.</p>
      </div>
    );
  }
  return (
    <div className="data-list">
      <h4>{title}</h4>
      {items.map((item, index) => (
        <pre key={String(item.id ?? index)}>{JSON.stringify(item, null, 2)}</pre>
      ))}
    </div>
  );
}
