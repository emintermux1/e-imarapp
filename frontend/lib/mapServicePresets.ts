export interface MapServicePreset {
  key: string;
  label: string;
  wmsUrl: string;
}

export const MAP_SERVICE_PRESETS: MapServicePreset[] = [
  { key: "pendik", label: "Pendik", wmsUrl: "https://keos.pendik.bel.tr/imardurumu/" },
  { key: "esenler", label: "Esenler", wmsUrl: "https://keos.esenler.bel.tr/imardurumu/index.aspx" },
  { key: "canakkale", label: "Çanakkale", wmsUrl: "https://webgis.canakkale.bel.tr/imardurumu/index.aspx" },
  { key: "pamukkale", label: "Pamukkale", wmsUrl: "http://keos.pamukkale.bel.tr/imardurumu/index.aspx" },
  { key: "cerkezkoy", label: "Çerkezköy", wmsUrl: "https://webgis.cerkezkoy.bel.tr:444/imardurumu/" },
  { key: "kahramankazan", label: "Kahramankazan", wmsUrl: "https://keos.kahramankazan.bel.tr:8880/imardurumu/" },
  { key: "alanya", label: "Alanya", wmsUrl: "https://keos.alanya.bel.tr/imardurumu/index.aspx" },
  { key: "konak", label: "Konak", wmsUrl: "https://keos.konak.bel.tr/imardurumu/" },
  { key: "merkezefendi", label: "Merkezefendi", wmsUrl: "https://keos.merkezefendi.bel.tr/imardurumu/index.aspx" },
  { key: "altinordu", label: "Altınordu", wmsUrl: "https://ekent.altinordu.bel.tr/imardurumu/" },
  { key: "aksaray", label: "Aksaray", wmsUrl: "https://ebelediye.aksaray.bel.tr:444/imardurumu/" },
  { key: "sehitkamil", label: "Şehitkamil", wmsUrl: "https://keos.sehitkamil.bel.tr/imardurumu/" },
  { key: "ibb", label: "İBB Şehir Haritası", wmsUrl: "https://sehirharitasi.ibb.gov.tr" },
  { key: "ankara", label: "Ankara İmar", wmsUrl: "https://imar.ankara.bel.tr" },
  { key: "izmir", label: "İzmir CBS", wmsUrl: "https://cbs.izmir.bel.tr" },
  { key: "cankaya", label: "Çankaya", wmsUrl: "https://imardurumu.cankaya.bel.tr/" },
  { key: "sultangazi", label: "Sultangazi", wmsUrl: "https://webgis.sultangazi.bel.tr/imardurumu/" },
  { key: "basaksehir", label: "Başakşehir", wmsUrl: "https://webgis.basaksehir.bel.tr/imardurumu/" },
  { key: "tusba", label: "Tuşba", wmsUrl: "https://keos.tusba.bel.tr:8282/imardurumu/index.aspx" },
  { key: "tkgm", label: "TKGM Parsel Sorgu", wmsUrl: "https://parselsorgu.tkgm.gov.tr/" },
  { key: "eplan", label: "ÇŞB e-Plan", wmsUrl: "https://eplan.csb.gov.tr/" },
  { key: "tucbs-public-api", label: "TUCBS Public API", wmsUrl: "https://tucbs-public-api.csb.gov.tr/" },
  { key: "atlas", label: "Atlas", wmsUrl: "https://www.atlas.gov.tr/" },
  { key: "csb-cbs", label: "ÇŞB CBS", wmsUrl: "https://cbs.csb.gov.tr/" },
];
