import 'dart:typed_data';

import 'package:pdf/widgets.dart' as pw;
import 'package:syncfusion_flutter_pdf/pdf.dart' as sf;

abstract interface class ParcelReportService {
  Future<Uint8List> generateParcelReport({required String parcelTitle, required Map<String, Object?> metrics});
}

class PlaceholderParcelReportService implements ParcelReportService {
  const PlaceholderParcelReportService();

  @override
  Future<Uint8List> generateParcelReport({required String parcelTitle, required Map<String, Object?> metrics}) async {
    final doc = pw.Document();
    doc.addPage(pw.Page(build: (context) => pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [pw.Text('E-İmar Parsel Raporu'), pw.Text(parcelTitle), for (final entry in metrics.entries) pw.Text('${entry.key}: ${entry.value}')])));
    return doc.save();
  }
}

class SyncfusionReportTemplateProbe {
  const SyncfusionReportTemplateProbe();
  sf.PdfDocument createEmptyDocument() => sf.PdfDocument();
}
