insert into data_sources (id, name, jurisdiction, category, homepage_url, access_status, access_notes, capabilities, documentation_urls)
values
  (
    'tkgm-parsel-sorgu',
    'TKGM Parsel Sorgu Uygulaması',
    'national',
    'parcel',
    'https://parselsorgu.tkgm.gov.tr/',
    'unknown',
    'Official parcel query portal; connector must verify lawful automation, session, and captcha requirements at runtime.',
    array['parcel_lookup', 'map_portal'],
    array['https://www.tkgm.gov.tr/mevzuat/tapu-ve-kadastro-verilerinin-paylasilmasina-iliskin-usul-ve-esaslar']
  ),
  (
    'csb-e-plan',
    'ÇŞİDB E-Plan Otomasyonu',
    'national',
    'plan',
    'https://e-plan.gov.tr/',
    'unknown',
    'Official plan portal; protected flows must request credentials rather than fabricating data.',
    array['plan_lookup', 'plan_documents'],
    array['https://eplan.csb.gov.tr/']
  ),
  (
    'tucbs-public-api',
    'Türkiye Ulusal CBS Public API',
    'national',
    'open_data',
    'https://tucbs-public-api.csb.gov.tr/',
    'unknown',
    'National geospatial API endpoint; exact availability is established by discovery probes.',
    array['geospatial_api', 'national_catalog'],
    array['https://tucbs.gov.tr/']
  ),
  (
    'ibb-open-data',
    'İBB Açık Veri Portalı',
    'municipal',
    'open_data',
    'https://data.ibb.gov.tr/',
    'public',
    'Public open data portal; dataset licenses and schemas must be verified per dataset.',
    array['open_data_catalog', 'municipal_dataset_discovery'],
    array[]::text[]
  )
on conflict (id) do update set
  name = excluded.name,
  jurisdiction = excluded.jurisdiction,
  category = excluded.category,
  homepage_url = excluded.homepage_url,
  access_status = excluded.access_status,
  access_notes = excluded.access_notes,
  capabilities = excluded.capabilities,
  documentation_urls = excluded.documentation_urls,
  updated_at = now();
