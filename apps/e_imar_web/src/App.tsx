import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiBaseUrl, explainPlanNote, getBootstrap, getMapProviders, getWorkspace, runParcelWorkflow } from './api/client';
import type {
  ApiFailure,
  Audience,
  BootstrapResponse,
  MapProvider,
  ParcelQueryType,
  ParcelWorkflowPayload,
  ParcelWorkflowResponse,
  PlanNoteExplainResponse,
  WorkspaceResponse
} from './api/types';
import { DataList, StateCard, StatusBadge } from './components/Status';
import './styles.css';

type AsyncState<T> = { loading: boolean; data?: T; error?: ApiFailure };

const queryTypes: ParcelQueryType[] = ['ada_parsel', 'coordinate', 'address', 'geojson', 'kml'];
const audiences: Audience[] = ['citizen', 'architect', 'investor'];

function App() {
  const [userReference, setUserReference] = useState('');
  const [bootstrap, setBootstrap] = useState<AsyncState<BootstrapResponse>>({ loading: true });
  const [providers, setProviders] = useState<AsyncState<MapProvider[]>>({ loading: true });
  const [parcelResult, setParcelResult] = useState<AsyncState<ParcelWorkflowResponse>>({ loading: false });
  const [planResult, setPlanResult] = useState<AsyncState<PlanNoteExplainResponse>>({ loading: false });
  const [workspace, setWorkspace] = useState<AsyncState<WorkspaceResponse>>({ loading: false });

  useEffect(() => {
    void refreshBootstrap();
    void refreshProviders();
  }, []);

  async function refreshBootstrap(reference = userReference) {
    setBootstrap((current) => ({ ...current, loading: true, error: undefined }));
    const result = await getBootstrap(reference.trim() || undefined);
    setBootstrap(result.ok ? { loading: false, data: result.data } : { loading: false, error: result.error });
  }

  async function refreshProviders() {
    setProviders((current) => ({ ...current, loading: true, error: undefined }));
    const result = await getMapProviders();
    setProviders(result.ok ? { loading: false, data: result.data } : { loading: false, error: result.error });
  }

  async function loadWorkspace(reference = userReference) {
    const normalized = reference.trim();
    if (!normalized) return;
    setWorkspace({ loading: true });
    const result = await getWorkspace(normalized);
    setWorkspace(result.ok ? { loading: false, data: result.data } : { loading: false, error: result.error });
  }

  const providerList = bootstrap.data?.map?.providers?.length ? bootstrap.data.map.providers : providers.data ?? [];
  const readyProviders = providerList.filter((provider) => provider.configured).length;

  return (
    <main>
      <section className="hero-panel" id="home">
        <div className="brand-mark">E-İMAR / GIS COMMAND</div>
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Türkiye zoning intelligence, backend sourced</p>
            <h1>Parsel, plan notu ve çalışma alanı için sahte veri üretmeyen web arayüzü.</h1>
            <p className="hero-copy">
              E-İmar web v1 canlı backend/BFF durumlarını okur, harita sağlayıcı hazırlığını gösterir ve veri yoksa bunu karar çıktısı gibi sunmaz.
            </p>
            <div className="hero-actions">
              <a href="#workspace" className="primary-link">Harita çalışma alanı</a>
              <a href="#plan-note" className="secondary-link">Plan notu açıkla</a>
            </div>
          </div>
          <div className="readiness-stack">
            {bootstrap.loading ? <div className="skeleton-card">Bootstrap yükleniyor</div> : null}
            {bootstrap.error ? <StateCard title="API bağlantısı" state={bootstrap.error} /> : null}
            {bootstrap.data ? (
              <>
                <StateCard title="Website bootstrap" state={bootstrap.data} compact>
                  <dl className="mini-metrics">
                    <div><dt>API</dt><dd>{apiBaseUrl}</dd></div>
                    <div><dt>Ürün</dt><dd>{bootstrap.data.product?.name || 'backend response bekleniyor'}</dd></div>
                    <div><dt>Harita sağlayıcı</dt><dd>{readyProviders}/{providerList.length} configured</dd></div>
                  </dl>
                </StateCard>
                {bootstrap.data.map?.tileStatus ? <StateCard title="Vector tile readiness" state={bootstrap.data.map.tileStatus} compact /> : null}
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="workspace-shell" id="workspace">
        <ParcelSearchPanel
          userReference={userReference}
          setUserReference={setUserReference}
          loading={parcelResult.loading}
          onSubmit={async (payload) => {
            setParcelResult({ loading: true });
            const result = await runParcelWorkflow(payload);
            setParcelResult(result.ok ? { loading: false, data: result.data } : { loading: false, error: result.error });
            if (payload.userReference) void refreshBootstrap(payload.userReference);
          }}
        />
        <MapCanvas providers={providerList} tileStatus={bootstrap.data?.map?.tileStatus} />
        <ResultPanel result={parcelResult} providers={providerList} />
      </section>

      <section className="two-column-section">
        <PlanNotePanel
          userReference={userReference}
          loading={planResult.loading}
          result={planResult}
          onSubmit={async (payload) => {
            setPlanResult({ loading: true });
            const result = await explainPlanNote(payload);
            setPlanResult(result.ok ? { loading: false, data: result.data } : { loading: false, error: result.error });
          }}
        />
        <WorkspacePanel
          userReference={userReference}
          setUserReference={setUserReference}
          workspace={workspace}
          bootstrapWorkspace={bootstrap.data?.workspace ?? undefined}
          onLoad={loadWorkspace}
        />
      </section>
    </main>
  );
}

function ParcelSearchPanel({
  userReference,
  setUserReference,
  loading,
  onSubmit
}: {
  userReference: string;
  setUserReference: (value: string) => void;
  loading: boolean;
  onSubmit: (payload: ParcelWorkflowPayload) => Promise<void>;
}) {
  const [type, setType] = useState<ParcelQueryType>('ada_parsel');
  const [ada, setAda] = useState('');
  const [parselNo, setParselNo] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [address, setAddress] = useState('');
  const [rawGeometry, setRawGeometry] = useState('');
  const [kml, setKml] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setGeoJsonError(null);
    const query: ParcelWorkflowPayload['query'] = { type };
    if (municipalityId.trim()) query.municipalityId = municipalityId.trim();
    if (type === 'ada_parsel') {
      if (ada.trim()) query.ada = ada.trim();
      if (parselNo.trim()) query.parselNo = parselNo.trim();
    }
    if (type === 'coordinate') {
      if (longitude.trim()) query.longitude = Number(longitude);
      if (latitude.trim()) query.latitude = Number(latitude);
      query.srid = 4326;
    }
    if (type === 'address') query.address = address.trim();
    if (type === 'geojson') {
      try {
        query.geometry = rawGeometry.trim() ? JSON.parse(rawGeometry) as Record<string, unknown> : undefined;
      } catch {
        setGeoJsonError('GeoJSON geçerli JSON olmalı. Backend çağrısı yapılmadı.');
        return;
      }
    }
    if (type === 'kml') query.kml = kml;
    await onSubmit({ userReference: userReference.trim() || undefined, query });
  }

  return (
    <aside className="panel left-panel">
      <div className="panel-title">
        <span>Parsel arama</span>
        <small>BFF workflow</small>
      </div>
      <form onSubmit={submit} className="stack-form">
        <label>User reference<input value={userReference} onChange={(event) => setUserReference(event.target.value)} placeholder="opsiyonel" /></label>
        <label>Sorgu tipi<select value={type} onChange={(event) => setType(event.target.value as ParcelQueryType)}>{queryTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        {type === 'ada_parsel' ? <div className="field-row"><label>Ada<input value={ada} onChange={(event) => setAda(event.target.value)} /></label><label>Parsel No<input value={parselNo} onChange={(event) => setParselNo(event.target.value)} /></label></div> : null}
        {type === 'coordinate' ? <div className="field-row"><label>Longitude<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" /></label><label>Latitude<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" /></label></div> : null}
        {type === 'address' ? <label>Adres<input value={address} onChange={(event) => setAddress(event.target.value)} /></label> : null}
        {type === 'geojson' ? <label>GeoJSON geometry<textarea value={rawGeometry} onChange={(event) => setRawGeometry(event.target.value)} placeholder='{"type":"Point","coordinates":[...]}' /></label> : null}
        {type === 'kml' ? <label>KML<textarea value={kml} onChange={(event) => setKml(event.target.value)} /></label> : null}
        <label>Municipality ID<input value={municipalityId} onChange={(event) => setMunicipalityId(event.target.value)} placeholder="opsiyonel UUID" /></label>
        {geoJsonError ? <p className="form-error">{geoJsonError}</p> : null}
        <button disabled={loading}>{loading ? 'Sorgulanıyor' : 'Backend workflow çalıştır'}</button>
      </form>
      <div className="trust-note">Sonuç yoksa connector sync / veri ingest gerekliliği backend durumuyla gösterilir.</div>
    </aside>
  );
}

function MapCanvas({ providers, tileStatus }: { providers: MapProvider[]; tileStatus?: { status?: string; issue?: unknown } }) {
  return (
    <section className="map-canvas" aria-label="Live map workspace placeholder">
      <div className="map-grid-lines" />
      <div className="map-topbar">
        <span>Live map area</span>
        <StatusBadge status={tileStatus?.status} />
      </div>
      <div className="map-center-card">
        <strong>Harita sağlayıcı / tile yapılandırması bekleniyor</strong>
        <p>Bu alan sahte parsel çizmez. Provider ve PostGIS tile servisi hazır olduğunda gerçek katmanlar burada render edilecek.</p>
      </div>
      <div className="layer-dock">
        <h3>Layer catalog</h3>
        {providers.length === 0 ? <p>Provider listesi backend yanıtı bekliyor.</p> : null}
        {providers.map((provider) => (
          <label key={provider.id} className="layer-row">
            <input type="checkbox" disabled={!provider.configured} />
            <span>{provider.name}</span>
            <StatusBadge status={provider.configured ? 'ok' : 'requires_credentials'} />
          </label>
        ))}
      </div>
    </section>
  );
}

function ResultPanel({ result, providers }: { result: AsyncState<ParcelWorkflowResponse>; providers: MapProvider[] }) {
  const parcelQuery = result.data?.parcelQuery;
  return (
    <aside className="panel right-panel">
      <div className="panel-title"><span>Parsel / analiz bağlamı</span><small>real response only</small></div>
      {result.loading ? <div className="skeleton-card">Workflow yanıtı bekleniyor</div> : null}
      {result.error ? <StateCard title="Parcel workflow connectivity" state={result.error} /> : null}
      {result.data ? (
        <div className="result-stack">
          <StateCard title="Workflow" state={result.data} compact />
          {parcelQuery ? <StateCard title="Parcel query" state={parcelQuery} compact /> : null}
          {parcelQuery?.parcels?.length ? <DataList title="Backend parcels" items={parcelQuery.parcels} /> : <div className="empty-list"><span>Seçili parsel yok</span><p>Backend parsel döndürmeden ada/parsel, imar veya belediye verisi gösterilmez.</p></div>}
          {result.data.potentialSummary ? <StateCard title="Potential summary" state={result.data.potentialSummary} compact><pre>{JSON.stringify(result.data.potentialSummary.summary ?? result.data.potentialSummary, null, 2)}</pre></StateCard> : null}
          {result.data.emsalShare ? <StateCard title="Emsal share" state={result.data.emsalShare} compact><pre>{JSON.stringify(result.data.emsalShare, null, 2)}</pre></StateCard> : null}
        </div>
      ) : null}
      <div className="provider-mini">
        <h4>Provider readiness</h4>
        {providers.map((provider) => <span key={provider.id}>{provider.id}: {provider.envStatus || (provider.configured ? 'configured' : 'missing')}</span>)}
      </div>
    </aside>
  );
}

function PlanNotePanel({
  userReference,
  loading,
  result,
  onSubmit
}: {
  userReference: string;
  loading: boolean;
  result: AsyncState<PlanNoteExplainResponse>;
  onSubmit: (payload: { userReference?: string; noteText: string; audience: Audience; maxBullets: number }) => Promise<void>;
}) {
  const [noteText, setNoteText] = useState('');
  const [audience, setAudience] = useState<Audience>('citizen');
  const [maxBullets, setMaxBullets] = useState(6);
  const explanation = result.data?.explanation;
  const structured = typeof explanation === 'object' && explanation !== null ? explanation : undefined;

  return (
    <section className="panel feature-panel" id="plan-note">
      <div className="panel-title"><span>Plan notu açıklama</span><small>OpenAI readiness propagated</small></div>
      <form className="stack-form" onSubmit={(event) => { event.preventDefault(); void onSubmit({ userReference: userReference.trim() || undefined, noteText, audience, maxBullets }); }}>
        <label>Hedef kitle<select value={audience} onChange={(event) => setAudience(event.target.value as Audience)}>{audiences.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Maksimum madde<input type="number" min="4" max="12" value={maxBullets} onChange={(event) => setMaxBullets(Number(event.target.value))} /></label>
        <label>Gerçek plan notu metni<textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={8} placeholder="Plan notunu buraya yapıştırın" /></label>
        <button disabled={loading || !noteText.trim()}>{loading ? 'Açıklanıyor' : 'Plan notunu açıkla'}</button>
      </form>
      {result.error ? <StateCard title="Plan note connectivity" state={result.error} /> : null}
      {result.data ? <StateCard title="Plan note response" state={result.data} compact /> : null}
      {typeof explanation === 'string' ? <p className="explanation-text">{explanation}</p> : null}
      {structured ? <ExplanationBlock explanation={structured} /> : null}
    </section>
  );
}

function ExplanationBlock({ explanation }: { explanation: Record<string, unknown> }) {
  const bullets = Array.isArray(explanation.bullets) ? explanation.bullets : [];
  const risks = Array.isArray(explanation.risks) ? explanation.risks : [];
  const uncertainties = Array.isArray(explanation.uncertainties) ? explanation.uncertainties : [];
  return (
    <div className="explanation-block">
      {typeof explanation.plainSummary === 'string' ? <p className="plain-summary">{explanation.plainSummary}</p> : null}
      <ListBlock title="Öne çıkanlar" items={bullets} />
      <ListBlock title="Riskler" items={risks} />
      <ListBlock title="Belirsizlikler" items={uncertainties} />
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: unknown[] }) {
  if (items.length === 0) return null;
  return <div><h4>{title}</h4><ul>{items.map((item, index) => <li key={index}>{String(item)}</li>)}</ul></div>;
}

function WorkspacePanel({
  userReference,
  setUserReference,
  workspace,
  bootstrapWorkspace,
  onLoad
}: {
  userReference: string;
  setUserReference: (value: string) => void;
  workspace: AsyncState<WorkspaceResponse>;
  bootstrapWorkspace?: WorkspaceResponse;
  onLoad: (reference?: string) => Promise<void>;
}) {
  const activeWorkspace = workspace.data ?? bootstrapWorkspace;
  const sections = useMemo(() => [
    { key: 'history', title: 'History', state: activeWorkspace?.history, items: activeWorkspace?.history?.history },
    { key: 'favorites', title: 'Favorites', state: activeWorkspace?.favorites, items: activeWorkspace?.favorites?.favorites },
    { key: 'subscriptions', title: 'Subscriptions', state: activeWorkspace?.subscriptions, items: activeWorkspace?.subscriptions?.subscriptions }
  ], [activeWorkspace]);

  return (
    <section className="panel feature-panel" id="user-workspace">
      <div className="panel-title"><span>User workspace</span><small>history / favorites / subscriptions</small></div>
      <form className="workspace-form" onSubmit={(event) => { event.preventDefault(); void onLoad(); }}>
        <input value={userReference} onChange={(event) => setUserReference(event.target.value)} placeholder="userReference" />
        <button disabled={workspace.loading || !userReference.trim()}>{workspace.loading ? 'Yükleniyor' : 'Workspace getir'}</button>
      </form>
      {workspace.error ? <StateCard title="Workspace connectivity" state={workspace.error} /> : null}
      {activeWorkspace ? <div className="workspace-grid">{sections.map((section) => <div key={section.key}>{section.state?.status ? <StateCard title={section.title} state={section.state} compact /> : null}<DataList title={section.title} items={section.items} /></div>)}</div> : <div className="empty-list"><span>Workspace bekliyor</span><p>User reference girildiğinde backend yanıtı gösterilir. DB hazır değilse durum aynen render edilir.</p></div>}
    </section>
  );
}

export default App;
