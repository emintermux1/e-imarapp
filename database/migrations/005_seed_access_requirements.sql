insert into source_access_requirements (source_id, requirement_type, description, secret_env_name)
values
  ('tkgm-parsel-sorgu', 'captcha_session', 'TKGM portal automation may require browser session/captcha handling and must follow TKGM data sharing rules.', null),
  ('maks', 'legal_protocol', 'MAKS production use requires official legal/institutional approval.', null),
  ('maks', 'institutional_login', 'MAKS connector requires institutional credentials after approval.', 'MAKS_CREDENTIALS_REF'),
  ('edevlet-csb-tucbs', 'edevlet_login', 'e-Devlet/TUCBS connector requires a legal e-Devlet authentication workflow.', 'EDEVLET_TUCBS_CREDENTIALS_REF'),
  ('icisleri-e-belediye', 'institutional_login', 'İçişleri e-Belediye operational data requires institutional login.', 'EBELEDIYE_CREDENTIALS_REF'),
  ('copernicus-data-space', 'oauth', 'Copernicus Data Space API access requires official account/OAuth configuration.', 'COPERNICUS_OAUTH_REF'),
  ('mapbox-maps-api', 'commercial_token', 'Mapbox APIs require access token and license-compliant use.', 'MAPBOX_ACCESS_TOKEN'),
  ('maptiler-cloud-api', 'api_key', 'MapTiler APIs require API key and license-compliant use.', 'MAPTILER_API_KEY'),
  ('here-map-tile-api', 'api_key', 'HERE APIs require API key and product-specific license review.', 'HERE_API_KEY'),
  ('cesium-ion', 'commercial_token', 'Cesium ion hosted terrain/3D Tiles require access token.', 'CESIUM_ION_TOKEN')
on conflict (source_id, requirement_type, secret_env_name) do update set
  description = excluded.description,
  updated_at = now();
