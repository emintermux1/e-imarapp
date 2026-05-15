import 'package:e_imar_mobile/src/app/app.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('mobile shell opens with search and primary actions',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 1200));
    await tester.pumpWidget(const ProviderScope(child: EImarApp()));

    expect(find.text('Parsel sorgulamak için'), findsOneWidget);
    expect(find.text('Favoriye Ekle'), findsOneWidget);
    expect(find.text('PDF'), findsOneWidget);
  });

  testWidgets('quick map action switches to workspace tab', (tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 1200));
    await tester.pumpWidget(const ProviderScope(child: EImarApp()));

    await tester.tap(find.text('Ara'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Haritadan sorgula'));
    await tester.pumpAndSettle();

    expect(find.text('Parsel sorgulamak için'), findsOneWidget);
    expect(find.text('Katmanlar'), findsWidgets);
  });

  testWidgets('invalid coordinates render an honest error state',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 1200));
    await tester.pumpWidget(const ProviderScope(child: EImarApp()));

    await tester.tap(find.text('Ara'));
    await tester.pumpAndSettle();

    await tester.enterText(find.widgetWithText(TextField, 'Enlem'), 'abc');
    await tester.enterText(find.widgetWithText(TextField, 'Boylam'), '29.0');
    await tester.ensureVisible(find.text('Sorgula'));
    await tester.tap(find.text('Sorgula'));
    await tester.pump();

    expect(find.text('Koordinat formatı geçersiz'), findsOneWidget);
  });
}
