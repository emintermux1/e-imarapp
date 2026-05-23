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
      <div className="split-head">
        <div>
          <h1>İmar Notu Çevirici</h1>
          <p className="subtitle">Plan notunu sade Türkçe’ye çevirir; risk ve belirsizlikleri listeler.</p>
        </div>
        <button className="secondary">Kaydet</button>
      </div>
      <div className="explain-grid">
        <form onSubmit={onSubmit} className="explain-form">
          <label>Ham Plan Notu</label>
          <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={12} />
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Açıklanıyor...' : 'Açıkla'}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
        <div className="result-panel">
          <h3>Açıklama Sonucu</h3>
          <pre className="result-card">{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
}
