from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import urljoin, urlparse


@dataclass(frozen=True)
class SourceRecord:
    id: str
    name: str
    kind: str
    province: Optional[str]
    district: Optional[str]
    slug: str
    homepage_url: str
    base_url: str
    candidate_endpoints: List[str] = field(default_factory=list)
    notes: str = ""
    requires_approval: bool = False
    requires_credentials: bool = False
    center: Optional[List[float]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def normalize_url(url: str, base: Optional[str] = None) -> str:
    url = (url or "").strip().strip('"\'')
    if not url:
        return url
    if url.startswith("//"):
        return "https:" + url
    if base and not urlparse(url).scheme:
        return urljoin(base, url)
    return url


def dedupe_urls(urls: Iterable[str]) -> List[str]:
    seen = set()
    out: List[str] = []
    for url in urls:
        normalized = normalize_url(url)
        if not normalized:
            continue
        key = normalized.rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        out.append(normalized)
    return out


COMMON_KEOS_ENDPOINTS = [
    "/NetGIS/Services/MapService.ashx",
    "/NetGIS/Services/QueryService.ashx",
    "/NetGIS/Services/GeometryService.ashx",
    "/imardurumu/Services/MapService.ashx",
    "/imardurumu/Services/QueryService.ashx",
    "/imardurumu/Services/GeometryService.ashx",
    "/imardurumu/Services/ImarDurumu.asmx",
    "/imardurumu/Services/ImarDurumu.ashx",
    "/geoserver/ows?service=WMS&request=GetCapabilities",
    "/geoserver/ows?service=WFS&request=GetCapabilities",
    "/arcgis/rest/services?f=pjson",
]


def _endpoints(base_url: str) -> List[str]:
    root = base_url.rstrip("/") + "/"
    return dedupe_urls(urljoin(root, endpoint.lstrip("/")) for endpoint in COMMON_KEOS_ENDPOINTS)


def _m(id: str, name: str, kind: str, province: str, district: Optional[str], slug: str, homepage: str, base: str, center: List[float]) -> SourceRecord:
    return SourceRecord(id, name, kind, province, district, slug, homepage, base, _endpoints(base), center=center)


TURKEY_PROVINCES: list[tuple[str, str, str]] = [
    ("01", "adana", "Adana"), ("02", "adiyaman", "Adıyaman"), ("03", "afyonkarahisar", "Afyonkarahisar"),
    ("04", "agri", "Ağrı"), ("05", "amasya", "Amasya"), ("06", "ankara", "Ankara"), ("07", "antalya", "Antalya"),
    ("08", "artvin", "Artvin"), ("09", "aydin", "Aydın"), ("10", "balikesir", "Balıkesir"), ("11", "bilecik", "Bilecik"),
    ("12", "bingol", "Bingöl"), ("13", "bitlis", "Bitlis"), ("14", "bolu", "Bolu"), ("15", "burdur", "Burdur"),
    ("16", "bursa", "Bursa"), ("17", "canakkale", "Çanakkale"), ("18", "cankiri", "Çankırı"), ("19", "corum", "Çorum"),
    ("20", "denizli", "Denizli"), ("21", "diyarbakir", "Diyarbakır"), ("22", "edirne", "Edirne"), ("23", "elazig", "Elazığ"),
    ("24", "erzincan", "Erzincan"), ("25", "erzurum", "Erzurum"), ("26", "eskisehir", "Eskişehir"), ("27", "gaziantep", "Gaziantep"),
    ("28", "giresun", "Giresun"), ("29", "gumushane", "Gümüşhane"), ("30", "hakkari", "Hakkari"), ("31", "hatay", "Hatay"),
    ("32", "isparta", "Isparta"), ("33", "mersin", "Mersin"), ("34", "istanbul", "İstanbul"), ("35", "izmir", "İzmir"),
    ("36", "kars", "Kars"), ("37", "kastamonu", "Kastamonu"), ("38", "kayseri", "Kayseri"), ("39", "kirklareli", "Kırklareli"),
    ("40", "kirsehir", "Kırşehir"), ("41", "kocaeli", "Kocaeli"), ("42", "konya", "Konya"), ("43", "kutahya", "Kütahya"),
    ("44", "malatya", "Malatya"), ("45", "manisa", "Manisa"), ("46", "kahramanmaras", "Kahramanmaraş"), ("47", "mardin", "Mardin"),
    ("48", "mugla", "Muğla"), ("49", "mus", "Muş"), ("50", "nevsehir", "Nevşehir"), ("51", "nigde", "Niğde"),
    ("52", "ordu", "Ordu"), ("53", "rize", "Rize"), ("54", "sakarya", "Sakarya"), ("55", "samsun", "Samsun"),
    ("56", "siirt", "Siirt"), ("57", "sinop", "Sinop"), ("58", "sivas", "Sivas"), ("59", "tekirdag", "Tekirdağ"),
    ("60", "tokat", "Tokat"), ("61", "trabzon", "Trabzon"), ("62", "tunceli", "Tunceli"), ("63", "sanliurfa", "Şanlıurfa"),
    ("64", "usak", "Uşak"), ("65", "van", "Van"), ("66", "yozgat", "Yozgat"), ("67", "zonguldak", "Zonguldak"),
    ("68", "aksaray", "Aksaray"), ("69", "bayburt", "Bayburt"), ("70", "karaman", "Karaman"), ("71", "kirikkale", "Kırıkkale"),
    ("72", "batman", "Batman"), ("73", "sirnak", "Şırnak"), ("74", "bartin", "Bartın"), ("75", "ardahan", "Ardahan"),
    ("76", "igdir", "Iğdır"), ("77", "yalova", "Yalova"), ("78", "karabuk", "Karabük"), ("79", "kilis", "Kilis"),
    ("80", "osmaniye", "Osmaniye"), ("81", "duzce", "Düzce"),
]


def _generated_turkey_province_sources() -> list[SourceRecord]:
    rows: list[SourceRecord] = []
    vendors = ['netcad', 'webgis', 'netcad', 'webgis', 'municipal']
    for idx, (_, slug, name) in enumerate(TURKEY_PROVINCES):
        vendor = vendors[idx % len(vendors)]
        if vendor == 'netcad':
            kind = 'municipal_keos'
            homepage = f'https://keos.{slug}.bel.tr/imardurumu/'
        elif vendor == 'webgis':
            kind = 'municipal_webgis'
            homepage = f'https://webgis.{slug}.bel.tr/imardurumu/'
        else:
            kind = 'municipal_webgis'
            homepage = f'https://cbs.{slug}.bel.tr/'
        rows.append(SourceRecord(
            id=f'prov.{slug}.coverage',
            name=f'{name} Belediye İmar Adayı',
            kind=kind,
            province=name,
            district=name,
            slug=slug,
            homepage_url=homepage,
            base_url=homepage.rstrip('/'),
            candidate_endpoints=_endpoints(homepage.rstrip('/')),
            notes=f'{name} için metadata_only aday kayıt; canlı endpoint ve izin durumu doğrulanmadı.',
        ))
    return rows


SOURCE_REGISTRY: List[SourceRecord] = [
    _m("pendik-keos-imar", "Pendik KEOS İmar Durumu", "municipal_keos", "İstanbul", "Pendik", "pendik", "https://keos.pendik.bel.tr/imardurumu/", "https://keos.pendik.bel.tr", [29.258, 40.877]),
    _m("esenler-keos-imar", "Esenler KEOS İmar Durumu", "municipal_keos", "İstanbul", "Esenler", "esenler", "https://keos.esenler.bel.tr/imardurumu/index.aspx", "https://keos.esenler.bel.tr", [28.876, 41.040]),
    _m("canakkale-webgis-imar", "Çanakkale WebGIS İmar Durumu", "municipal_webgis", "Çanakkale", "Merkez", "canakkale", "https://webgis.canakkale.bel.tr/imardurumu/index.aspx", "https://webgis.canakkale.bel.tr", [26.408, 40.146]),
    _m("pamukkale-keos-imar", "Pamukkale KEOS İmar Durumu", "municipal_keos", "Denizli", "Pamukkale", "pamukkale", "http://keos.pamukkale.bel.tr/imardurumu/index.aspx", "http://keos.pamukkale.bel.tr", [29.086, 37.916]),
    _m("cerkezkoy-webgis-imar", "Çerkezköy WebGIS İmar Durumu", "municipal_webgis", "Tekirdağ", "Çerkezköy", "cerkezkoy", "https://webgis.cerkezkoy.bel.tr:444/imardurumu/", "https://webgis.cerkezkoy.bel.tr:444", [27.999, 41.286]),
    _m("kahramankazan-keos-imar", "Kahramankazan KEOS İmar Durumu", "municipal_keos", "Ankara", "Kahramankazan", "kahramankazan", "https://keos.kahramankazan.bel.tr:8880/imardurumu/", "https://keos.kahramankazan.bel.tr:8880", [32.684, 40.205]),
    _m("alanya-keos-imar", "Alanya KEOS İmar Durumu", "municipal_keos", "Antalya", "Alanya", "alanya", "https://keos.alanya.bel.tr/imardurumu/index.aspx", "https://keos.alanya.bel.tr", [32.000, 36.544]),
    _m("konak-keos-imar", "Konak KEOS İmar Durumu", "municipal_keos", "İzmir", "Konak", "konak", "https://keos.konak.bel.tr/imardurumu/", "https://keos.konak.bel.tr", [27.128, 38.419]),
    _m("merkezefendi-keos-imar", "Merkezefendi KEOS İmar Durumu", "municipal_keos", "Denizli", "Merkezefendi", "merkezefendi", "https://keos.merkezefendi.bel.tr/imardurumu/index.aspx", "https://keos.merkezefendi.bel.tr", [29.070, 37.774]),
    _m("altinordu-ekent-imar", "Altınordu Ekent İmar Durumu", "municipal_webgis", "Ordu", "Altınordu", "altinordu", "https://ekent.altinordu.bel.tr/imardurumu/", "https://ekent.altinordu.bel.tr", [37.879, 40.984]),
    _m("aksaray-ebelediye-imar", "Aksaray E-Belediye İmar Durumu", "municipal_webgis", "Aksaray", "Merkez", "aksaray", "https://ebelediye.aksaray.bel.tr:444/imardurumu/", "https://ebelediye.aksaray.bel.tr:444", [34.025, 38.368]),
    _m("sehitkamil-keos-imar", "Şehitkamil KEOS İmar Durumu", "municipal_keos", "Gaziantep", "Şehitkamil", "sehitkamil", "https://keos.sehitkamil.bel.tr/imardurumu/", "https://keos.sehitkamil.bel.tr", [37.383, 37.075]),
    _m("ibb-sehir-haritasi", "İBB Şehir Haritası", "municipal_webgis", "İstanbul", None, "ibb", "https://sehirharitasi.ibb.gov.tr/", "https://sehirharitasi.ibb.gov.tr", [28.978, 41.008]),
    _m("ankara-imar", "Ankara İmar", "municipal_webgis", "Ankara", None, "ankara", "https://imar.ankara.bel.tr/", "https://imar.ankara.bel.tr", [32.854, 39.920]),
    _m("izmir-cbs", "İzmir CBS", "municipal_webgis", "İzmir", None, "izmir", "https://cbs.izmir.bel.tr/", "https://cbs.izmir.bel.tr", [27.142, 38.423]),
    _m("cankaya-imar", "Çankaya İmar Durumu", "municipal_webgis", "Ankara", "Çankaya", "cankaya", "https://imardurumu.cankaya.bel.tr/", "https://imardurumu.cankaya.bel.tr", [32.859, 39.917]),
    _m("sultangazi-webgis-imar", "Sultangazi WebGIS İmar Durumu", "municipal_webgis", "İstanbul", "Sultangazi", "sultangazi", "https://webgis.sultangazi.bel.tr/imardurumu/", "https://webgis.sultangazi.bel.tr", [28.871, 41.107]),
    _m("basaksehir-webgis-imar", "Başakşehir WebGIS İmar Durumu", "municipal_webgis", "İstanbul", "Başakşehir", "basaksehir", "https://webgis.basaksehir.bel.tr/imardurumu/", "https://webgis.basaksehir.bel.tr", [28.807, 41.097]),
    _m("tusba-keos-imar", "Tuşba KEOS İmar Durumu", "municipal_keos", "Van", "Tuşba", "tusba", "https://keos.tusba.bel.tr:8282/imardurumu/index.aspx", "https://keos.tusba.bel.tr:8282", [43.363, 38.514]),
    _m("suleymanpasa-keos-imar", "Süleymanpaşa KEOS İmar Durumu", "municipal_keos", "Tekirdağ", "Süleymanpaşa", "suleymanpasa", "https://keos.suleymanpasa.bel.tr:8080/imardurumu/index.aspx", "https://keos.suleymanpasa.bel.tr:8080", [27.512, 40.979]),
    _m("mustafakemalpasa-keos-imar", "Mustafa Kemal Paşa KEOS İmar Durumu", "municipal_keos", "Bursa", "Mustafa Kemal Paşa", "mustafakemalpasa", "http://keos.mustafakemalpasa.bel.tr/imardurumu/index.aspx", "http://keos.mustafakemalpasa.bel.tr", [28.410, 40.038]),
    _m("kecioren-kbs", "Keçiören KBS", "municipal_webgis", "Ankara", "Keçiören", "kecioren", "https://kbs.kecioren.bel.tr/", "https://kbs.kecioren.bel.tr", [32.866, 40.000]),
    _m("gelibolu-keos-imar", "Gelibolu KEOS İmar Durumu", "municipal_keos", "Çanakkale", "Gelibolu", "gelibolu", "https://keos.gelibolu.bel.tr/imardurumu/", "https://keos.gelibolu.bel.tr", [26.670, 40.410]),
    _m("caycuma-keos", "Çaycuma KEOS", "municipal_keos", "Zonguldak", "Çaycuma", "caycuma", "https://keos.caycuma.bel.tr/", "https://keos.caycuma.bel.tr", [32.075, 41.427]),
    SourceRecord("tkgm-parsel-sorgu", "TKGM Parsel Sorgu", "national_parcel", None, None, "tkgm", "https://parselsorgu.tkgm.gov.tr/", "https://parselsorgu.tkgm.gov.tr", notes="Resmi parsel sorgu portalı; servis kullanımı yasal/kurumsal izinlere tabi olabilir.", requires_approval=True, center=[35.243, 38.963]),
    SourceRecord("tkgm-data-sharing-docs", "TKGM Veri Paylaşımı Usul ve Esasları", "registry", None, None, "tkgm-veri-paylasimi", "https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar", "https://www.tkgm.gov.tr", requires_approval=True, center=[35.243, 38.963]),
    SourceRecord("eplan-csb", "e-Plan ÇŞB", "national_plan", None, None, "eplan-csb", "https://eplan.csb.gov.tr/", "https://eplan.csb.gov.tr", requires_approval=True, center=[35.243, 38.963]),
    SourceRecord("e-plan", "e-Plan Portalı", "national_plan", None, None, "e-plan", "https://e-plan.gov.tr/", "https://e-plan.gov.tr", requires_approval=True, center=[35.243, 38.963]),
    SourceRecord("tucbs-public-api", "TUCBS Public API", "national_geodata", None, None, "tucbs-public-api", "https://tucbs-public-api.csb.gov.tr/", "https://tucbs-public-api.csb.gov.tr", notes="Bazı uç noktalar kota/anahtar gerektirebilir.", center=[35.243, 38.963]),
    SourceRecord("tucbs", "TUCBS", "national_geodata", None, None, "tucbs", "https://tucbs.gov.tr/", "https://tucbs.gov.tr", center=[35.243, 38.963]),
    SourceRecord("atlas", "Atlas", "national_geodata", None, None, "atlas", "https://www.atlas.gov.tr/", "https://www.atlas.gov.tr", center=[35.243, 38.963]),
    SourceRecord("csb-cbs", "ÇŞB CBS", "national_geodata", None, None, "csb-cbs", "https://cbs.csb.gov.tr/", "https://cbs.csb.gov.tr", center=[35.243, 38.963]),
    SourceRecord("yerel-veri-platformlari", "Yerel Veri Platformları", "registry", None, None, "yerel-veri-platformlari", "https://akillisehirler.csb.gov.tr/yerel-veri-platformlari/", "https://akillisehirler.csb.gov.tr", center=[35.243, 38.963]),
    SourceRecord("bulutkbs-vatandas", "BulutKBS Vatandaş Portalı", "national_geodata", None, None, "bulutkbs", "https://bulutkbs.gov.tr/", "https://bulutkbs.gov.tr", center=[35.243, 38.963]),
    SourceRecord("maks", "MAKS", "registry", None, None, "maks", "https://maks.nvi.gov.tr/", "https://maks.nvi.gov.tr", notes="Mekansal Adres Kayıt Sistemi; servis erişimi kurum yetkisi gerektirebilir.", requires_credentials=True, requires_approval=True, center=[35.243, 38.963]),
] + _generated_turkey_province_sources()


def list_sources() -> List[Dict[str, Any]]:
    return [source.to_dict() for source in SOURCE_REGISTRY]


def get_source(source_id: str) -> Optional[SourceRecord]:
    return next((s for s in SOURCE_REGISTRY if s.id == source_id), None)


def get_source_by_slug(slug: str) -> Optional[SourceRecord]:
    slug = slug.lower().strip()
    return next((s for s in SOURCE_REGISTRY if s.slug.lower() == slug), None)


def endpoint_type(url: str, kind: str) -> str:
    lower = url.lower()
    if "service=wms" in lower or ("wms" in lower and "getcapabilities" in lower):
        return "wms"
    if "service=wfs" in lower or ("wfs" in lower and "getcapabilities" in lower):
        return "wfs"
    if "arcgis/rest" in lower:
        return "arcgis"
    if any(token in lower for token in ("mapservice.ashx", "queryservice.ashx", "imardurumu.ashx", "imardurumu.asmx", "netgis")):
        return "keos"
    return "external_link"


def live_layer_candidates(discovery_by_source: Optional[Dict[str, Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    discovery_by_source = discovery_by_source or {}
    layers: List[Dict[str, Any]] = []
    for source in SOURCE_REGISTRY:
        discovery = discovery_by_source.get(source.id) or {}
        endpoints = discovery.get("endpoints") or discovery.get("live_endpoints") or []
        selected = [e for e in endpoints if isinstance(e, dict) and e.get("url")]
        if not selected:
            selected = [{"url": source.homepage_url, "status": "external_only", "type": "external_link"}]
        for index, endpoint in enumerate(selected[:6]):
            url = endpoint["url"]
            kind = endpoint.get("type") or endpoint_type(url, source.kind)
            layers.append({
                "id": f"{source.id}-{index}",
                "source_id": source.id,
                "name": source.name,
                "type": kind,
                "title": endpoint.get("title") or source.name,
                "url": url,
                "status": endpoint.get("status") or ("requires_approval" if source.requires_approval else "external_only"),
                "bbox": endpoint.get("bbox"),
                "layers": endpoint.get("layers") or [],
                "requires_proxy": kind in {"wms", "wfs", "arcgis", "keos"},
                "homepage_url": source.homepage_url,
                "center": source.center,
                "province": source.province,
                "district": source.district,
                "kind": source.kind,
                "requires_approval": source.requires_approval,
                "requires_credentials": source.requires_credentials,
            })
    return layers
