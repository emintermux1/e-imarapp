import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../lib/api';

export function PlanExplainPage() {
  const [noteText, setNoteText] = useState('Emsal 1.50, TAKS 0.40, max yükseklik 15.50m, ön bahçe çekme 5m.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.explainPlanNotes<Record<string, unknown>>({
        userReference: 'web-demo-user',
        noteText,
        audience: 'citizen'
      });
      setResult(response);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Açıklama isteği başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="explain-page">
      <h1>İmar Notu Çevirici</h1>
      <p className="subtitle">Plan notunu sade Türkçe’ye çevirir; risk ve belirsizlikleri listeler.</p>
      <form onSubmit={onSubmit} className="explain-form">
        <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={8} />
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Açıklanıyor...' : 'Açıkla'}
        </button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
      <pre className="result-card">{JSON.stringify(result, null, 2)}</pre>
    </section>
  );
}
