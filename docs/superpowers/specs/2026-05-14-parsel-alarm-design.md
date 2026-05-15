# Parsel Alarm design

## Goal

Rename and sharpen the existing watchlist/tracking experience into `Parsel Alarm` across the E-İmar website and mobile app. A user will understand that adding a parcel creates an alarm profile for imar changes, askı plans, çevre plan updates, and source access/status changes.

## Scope

In scope:
- Rename user-facing watchlist/tracking labels to `Parsel Alarm`.
- Keep local-only storage honest until backend sync is enabled.
- Show active alarm intents per parcel and allow toggling them on web.
- Make mobile alarm cards use the same name and explain that live notifications are not yet delivered from the device.
- Preserve provenance/source labels and never imply official alerts are active without configured backend delivery.
- Add tests for the exported product name and default alarm intent set.

Out of scope:
- Sending push/email/webhook notifications in this pass.
- Persisting watchlist entries to server tables from web/mobile.
- Polling protected government systems behind credential/captcha walls.

## UX

Web sidebar:
- Empty state says no `Parsel Alarm` exists yet.
- Existing local tracking banner becomes `Parsel Alarm yerel modda`.
- Parcel cards keep intent chips for imar, askı, çevre plan, and source access status.
- Copy explains these are local alarm preferences until server sync is connected.

Mobile:
- Watchlist tab remains structurally the same but title becomes `Parsel Alarm`.
- Empty/help state explains alarm profiles are local and provenance-aware.
- Cards keep source, intent, parcel label, and next action.

Backend alignment:
- Existing `/eplan/subscriptions` and notification skeleton remain the future server path.
- Website bootstrap can continue advertising `watchlistNotifications: true` as readiness, not proof of live delivery.

## Verification

Run:
- `npm test -- --runTestsByPath test/eimar-aski-watchlist.spec.ts`
- `npm run web:typecheck`
- `npm run typecheck`
- GitHub Flutter CI after push, because local Flutter is unavailable.
