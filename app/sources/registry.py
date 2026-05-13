from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Optional


class SourceProvider(str, Enum):
    netcad_keos = "netcad-keos"
    netcad_webgis = "netcad-webgis"
    ibb_arcgis = "ibb-arcgis"
    abb_imar = "abb-imar"
    izmir_cbs = "izmir-cbs"
    csb_eplan = "csb-eplan"
    csb_tucbs = "csb-tucbs"
    csb_atlas = "csb-atlas"
    csb_cbs = "csb-cbs"
    csb_yvp = "csb-yvp"
    bulutkbs = "bulutkbs"
    tkgm_parselsorgu = "tkgm-parselsorgu"
    nvi_maks = "nvi-maks"
    doc = "doc"


class SourceAuth(str, Enum):
    public = "public"
    public_partial = "public_partial"
    requires_credentials = "requires_credentials"
    requires_legal_agreement = "requires_legal_agreement"
    captcha_required = "captcha_required"
    rate_limited = "rate_limited"


class SourceCategory(str, Enum):
    central = "central"
    metropolitan = "metropolitan"
    municipal = "municipal"
    catalog = "catalog"
    document = "document"


@dataclass(slots=True)
class SourceEntry:
    id: str
    name: str
    base_url: str
    provider: SourceProvider
    auth: SourceAuth
    category: SourceCategory
    discovery_strategy: str
    capabilities: list[str] = field(default_factory=list)
    municipality_name: Optional[str] = None
    notes: Optional[str] = None

    def to_dict(self) -> dict:
        payload = asdict(self)
        payload["provider"] = self.provider.value
        payload["auth"] = self.auth.value
        payload["category"] = self.category.value
        return payload


def _src(**kwargs) -> SourceEntry:
    return SourceEntry(**kwargs)


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


def _generated_turkey_province_sources() -> list[SourceEntry]:
    vendors = [SourceProvider.netcad_keos, SourceProvider.netcad_webgis, SourceProvider.netcad_keos, SourceProvider.netcad_webgis, SourceProvider.netcad_webgis]
    rows: list[SourceEntry] = []
    for idx, (_, slug, name) in enumerate(TURKEY_PROVINCES):
        provider = vendors[idx % len(vendors)]
        if provider == SourceProvider.netcad_keos:
            base_url = f"https://keos.{slug}.bel.tr/imardurumu/"
            capabilities = ["portal", "parcel-query", "layers", "aski-list"]
        else:
            base_url = f"https://webgis.{slug}.bel.tr/imardurumu/"
            capabilities = ["portal", "parcel-query", "layers"]
        rows.append(_src(
            id=f"prov.{slug}.coverage",
            name=f"{name} Belediye İmar Adayı",
            base_url=base_url,
            provider=provider,
            auth=SourceAuth.public_partial,
            category=SourceCategory.municipal,
            discovery_strategy="keos-html",
            capabilities=capabilities,
            municipality_name=f"{name} İl Merkezi",
            notes=f"{name} için metadata_only aday kayıt; canlı endpoint ve izin durumu doğrulanmadı.",
        ))
    return rows


