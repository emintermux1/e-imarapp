class EmsalInput {
  const EmsalInput(
      {required this.landArea,
      required this.emsal,
      this.taks,
      this.floorCount,
      this.averageUnitArea = 115});
  final double landArea;
  final double emsal;
  final double? taks;
  final int? floorCount;
  final double averageUnitArea;
}

class EmsalResult {
  const EmsalResult(
      {required this.totalConstructionArea,
      required this.apartmentCount,
      required this.estimatedCost,
      required this.salesPotential,
      required this.roi});
  final double totalConstructionArea;
  final int apartmentCount;
  final double estimatedCost;
  final double salesPotential;
  final double roi;
}

class EmsalCalculatorService {
  const EmsalCalculatorService();

  EmsalResult calculate(EmsalInput input) {
    final total = input.landArea * input.emsal;
    final apartments = (total / input.averageUnitArea).floor().clamp(1, 10000);
    final costPerSqm = 18500.0;
    final salePerSqm = 38500.0;
    final cost = total * costPerSqm;
    final sales = total * salePerSqm;
    return EmsalResult(
        totalConstructionArea: total,
        apartmentCount: apartments,
        estimatedCost: cost,
        salesPotential: sales,
        roi: ((sales - cost) / cost) * 100);
  }
}
