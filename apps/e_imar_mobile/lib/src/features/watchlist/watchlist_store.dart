import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../map/domain/parcel.dart';
import 'domain/watchlist_item.dart';

final watchlistProvider =
    StateNotifierProvider<WatchlistController, List<WatchlistItem>>(
  (ref) => WatchlistController(),
);

class WatchlistController extends StateNotifier<List<WatchlistItem>> {
  WatchlistController() : super(_seedItems);

  bool containsParcel(ParcelDetail parcel) {
    final id = _parcelWatchId(parcel);
    return state.any((item) => item.id == id);
  }

  void toggleParcel(ParcelDetail parcel) {
    final id = _parcelWatchId(parcel);
    if (state.any((item) => item.id == id)) {
      state = state.where((item) => item.id != id).toList(growable: false);
      return;
    }

    final item = WatchlistItem(
      id: id,
      title: 'Parsel takibi',
      subtitle:
          '${parcel.parcelLabel} için plan notu, askı ve kaynak durumu değişikliklerini izle.',
      intent: WatchlistIntent.zoningChange,
      provenance: parcel.provenanceLabel,
      statusLabel: parcel.restricted ? 'Kısıtlı' : 'Aktif',
      nextAction: parcel.hasSourceUrl
          ? 'Kaynak atfını ve plan feature özetlerini kontrol et'
          : 'Kaynak kapsamı ekranından sağlayıcı durumunu izle',
      sourceName: parcel.sourceName,
      parcelLabel: '${parcel.block}/${parcel.parcel}',
    );
    state = [item, ...state];
  }

  void remove(String id) {
    state = state.where((item) => item.id != id).toList(growable: false);
  }
}

String _parcelWatchId(ParcelDetail parcel) =>
    'parcel:${parcel.city}:${parcel.district}:${parcel.neighborhood}:${parcel.block}:${parcel.parcel}'
        .toLowerCase();

const _seedItems = <WatchlistItem>[
  WatchlistItem(
    id: 'seed-aski',
    title: 'Askı değişikliği',
    subtitle: 'Seçili parselin plan notu veya askı durumu değişirse uyarı.',
    intent: WatchlistIntent.aski,
    provenance: 'metadata',
    statusLabel: 'Beklemede',
    nextAction: 'Parseli watchlist’e ekle',
  ),
  WatchlistItem(
    id: 'seed-zoning',
    title: 'İmar kararı güncellemesi',
    subtitle:
        'Plan notu ve kullanıma dair yeni kamu metadatası geldiğinde bildir.',
    intent: WatchlistIntent.zoningChange,
    provenance: 'public',
    statusLabel: 'Aktif',
    nextAction: 'Kaynak kapsama takibi yap',
  ),
  WatchlistItem(
    id: 'seed-provider-health',
    title: 'Sağlayıcı sağlık alarmı',
    subtitle:
        'Gateway veya GIS sağlayıcısı hazır değilse kullanıcıya temiz durum göster.',
    intent: WatchlistIntent.providerHealth,
    provenance: 'unavailable',
    statusLabel: 'Kural yüklü',
    nextAction: 'Kapsam ekranına bağla',
  ),
];
