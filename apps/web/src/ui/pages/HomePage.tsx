import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { BootstrapResponse, ParcelWorkflowResponse } from '../../types/contracts';
import { StatusPill } from '../components/StatusPill';

export function HomePage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [ada, setAda] = useState('');
  const [parselNo, setParselNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);

  useEffect(() => {
    api.getBootstrap<BootstrapResponse>().then(setBootstrap).catch(() => null);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.parcelWorkflow<ParcelWorkflowResponse>({
        query: { type: 'ada_parsel', ada, parselNo, municipalityId: '' },
        userReference: 'web-demo-user'
      });
      navigate('/map-workspace', { state: { result, query: { city, district, neighborhood, ada, parselNo } } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sorgu başarısız oldu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="homepage">
      <div className="hero-card">
        <p className="eyebrow">RESMI VERI + ANALIZ</p>
        <h1>İmar Durumu Sorgula</h1>
        <p className="subtitle">TKGM, e-Plan ve belediye CBS kaynaklarıyla parselin durumunu tek akışta inceleyin.</p>
        <form className="query-grid" onSubmit={onSubmit}>
          <input placeholder="Şehir" value={city} onChange={(e) => setCity(e.target.value)} />
          <input placeholder="İlçe" value={district} onChange={(e) => setDistrict(e.target.value)} />
          <input placeholder="Mahalle" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          <input placeholder="Ada No" value={ada} onChange={(e) => setAda(e.target.value)} required />
          <input placeholder="Parsel No" value={parselNo} onChange={(e) => setParselNo(e.target.value)} required />
          <button type="submit" disabled={loading}>
            {loading ? 'SORGULANIYOR...' : 'İMAR DURUMU SORGULA'}
          </button>
        </form>
        {error ? <p className="error-text">{error}</p> : null}
      </div>

      <div className="value-row">
        <article className="value-card">
          <h3>Resmi Bilgiler</h3>
          <p>Plan, parsel ve katman verilerini resmi kaynak bağlantılarıyla sunar.</p>
        </article>
        <article className="value-card">
          <h3>Detaylı Analiz</h3>
          <p>Emsal, TAKS/KAKS, yapılaşma potansiyeli ve risk göstergeleri tek panelde.</p>
        </article>
        <article className="value-card">
          <h3>Yatırım Potansiyeli</h3>
          <p>“Bu arsaya ne yapılabilir?” özetini hızlı karar için üretir.</p>
        </article>
      </div>

      <div className="trust-strip">
        <StatusPill label={`Bootstrap: ${bootstrap?.status ?? 'loading'}`} tone={bootstrap?.status === 'ok' ? 'ok' : 'warn'} />
        <StatusPill
          label={`Tile: ${bootstrap?.map?.tileStatus?.status ?? 'unknown'}`}
          tone={bootstrap?.map?.tileStatus?.status === 'ok' ? 'ok' : 'neutral'}
        />
        <StatusPill
          label={`Provider: ${bootstrap?.map?.providers?.filter((provider) => provider.configured).length ?? 0} configured`}
          tone="neutral"
        />
      </div>
    </section>
  );
}