REGISTRY: dict[str, SourceEntry] = {
    "tkgm.parselsorgu": _src(
        id="tkgm.parselsorgu",
        name="TKGM Parsel Sorgu",
        base_url="https://parselsorgu.tkgm.gov.tr/",
        provider=SourceProvider.tkgm_parselsorgu,
        auth=SourceAuth.captcha_required,
        category=SourceCategory.central,
        discovery_strategy="manual",
        capabilities=["parcel-query", "parcel-geometry"],
        notes="Captcha + oturum gerektiriyor; resmi veri paylaşımı için mevzuat/protokol gerekli.",
    ),
    "tkgm.mevzuat": _src(
        id="tkgm.mevzuat",
        name="TKGM Veri Paylaşım Mevzuatı",
        base_url="https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar",
        provider=SourceProvider.doc,
        auth=SourceAuth.public,
        category=SourceCategory.document,
        discovery_strategy="manual",
        capabilities=["documentation"],
        notes="TKGM veri paylaşım usul ve esasları belgesi.",
    ),
    "csb.eplan": _src(
        id="csb.eplan",
        name="ÇŞB e-Plan Otomasyonu",
        base_url="https://eplan.csb.gov.tr/",
        provider=SourceProvider.csb_eplan,
        auth=SourceAuth.public_partial,
        category=SourceCategory.central,
        discovery_strategy="eplan-public",
        capabilities=["aski-list", "plan-detail", "document-links"],
        notes="Public askı/yürürlük listeleri kısmen açık; bazı detaylar oturum isteyebilir.",
    ),
    "csb.eplan.alt": _src(
        id="csb.eplan.alt",
        name="ÇŞB e-Plan Alternatif",
        base_url="https://e-plan.gov.tr/",
        provider=SourceProvider.csb_eplan,
        auth=SourceAuth.public_partial,
        category=SourceCategory.central,
        discovery_strategy="eplan-public",
        capabilities=["aski-list", "plan-detail"],
        notes="Alternatif alan adı; public akışlar probe edilir.",
    ),
    "csb.tucbs.public": _src(
        id="csb.tucbs.public",
        name="TUCBS Public API",
        base_url="https://tucbs-public-api.csb.gov.tr/",
        provider=SourceProvider.csb_tucbs,
        auth=SourceAuth.public_partial,
        category=SourceCategory.central,
        discovery_strategy="tucbs-openapi",
        capabilities=["api-catalog", "municipality-catalog", "address"],
        notes="OpenAPI/Swagger probe edilir; public endpoint'ler capability olarak listelenir.",
    ),
    "csb.tucbs.main": _src(
        id="csb.tucbs.main",
        name="TUCBS Ana Portal",
        base_url="https://tucbs.gov.tr/",
        provider=SourceProvider.csb_tucbs,
        auth=SourceAuth.public,
        category=SourceCategory.central,
        discovery_strategy="manual",
        capabilities=["documentation", "portal"],
        notes="TUCBS ana portalı ve dokümantasyon girişi.",
    ),
    "csb.atlas": _src(
        id="csb.atlas",
        name="Atlas",
        base_url="https://www.atlas.gov.tr/",
        provider=SourceProvider.csb_atlas,
        auth=SourceAuth.public,
        category=SourceCategory.central,
        discovery_strategy="wms",
        capabilities=["portal", "wms", "layers"],
        notes="Atlas görüntüleyicisi; WMS/OGC izleri probe edilir.",
    ),
    "csb.cbs": _src(
        id="csb.cbs",
        name="ÇŞB CBS",
        base_url="https://cbs.csb.gov.tr/",
        provider=SourceProvider.csb_cbs,
        auth=SourceAuth.public,
        category=SourceCategory.central,
        discovery_strategy="wms",
        capabilities=["portal", "wms", "layers"],
        notes="Bakanlık CBS portalı; public servis izleri probe edilir.",
    ),
    "csb.akilli.yvp": _src(
        id="csb.akilli.yvp",
        name="Yerel Veri Platformları Kataloğu",
        base_url="https://akillisehirler.csb.gov.tr/yerel-veri-platformlari/",
        provider=SourceProvider.csb_yvp,
        auth=SourceAuth.public,
        category=SourceCategory.catalog,
        discovery_strategy="manual",
        capabilities=["catalog", "municipality-catalog"],
        notes="1391 belediye yerel veri platformu kataloğu.",
    ),
    "csb.bulutkbs": _src(
        id="csb.bulutkbs",
        name="BulutKBS Vatandaş Portalı",
        base_url="https://bulutkbs.gov.tr/",
        provider=SourceProvider.bulutkbs,
        auth=SourceAuth.requires_credentials,
        category=SourceCategory.central,
        discovery_strategy="manual",
        capabilities=["portal"],
        notes="Vatandaş oturumu gerekebilir; otomatik kazıma yok.",
    ),
    "nvi.maks": _src(
        id="nvi.maks",
        name="MAKS",
        base_url="https://maks.nvi.gov.tr/",
        provider=SourceProvider.nvi_maks,
        auth=SourceAuth.requires_credentials,
        category=SourceCategory.central,
        discovery_strategy="manual",
        capabilities=["address", "municipality-catalog"],
        notes="Adres sistemi entegrasyonu kurumsal erişim gerektirir.",
    ),
    "bel.ibb.sehirharitasi": _src(
        id="bel.ibb.sehirharitasi",
        name="İBB Şehir Haritası",
        base_url="https://sehirharitasi.ibb.gov.tr/",
        provider=SourceProvider.ibb_arcgis,
        auth=SourceAuth.public,
        category=SourceCategory.metropolitan,
        discovery_strategy="arcgis-rest",
        capabilities=["portal", "arcgis", "layers"],
        municipality_name="İstanbul Büyükşehir Belediyesi",
        notes="ArcGIS REST servisleri probe edilir.",
    ),
    "bel.ankara.imar": _src(
        id="bel.ankara.imar",
        name="Ankara Büyükşehir İmar",
        base_url="https://imar.ankara.bel.tr/",
        provider=SourceProvider.abb_imar,
        auth=SourceAuth.public_partial,
        category=SourceCategory.metropolitan,
        discovery_strategy="keos-html",
        capabilities=["portal", "parcel-query", "layers"],
        municipality_name="Ankara Büyükşehir Belediyesi",
        notes="İmar portalı; servis izleri HTML/JS discovery ile aranır.",
    ),
    "bel.izmir.cbs": _src(
        id="bel.izmir.cbs",
        name="İzmir Büyükşehir CBS",
        base_url="https://cbs.izmir.bel.tr/",
        provider=SourceProvider.izmir_cbs,
        auth=SourceAuth.public,
        category=SourceCategory.metropolitan,
        discovery_strategy="arcgis-rest",
        capabilities=["portal", "layers", "arcgis"],
        municipality_name="İzmir Büyükşehir Belediyesi",
        notes="CBS portalı; ArcGIS/OGC izleri probe edilir.",
    ),
    "bel.cankaya.imardurumu": _src(
        id="bel.cankaya.imardurumu",
        name="Çankaya İmar Durumu",
        base_url="https://imardurumu.cankaya.bel.tr/",
        provider=SourceProvider.netcad_keos,
        auth=SourceAuth.public_partial,
        category=SourceCategory.metropolitan,
        discovery_strategy="keos-html",
        capabilities=["parcel-query", "layers", "aski-list"],
        municipality_name="Çankaya Belediyesi",
        notes="Netcad tabanlı imar durumu portalı.",
    ),
}

