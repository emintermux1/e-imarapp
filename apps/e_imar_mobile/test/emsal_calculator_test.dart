import 'package:flutter_test/flutter_test.dart';
import 'package:e_imar_mobile/src/features/emsal/domain/emsal_calculator.dart';

void main() {
  test('5000m2 and E 1.5 calculates expected potential', () {
    final result = const EmsalCalculatorService()
        .calculate(const EmsalInput(landArea: 5000, emsal: 1.5));
    expect(result.totalConstructionArea, 7500);
    expect(result.apartmentCount, 65);
    expect(result.roi, greaterThan(100));
  });
}
