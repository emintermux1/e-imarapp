insert into data_sources (id, name, jurisdiction, category, homepage_url, access_status, access_notes, capabilities, documentation_urls)
values
  ('atlas-ulusal-cbs', 'Atlas Ulusal CBS', 'national', 'basemap', 'https://www.atlas.gov.tr/', 'unknown', 'National atlas portal; live probing determines catalog and service availability.', array['national_atlas', 'basemap', 'geospatial_catalog'], array[]::text[]),
  ('bulutkbs', 'BulutKBS Vatandaş Portalı', 'national', 'municipal_gis', 'https://bulutkbs.gov.tr/', 'unknown', 'Public/institutional KBS portal; connector must separate public views from protected flows.', array['municipal_gis', 'kbs_portal'], array[]::text[]),
  ('netcad-e-imar', 'Netcad E-İmar', 'national', 'municipal_gis', 'https://www.netcad.com/tr/urunler/e-imar', 'unknown', 'Vendor reference page for Netcad E-İmar product and common implementation patterns.', array['netcad_reference', 'e_imar_reference'], array[]::text[]),
  ('citygml-standard', 'CityGML Standard', 'global', 'open_data', 'https://www.citygml.org/', 'public', 'Open standard reference for 3D city model ingestion and export.', array['citygml', '3d_city_models'], array[]::text[]),
  ('osm-overpass-api', 'OpenStreetMap Overpass API', 'global', 'open_data', 'https://wiki.openstreetmap.org/wiki/Overpass_API', 'public', 'Public OSM query API; production use must respect fair-use and rate limits.', array['poi_search', 'road_network', 'nearby_search'], array[]::text[]),
  ('ibb-eplan', 'İBB E-Plan Sorgu', 'municipal', 'plan', 'https://eplan.ibb.istanbul/sorgu/plansorgu', 'unknown', 'İBB plan query portal; public plan details must be discovered and normalized.', array['plan_lookup', 'municipal_plan_catalog'], array[]::text[]),
  ('besiktas-keos-imar', 'Beşiktaş Belediyesi KEOS İmar Durumu', 'municipal', 'municipal_gis', 'https://keos.besiktas.bel.tr/imardurumu/', 'unknown', 'Seed municipal KEOS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[]),
  ('bakirkoy-keos-imar', 'Bakırköy Belediyesi KEOS İmar Durumu', 'municipal', 'municipal_gis', 'https://keos.bakirkoy.bel.tr/imardurumu/', 'unknown', 'Seed municipal KEOS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[]),
  ('kadikoy-webgis-imar', 'Kadıköy Belediyesi WebGIS İmar Durumu', 'municipal', 'municipal_gis', 'https://webgis.kadikoy.bel.tr/imardurumu/', 'unknown', 'Seed municipal WebGIS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[]),
  ('gaziosmanpasa-keos', 'Gaziosmanpaşa Belediyesi KEOS', 'municipal', 'municipal_gis', 'https://keos.gaziosmanpasa.bel.tr/keos/', 'unknown', 'Seed municipal KEOS portal; live probing determines endpoint health.', array['municipal_gis'], array[]::text[]),
  ('bodrum-keos-imar', 'Bodrum Belediyesi KEOS İmar Durumu', 'municipal', 'municipal_gis', 'https://keos.bodrum.bel.tr/imardurumu/', 'unknown', 'Seed municipal KEOS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[]),
  ('karsiyaka-keos-imar', 'Karşıyaka Belediyesi KEOS İmar Durumu', 'municipal', 'municipal_gis', 'https://keos.karsiyaka.bel.tr/imardurumu/index.aspx', 'unknown', 'Seed municipal KEOS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[]),
  ('nilufer-webgis-imar', 'Nilüfer Belediyesi WebGIS İmar Durumu', 'municipal', 'municipal_gis', 'https://webgis.nilufer.bel.tr/imardurumu/', 'unknown', 'Seed municipal WebGIS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[]),
  ('antakya-keos-imar', 'Antakya Belediyesi KEOS İmar Durumu', 'municipal', 'municipal_gis', 'https://keos.antakya.bel.tr/imardurumu/', 'unknown', 'Seed municipal KEOS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[]),
  ('batman-keos-imar', 'Batman Belediyesi KEOS İmar Durumu', 'municipal', 'municipal_gis', 'http://keos.batman.bel.tr/imardurumu/', 'unknown', 'Seed municipal KEOS portal; live probing determines endpoint health.', array['zoning_status', 'municipal_gis'], array[]::text[])
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
