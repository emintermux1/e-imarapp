class ApartmentTypeMix {
  const ApartmentTypeMix({required this.label, required this.areaSqm, this.count = 0, this.salePricePerSqm = 38500});
  final String label;
  final double areaSqm;
  final int count;
  final double salePricePerSqm;

  double get totalArea => count * areaSqm;
  double get totalSales => totalArea * salePricePerSqm;
}

class FloorBlueprint {
  const FloorBlueprint({required this.floorNumber, this.apartmentMixes = const []});
  final int floorNumber;
  final List<ApartmentTypeMix> apartmentMixes;

  int get totalUnits => apartmentMixes.fold(0, (sum, m) => sum + m.count);
  double get totalArea => apartmentMixes.fold(0.0, (sum, m) => sum + m.totalArea);
}

class EmsalInput {
  const EmsalInput({required this.landArea, required this.emsal, this.taks, this.floorCount, this.averageUnitArea = 115, this.blueprints = const []});
  final double landArea;
  final double emsal;
  final double? taks;
  final int? floorCount;
  final double averageUnitArea;
  final List<FloorBlueprint> blueprints;
}

class FloorBreakdown {
  const FloorBreakdown({required this.floorNumber, required this.constructionArea, required this.unitCount, required this.estimatedCost, required this.salesPotential, this.apartmentMixes = const []});
  final int floorNumber;
  final double constructionArea;
  final int unitCount;
  final double estimatedCost;
  final double salesPotential;
  final List<ApartmentTypeMix> apartmentMixes;
}

class EmsalResult {
  const EmsalResult({required this.totalConstructionArea, required this.apartmentCount, required this.estimatedCost, required this.salesPotential, required this.roi, this.tabanAlani, this.floorBreakdowns = const []});
  final double totalConstructionArea;
  final int apartmentCount;
  final double estimatedCost;
  final double salesPotential;
  final double roi;
  final double? tabanAlani;
  final List<FloorBreakdown> floorBreakdowns;
}

class EmsalCalculatorService {
  const EmsalCalculatorService();

  static const double costPerSqm = 18500.0;
  static const double salePerSqm = 38500.0;

  double resolveTabanAlani(EmsalInput input) {
    if (input.taks == null) return 0;
    return input.landArea * input.taks!;
  }

  int resolveFloorCount(EmsalInput input) {
    if (input.floorCount != null && input.floorCount! > 0) return input.floorCount!;
    if (input.taks == null || input.taks! <= 0) return 1;
    final taban = input.landArea * input.taks!;
    final total = input.landArea * input.emsal;
    if (taban <= 0) return 1;
    return (total / taban).ceil().clamp(1, 100);
  }

  EmsalResult calculate(EmsalInput input) {
    final total = input.landArea * input.emsal;
    final taban = input.taks != null ? input.landArea * input.taks! : null;
    final floors = resolveFloorCount(input);
    final perFloorArea = floors > 0 ? total / floors : total;

    final bool useBlueprints = input.blueprints.isNotEmpty;
    int totalUnits = 0;
    double blueprintSales = 0;
    final List<FloorBreakdown> breakdowns = [];

    if (useBlueprints) {
      for (final bp in input.blueprints) {
        final floorCost = perFloorArea * costPerSqm;
        final floorSales = bp.apartmentMixes.fold(0.0, (sum, m) => sum + m.totalSales);
        breakdowns.add(FloorBreakdown(
          floorNumber: bp.floorNumber,
          constructionArea: perFloorArea,
          unitCount: bp.totalUnits,
          estimatedCost: floorCost,
          salesPotential: floorSales,
          apartmentMixes: bp.apartmentMixes,
        ));
        totalUnits += bp.totalUnits;
        blueprintSales += floorSales;
      }
    } else {
      for (int f = 1; f <= floors; f++) {
        final floorUnits = (perFloorArea / input.averageUnitArea).floor().clamp(1, 10000);
        final floorCost = perFloorArea * costPerSqm;
        final floorSales = perFloorArea * salePerSqm;
        breakdowns.add(FloorBreakdown(
          floorNumber: f,
          constructionArea: perFloorArea,
          unitCount: floorUnits,
          estimatedCost: floorCost,
          salesPotential: floorSales,
        ));
        totalUnits += floorUnits;
      }
    }

    final apartments = totalUnits > 0 ? totalUnits : (total / input.averageUnitArea).floor().clamp(1, 10000);
    final cost = total * costPerSqm;
    final sales = useBlueprints ? blueprintSales : total * salePerSqm;

    return EmsalResult(
      totalConstructionArea: total,
      apartmentCount: apartments,
      estimatedCost: cost,
      salesPotential: sales,
      roi: ((sales - cost) / cost) * 100,
      tabanAlani: taban,
      floorBreakdowns: breakdowns,
    );
  }
}
