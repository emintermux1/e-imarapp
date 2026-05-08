# Parcel Detail + Analysis State Machine

This state machine governs the Parcel Detail and Analysis pages.

## 1) Scope

Screens:
- Map workspace parcel detail sheet
- Full analysis panel/page
- Plan-note explain panel

Primary backend actions:
- `POST /website/bff/parcel-workflow`
- `POST /website/bff/plan-note-explain`

## 2) States

```text
IDLE
  -> QUERY_LOADING
  -> QUERY_FAILED
  -> PARCEL_EMPTY
  -> PARCEL_SELECTED

PARCEL_SELECTED
  -> ANALYSIS_LOADING
  -> ANALYSIS_READY
  -> ANALYSIS_FAILED

ANALYSIS_READY
  -> EXPLAIN_LOADING
  -> EXPLAIN_READY
  -> EXPLAIN_FAILED

ANY_STATE
  -> NOT_READY_GATE
  -> REQUIRES_CREDENTIALS_GATE
```

## 3) Transition table

### IDLE -> QUERY_LOADING
Trigger:
- user submits parcel query

### QUERY_LOADING -> PARCEL_SELECTED
Guard:
- response.status == `ok`
- response.parcelQuery.count > 0

### QUERY_LOADING -> PARCEL_EMPTY
Guard:
- response.status == `ok`
- count == 0 OR response.parcelQuery.status == `empty`

### QUERY_LOADING -> QUERY_FAILED
Guard:
- network failure
- unhandled server error

### QUERY_LOADING -> NOT_READY_GATE
Guard:
- any top-level status `not_ready`

### QUERY_LOADING -> REQUIRES_CREDENTIALS_GATE
Guard:
- any top-level status `requires_credentials`

### PARCEL_SELECTED -> ANALYSIS_LOADING
Trigger:
- user opens `Analizi Gör`

### ANALYSIS_LOADING -> ANALYSIS_READY
Guard:
- potential summary present (or valid partial payload)

### ANALYSIS_LOADING -> ANALYSIS_FAILED
Guard:
- malformed or rejected analysis payload

### ANALYSIS_READY -> EXPLAIN_LOADING
Trigger:
- user requests plan note explanation

### EXPLAIN_LOADING -> EXPLAIN_READY
Guard:
- explain endpoint returns `status = ok`

### EXPLAIN_LOADING -> EXPLAIN_FAILED
Guard:
- provider error / timeout / missing note text

## 4) UI obligations per state

### IDLE
- neutral map + instructional prompt

### QUERY_LOADING
- map skeleton + panel skeleton
- disable duplicate submit

### PARCEL_EMPTY
- explicit "kayıt bulunamadı"
- suggest alternate query path

### PARCEL_SELECTED
- show parcel geometry highlight
- show quick facts
- keep CTAs enabled

### ANALYSIS_LOADING
- keep parcel details visible
- skeleton only in analysis subsection

### ANALYSIS_READY
- render potential card + risk band + emsal outputs

### NOT_READY_GATE
- render backend nextActions verbatim

### REQUIRES_CREDENTIALS_GATE
- show integration required card (no fake fallback)

## 5) Event schema

- `parcel_query_started`
- `parcel_query_finished`
- `parcel_query_empty`
- `parcel_selected`
- `analysis_opened`
- `analysis_ready`
- `analysis_failed`
- `plan_explain_started`
- `plan_explain_ready`
- `plan_explain_failed`

## 6) Deterministic reducer contract

Frontend should implement this machine via reducer/XState equivalent.
No implicit side effects in render functions.

Minimal reducer input:

```ts
type ParcelAnalysisEvent =
  | { type: 'SUBMIT_QUERY' }
  | { type: 'QUERY_OK'; payload: unknown }
  | { type: 'QUERY_EMPTY' }
  | { type: 'QUERY_ERROR'; error: string }
  | { type: 'ANALYSIS_OPEN' }
  | { type: 'ANALYSIS_OK'; payload: unknown }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'EXPLAIN_OPEN' }
  | { type: 'EXPLAIN_OK'; payload: unknown }
  | { type: 'EXPLAIN_ERROR'; error: string };
```
