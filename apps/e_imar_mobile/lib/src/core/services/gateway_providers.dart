import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/map/domain/parcel.dart';
import 'gateway_api.dart';

final gatewayHealthProvider = FutureProvider<GatewayHealth>((ref) {
  return ref.watch(gatewayApiProvider).health();
});

final gatewayProvidersProvider = FutureProvider<List<ProviderDescriptor>>((ref) {
  return ref.watch(gatewayApiProvider).providers();
});

