import { ASKI_POLYGONS } from "../apps/e_imar_web/src/data/aski-polygons";
import {
  DEFAULT_WATCHLIST_ALERT_INTENTS,
  PARSEL_ALARM_NAME,
  filterAskiRecords,
  findAskiMatchesForParcel,
  summarizeAskiProvenance
} from "../apps/e_imar_web/src/lib/aski-tracking";
import { useWatchlistStore } from "../apps/e_imar_web/src/stores/watchlist-store";

function installLocalStorageMock() {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear()
  } as Storage;

  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    configurable: true
  });
}

describe("askı tracking helpers", () => {
  test("filters by municipality, status and date range", () => {
    const records = filterAskiRecords(ASKI_POLYGONS, {
      municipality: "Beşiktaş Belediyesi",
      status: "askida",
      from: "2026-01-01",
      to: "2026-12-31"
    });

    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) => record.belediye.includes("Beşiktaş") && record.durum === "askida")).toBe(true);
  });

  test("finds parcel-linked askı records", () => {
    const matches = findAskiMatchesForParcel(ASKI_POLYGONS, "TR-34-BES-1234-2", "besiktas", "istanbul");
    expect(matches.some((record) => record.matchedParcelId === "TR-34-BES-1234-2")).toBe(true);
  });

  test("summarizes provenance honestly", () => {
    const summary = summarizeAskiProvenance(ASKI_POLYGONS);
    expect(summary.demo).toBeGreaterThan(0);
    expect(summary.official).toBe(0);
  });
});

describe("watchlist store", () => {
  beforeEach(() => {
    installLocalStorageMock();
    useWatchlistStore.getState().clear();
  });

  test("adds local-only entries with default alert intents", () => {
    useWatchlistStore.getState().add({
      id: "TR-34-BES-1234-2",
      ada: "1234",
      parsel: "2",
      il: "İstanbul",
      ilce: "Beşiktaş",
      mahalle: "Levent",
      zoningType: "Konut",
      yuzolcumuM2: 1200,
      centroid: [29.018, 41.0876],
      provenance: "demo"
    });

    const item = useWatchlistStore.getState().items[0];
    expect(item.trackingMode).toBe("local_only");
    expect(item.provenance).toBe("demo");
    expect(item.alertIntents).toEqual(DEFAULT_WATCHLIST_ALERT_INTENTS);
  });

  test("names the local watchlist surface as Parsel Alarm with all default alarm intents", () => {
    expect(PARSEL_ALARM_NAME).toBe("Parsel Alarm");
    expect(DEFAULT_WATCHLIST_ALERT_INTENTS).toEqual([
      "imar_change",
      "aski_plan",
      "cevre_plan",
      "source_access_status_change"
    ]);
  });

  test("toggles a configured alert intent", () => {
    useWatchlistStore.getState().add({
      id: "TR-34-BES-1234-2",
      ada: "1234",
      parsel: "2",
      il: "İstanbul",
      ilce: "Beşiktaş",
      mahalle: "Levent",
      zoningType: "Konut",
      yuzolcumuM2: 1200,
      centroid: [29.018, 41.0876],
      provenance: "demo"
    });

    useWatchlistStore.getState().toggleAlertIntent("TR-34-BES-1234-2", "aski_plan");
    expect(useWatchlistStore.getState().items[0].alertIntents).not.toContain("aski_plan");
  });
});
