# Map Workspace Component Props Contract

This file defines frontend component props/interfaces for implementation of the map workspace.

The backend source of truth remains:
- `GET /website/bootstrap`
- `POST /website/bff/parcel-workflow`
- `GET /website/workspace/:userReference`

## 1) Global workspace shell props

```ts
type WorkspaceShellProps = {
  userReference?: string;
  themeMode: 'light' | 'dark' | 'system';
  initialView?: {
    center: [number, number];
    zoom: number;
    bearing?: number;
    pitch?: number;
  };
  featureFlags: {
    parcelWorkflow: boolean;
    planNoteExplain: boolean;
    watchlistNotifications: boolean;
    emsalShareCalculator: boolean;
  };
  onSessionExpired: () => void;
};
```

## 2) Parcel search panel props

```ts
type ParcelSearchPanelProps = {
  loading: boolean;
  cityOptions: Array<{ id: string; name: string }>;
  districtOptions: Array<{ id: string; name: string }>;
  neighborhoodOptions: Array<{ id: string; name: string }>;
  defaultValues?: {
    city?: string;
    district?: string;
    neighborhood?: string;
    adaNo?: string;
    parcelNo?: string;
  };
  onSubmit: (payload: {
    city?: string;
    district?: string;
    neighborhood?: string;
    adaNo?: string;
    parcelNo?: string;
    longitude?: number;
    latitude?: number;
  }) => void;
  onClearMap: () => void;
  onUseCurrentLocation: () => void;
};
```

## 3) Layer catalog drawer props

```ts
type LayerCatalogItem = {
  id: string;
  label: string;
  category: string;
  enabled: boolean;
  opacity: number; // 0..1
  source: 'tucbs' | 'municipal' | 'eplan' | 'custom';
};

type LayerCatalogDrawerProps = {
  searchText: string;
  items: LayerCatalogItem[];
  loading: boolean;
  onSearchTextChange: (value: string) => void;
  onToggleLayer: (layerId: string, enabled: boolean) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onClose: () => void;
};
```

## 4) Map canvas props

```ts
type ParcelGeometry = GeoJSON.FeatureCollection | GeoJSON.Feature | null;

type MapCanvasProps = {
  loading: boolean;
  selectedParcelId?: string;
  parcelGeometry: ParcelGeometry;
  highlightGeometry?: GeoJSON.Feature | null;
  mapStyle: 'streets' | 'satellite' | 'terrain';
  visibleLayers: string[];
  parcelOpacity: number;
  planOpacity: number;
  onParcelClick: (parcelId: string) => void;
  onMapMoveEnd: (view: { center: [number, number]; zoom: number }) => void;
  onMapStyleChange: (style: 'streets' | 'satellite' | 'terrain') => void;
};
```

## 5) Parcel detail sheet props

```ts
type ParcelDetailSheetProps = {
  open: boolean;
  loading: boolean;
  parcel: {
    id: string;
    ada?: string;
    parselNo?: string;
    areaM2?: number;
    zoningFunction?: string;
    emsal?: number;
    taks?: number;
    kaks?: number;
    gabari?: string;
    planTitle?: string;
    sourceName?: string;
  } | null;
  potentialSummary?: {
    maxBuildingType?: string;
    estimatedFloors?: number | null;
    estimatedIndependentUnits?: number;
    estimatedParkingNeed?: number;
    recommendedUse?: string;
    riskScore?: number;
  } | null;
  onAnalyzeClick: () => void;
  onFavoriteClick: () => void;
  onReportClick: () => void;
  onClose: () => void;
};
```

## 6) Status and error props

```ts
type BackendReadinessState =
  | 'ok'
  | 'empty'
  | 'not_ready'
  | 'requires_credentials'
  | 'unavailable'
  | 'rate_limited'
  | 'unsupported_format';

type WorkspaceStatusBannerProps = {
  state: BackendReadinessState;
  title: string;
  message: string;
  nextActions?: string[];
};
```

## 7) Response adapter contract

Frontend must normalize `POST /website/bff/parcel-workflow` response into:

```ts
type ParcelWorkflowViewModel = {
  state: BackendReadinessState;
  parcels: Array<Record<string, unknown>>;
  selectedParcel: Record<string, unknown> | null;
  potentialSummary: Record<string, unknown> | null;
  emsalShare: Record<string, unknown> | null;
  sourceMeta?: {
    sourceId?: string;
    fetchedAt?: string;
  };
};
```

## 8) Forbidden frontend behavior

- do not compute fake zoning numbers client-side
- do not silently swallow backend readiness errors
- do not render stale persisted values as if they are fresh official results
