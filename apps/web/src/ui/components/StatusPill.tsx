interface StatusPillProps {
  label: string;
  tone?: 'ok' | 'warn' | 'error' | 'neutral';
}

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return <span className={`status-pill ${tone}`}>{label}</span>;
}
