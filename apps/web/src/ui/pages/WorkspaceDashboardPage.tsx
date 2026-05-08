import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../lib/api';

export function WorkspaceDashboardPage() {
  const [userReference, setUserReference] = useState('web-demo-user');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function onLoad(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const workspace = await api.getWorkspace<Record<string, unknown>>(userReference);
      setResult(workspace);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="dashboard-page">
      <h1>Workspace Dashboard</h1>
      <p className="subtitle">Geçmiş sorgular, favoriler ve abonelikler tek ekranda.</p>
      <form className="workspace-form" onSubmit={onLoad}>
        <input value={userReference} onChange={(event) => setUserReference(event.target.value)} />
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Workspace Yükle'}
        </button>
      </form>
      <pre className="result-card">{JSON.stringify(result, null, 2)}</pre>
    </section>
  );
}
