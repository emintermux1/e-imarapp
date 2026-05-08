#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

missing=()
malformed=()
for key in MAPTILER_API_KEY MAPBOX_ACCESS_TOKEN CESIUM_ION_TOKEN HERE_API_KEY; do
  value="${!key:-}"
  if [[ -z "${value//[[:space:]]/}" ]]; then
    missing+=("$key")
  elif [[ "$value" =~ ^(change-?me|example|placeholder|test|xxx+)$ || "$value" =~ ^your[-_] || "$value" == "..." || "$value" =~ ^\<.+\>$ ]]; then
    malformed+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  printf 'Missing map provider env vars:\n'
  printf -- '- %s\n' "${missing[@]}"
fi

if (( ${#malformed[@]} > 0 )); then
  printf 'Malformed map provider env vars:\n'
  printf -- '- %s\n' "${malformed[@]}"
fi

if (( ${#missing[@]} > 0 || ${#malformed[@]} > 0 )); then
  printf '\nPut the values in .env or your secret manager. Do not commit .env.\n'
  exit 1
fi

printf 'All map provider env vars are configured. Values were not printed.\n'
