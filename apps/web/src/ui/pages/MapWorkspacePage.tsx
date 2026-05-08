import { useLocation, useNavigate } from 'react-router-dom';
import type { ParcelWorkflowResponse } from '../../types/contracts';
import { StatusPill } from '../components/StatusPill';

interface LocationState {
  result?: ParcelWorkflowResponse;
  query?: Record<string, string>;
}

export function MapWorkspacePage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const result = state?.result;
  const parcelCount = result?.parcelQuery?.count ?? 0;
  const selectedParcel = result?.parcelQuery?.parcels?.[0];
  const summary = result?.potentialSummary?.summary;
  const emsalOutput = result?.emsalShare?.output;

  return (
    <section className="workspace-layout">
      <aside className="left-panel">
        <h2>Parsel Arama</h2>
        <p className="hint">Arama kriteri: {state?.query?.ada ?? '-'} / {state?.query?.parselNo ?? '-'}</p>
        <div className="panel-group">
          <button className="secondary">Haritadan Seç</button>
          <button className="secondary">Katmanları Aç</button>
          <button className="secondary">Haritayı Temizle</button>
        </div>
        <StatusPill label={`Workflow: ${result?.status ?? 'idle'}`} tone={result?.status === 'ok' ? 'ok' : 'warn'} />
      </aside>

      <div className="map-canvas">
        <div className="map-overlay-top">
          <StatusPill label={`Parsel: ${parcelCount}`} tone={parcelCount > 0 ? 'ok' : 'neutral'} />
          <StatusPill label="Stil: Streets" tone="neutral" />
        </div>
        <div className="map-placeholder-grid">
          <span>MAP WORKSPACE</span>
          <small>Frontend mock değil; backend response burada render ediliyor.</small>
        </div>
      </div>

      <aside className="right-panel">
        <h2>Parsel Detayı</h2>
        <p className="hint">ID: {String(selectedParcel?.id ?? '-')}</p>
        <dl className="detail-list">
          <div><dt>Zoning</dt><dd>{String(selectedParcel?.zoning_function ?? '-')}</dd></div>
          <div><dt>Emsal</dt><dd>{String(selectedParcel?.emsal ?? '-')}</dd></div>
          <div><dt>TAKS</dt><dd>{String(selectedParcel?.taks ?? '-')}</dd></div>
          <div><dt>Plan</dt><dd>{String(selectedParcel?.plan_title ?? '-')}</dd></div>
        </dl>

        <h3>AI Özet</h3>
        <dl className="detail-list">
          <div><dt>Bina tipi</dt><dd>{summary?.maxBuildingType ?? '-'}</dd></div>
          <div><dt>Kat</dt><dd>{String(summary?.estimatedFloors ?? '-')}</dd></div>
          <div><dt>Bağımsız Bölüm</dt><dd>{String(summary?.estimatedIndependentUnits ?? '-')}</dd></div>
          <div><dt>Risk skoru</dt><dd>{String(summary?.riskScore ?? '-')}</dd></div>
        </dl>

        <h3>Emsal Çıktısı</h3>
        <dl className="detail-list">
          <div><dt>Toplam inşaat</dt><dd>{String(emsalOutput?.totalConstructionAreaM2 ?? '-')}</dd></div>
          <div><dt>Net satılabilir</dt><dd>{String(emsalOutput?.netSellableAreaM2 ?? '-')}</dd></div>
          <div><dt>Ünite</dt><dd>{String(emsalOutput?.estimatedIndependentUnits ?? '-')}</dd></div>
        </dl>
        <button onClick={() => navigate('/plan-explain')} className="primary">Plan Notunu Açıkla</button>
      </aside>
    </section>
  );
}