_MUNICIPAL_SOURCES = [
    ("bel.pendik.keos", "Pendik", "https://keos.pendik.bel.tr/imardurumu/", SourceProvider.netcad_keos),
    ("bel.esenler.keos", "Esenler", "https://keos.esenler.bel.tr/imardurumu/index.aspx", SourceProvider.netcad_keos),
    ("bel.canakkale.webgis", "Çanakkale", "https://webgis.canakkale.bel.tr/imardurumu/index.aspx", SourceProvider.netcad_webgis),
    ("bel.pamukkale.keos", "Pamukkale", "http://keos.pamukkale.bel.tr/imardurumu/index.aspx", SourceProvider.netcad_keos),
    ("bel.cerkezkoy.webgis", "Çerkezköy", "https://webgis.cerkezkoy.bel.tr:444/imardurumu/", SourceProvider.netcad_webgis),
    ("bel.kahramankazan.keos", "Kahramankazan", "https://keos.kahramankazan.bel.tr:8880/imardurumu/", SourceProvider.netcad_keos),
    ("bel.alanya.keos", "Alanya", "https://keos.alanya.bel.tr/imardurumu/index.aspx", SourceProvider.netcad_keos),
    ("bel.konak.keos", "Konak", "https://keos.konak.bel.tr/imardurumu/", SourceProvider.netcad_keos),
    ("bel.merkezefendi.keos", "Merkezefendi", "https://keos.merkezefendi.bel.tr/imardurumu/index.aspx", SourceProvider.netcad_keos),
    ("bel.altinordu.ekent", "Altınordu", "https://ekent.altinordu.bel.tr/imardurumu/", SourceProvider.netcad_keos),
    ("bel.aksaray.ebelediye", "Aksaray", "https://ebelediye.aksaray.bel.tr:444/imardurumu/", SourceProvider.netcad_webgis),
    ("bel.sehitkamil.keos", "Şehitkamil", "https://keos.sehitkamil.bel.tr/imardurumu/", SourceProvider.netcad_keos),
    ("bel.sultangazi.webgis", "Sultangazi", "https://webgis.sultangazi.bel.tr/imardurumu/", SourceProvider.netcad_webgis),
    ("bel.basaksehir.webgis", "Başakşehir", "https://webgis.basaksehir.bel.tr/imardurumu/", SourceProvider.netcad_webgis),
    ("bel.tusba.keos", "Tuşba", "https://keos.tusba.bel.tr:8282/imardurumu/index.aspx", SourceProvider.netcad_keos),
    ("bel.suleymanpasa.keos", "Süleymanpaşa", "https://keos.suleymanpasa.bel.tr:8080/imardurumu/index.aspx", SourceProvider.netcad_keos),
    ("bel.mustafakemalpasa.keos", "Mustafakemalpaşa", "http://keos.mustafakemalpasa.bel.tr/imardurumu/index.aspx", SourceProvider.netcad_keos),
    ("bel.gelibolu.keos", "Gelibolu", "https://keos.gelibolu.bel.tr/imardurumu/", SourceProvider.netcad_keos),
    ("bel.caycuma.keos", "Çaycuma", "https://keos.caycuma.bel.tr/", SourceProvider.netcad_keos),
    ("bel.kecioren.kbs", "Keçiören", "https://kbs.kecioren.bel.tr/", SourceProvider.netcad_webgis),
]
for _id, _muni, _url, _provider in _MUNICIPAL_SOURCES:
    REGISTRY[_id] = _src(
        id=_id,
        name=f"{_muni} İmar Portalı",
        base_url=_url,
        provider=_provider,
        auth=SourceAuth.public_partial,
        category=SourceCategory.municipal,
        discovery_strategy="keos-html",
        capabilities=["portal", "parcel-query", "layers", "aski-list"],
        municipality_name=_muni,
        notes=f"{_muni} belediye imar/KEOS portalı; HTML/JS discovery ile servis uçları aranır.",
    )

for source in _generated_turkey_province_sources():
    REGISTRY[source.id] = source


def list_sources() -> list[SourceEntry]:
    return sorted(REGISTRY.values(), key=lambda item: (item.category.value, item.name.lower()))


def get_source(source_id: str) -> Optional[SourceEntry]:
    return REGISTRY.get(source_id)


def sources_by_capability(cap: str) -> list[SourceEntry]:
    return [src for src in list_sources() if cap in src.capabilities]


def sources_by_category(cat: SourceCategory | str) -> list[SourceEntry]:
    cat_value = cat.value if isinstance(cat, SourceCategory) else str(cat)
    return [src for src in list_sources() if src.category.value == cat_value]
