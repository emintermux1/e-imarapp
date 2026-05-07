import 'package:flutter/material.dart';

import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/study_request.dart';

class StudyRequestScreen extends StatefulWidget {
  const StudyRequestScreen({super.key});

  @override
  State<StudyRequestScreen> createState() => _StudyRequestScreenState();
}

class _StudyRequestScreenState extends State<StudyRequestScreen> {
  int _step = 0;

  final deliveryController =
      TextEditingController(text: StudyRequest.deliveryOptions.first);
  final cityController = TextEditingController();
  final districtController = TextEditingController();
  final adaController = TextEditingController();
  final parselController = TextEditingController();
  final areaController = TextEditingController();
  final descController = TextEditingController();

  String? _deliveryError;
  String? _cityError;
  String? _districtError;
  String? _adaError;
  String? _parselError;
  String? _areaError;
  String? _descError;

  @override
  void dispose() {
    deliveryController.dispose();
    cityController.dispose();
    districtController.dispose();
    adaController.dispose();
    parselController.dispose();
    areaController.dispose();
    descController.dispose();
    super.dispose();
  }

  bool _validateStep0() {
    bool ok = true;
    setState(() {
      _deliveryError =
          deliveryController.text.isEmpty ? 'Teslim süresi seçiniz' : null;
      _cityError = cityController.text.trim().isEmpty ? 'İl giriniz' : null;
      if (_cityError != null) ok = false;
      _districtError =
          districtController.text.trim().isEmpty ? 'İlçe giriniz' : null;
      if (_districtError != null) ok = false;
      final areaVal = double.tryParse(areaController.text.replaceAll(',', '.'));
      _areaError = (areaVal == null || areaVal <= 0)
          ? 'Geçerli arsa alanı giriniz'
          : null;
      if (_areaError != null) ok = false;
    });
    return ok;
  }

  bool _validateStep1() {
    bool ok = true;
    setState(() {
      _adaError = adaController.text.trim().isEmpty ? 'Ada giriniz' : null;
      if (_adaError != null) ok = false;
      _parselError =
          parselController.text.trim().isEmpty ? 'Parsel giriniz' : null;
      if (_parselError != null) ok = false;
      _descError =
          descController.text.trim().isEmpty ? 'Açıklama giriniz' : null;
      if (_descError != null) ok = false;
    });
    return ok;
  }

  void _nextStep() {
    if (_step == 0) {
      if (!_validateStep0()) return;
    } else if (_step == 1) {
      if (!_validateStep1()) return;
    }
    if (_step < 2) {
      setState(() => _step++);
    }
  }

  void _prevStep() {
    if (_step > 0) setState(() => _step--);
  }

  StudyRequest _buildRequest() {
    return StudyRequest(
      deliveryTime: deliveryController.text,
      city: cityController.text.trim(),
      district: districtController.text.trim(),
      ada: adaController.text.trim(),
      parsel: parselController.text.trim(),
      landArea: double.tryParse(areaController.text.replaceAll(',', '.')) ?? 0,
      description: descController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Etüt Hazırlama'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: _StepIndicator(current: _step),
        ),
      ),
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: Theme.of(context).brightness == Brightness.dark
              ? null
              : AppGradients.sandSurface,
        ),
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: _step == 0
                    ? _Step0Form(
                        deliveryController: deliveryController,
                        cityController: cityController,
                        districtController: districtController,
                        areaController: areaController,
                        deliveryError: _deliveryError,
                        cityError: _cityError,
                        districtError: _districtError,
                        areaError: _areaError,
                      )
                    : _step == 1
                        ? _Step1Form(
                            adaController: adaController,
                            parselController: parselController,
                            descController: descController,
                            adaError: _adaError,
                            parselError: _parselError,
                            descError: _descError,
                          )
                        : _Step2Review(request: _buildRequest()),
              ),
            ),
            _BottomBar(
              step: _step,
              onPrev: _prevStep,
              onNext: _nextStep,
            ),
          ],
        ),
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.current});
  final int current;

  static const labels = ['Bilgiler', 'Detay', 'Onay'];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      child: Row(
        children: List.generate(labels.length, (i) {
          final active = i <= current;
          final isLast = i == labels.length - 1;
          return Expanded(
            child: Row(
              children: [
                _StepDot(label: labels[i], index: i + 1, active: active),
                if (!isLast)
                  Expanded(
                    child: Container(
                      height: 3,
                      margin: const EdgeInsets.symmetric(horizontal: 6),
                      decoration: BoxDecoration(
                        color: i < current
                            ? AppColors.emerald
                            : AppColors.outlineLight,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot(
      {required this.label, required this.index, required this.active});
  final String label;
  final int index;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            gradient: active ? AppGradients.premium : null,
            color: active ? null : AppColors.outlineLight,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: active
                ? Text(
                    '$index',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                  )
                : Text(
                    '$index',
                    style: Theme.of(context)
                        .textTheme
                        .labelLarge
                        ?.copyWith(color: AppColors.slate),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: active ? AppColors.emerald : AppColors.slate,
                fontWeight: FontWeight.w700,
              ),
        ),
      ],
    );
  }
}

class _Step0Form extends StatelessWidget {
  const _Step0Form({
    required this.deliveryController,
    required this.cityController,
    required this.districtController,
    required this.areaController,
    this.deliveryError,
    this.cityError,
    this.districtError,
    this.areaError,
  });

  final TextEditingController deliveryController;
  final TextEditingController cityController;
  final TextEditingController districtController;
  final TextEditingController areaController;
  final String? deliveryError;
  final String? cityError;
  final String? districtError;
  final String? areaError;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PremiumHeader(
            title: 'Etüt Talebi',
            subtitle: 'Teslim süresi, konum ve arsa bilgilerini giriniz.',
            icon: Icons.edit_note_rounded,
            badge: 'Adım 1 / 3',
          ),
          const SizedBox(height: 20),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Teslim Süresi',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                AppSegmentedControl<String>(
                  values: StudyRequest.deliveryOptions,
                  selected: deliveryController.text,
                  labelBuilder: (v) => v,
                  onChanged: (v) => deliveryController.text = v,
                ),
                if (deliveryError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(deliveryError!,
                        style:
                            TextStyle(color: AppColors.danger, fontSize: 12)),
                  ),
                const SizedBox(height: 18),
                Text(
                  'Konum Bilgileri',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: cityController,
                        decoration: InputDecoration(
                          labelText: 'İl',
                          prefixIcon: const Icon(Icons.location_city_rounded),
                          errorText: cityError,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: districtController,
                        decoration: InputDecoration(
                          labelText: 'İlçe',
                          prefixIcon: const Icon(Icons.map_rounded),
                          errorText: districtError,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  'Arsa Bilgisi',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: areaController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Arsa Alanı',
                    suffixText: 'm²',
                    prefixIcon: const Icon(Icons.square_foot_rounded),
                    errorText: areaError,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
}

class _Step1Form extends StatelessWidget {
  const _Step1Form({
    required this.adaController,
    required this.parselController,
    required this.descController,
    this.adaError,
    this.parselError,
    this.descError,
  });

  final TextEditingController adaController;
  final TextEditingController parselController;
  final TextEditingController descController;
  final String? adaError;
  final String? parselError;
  final String? descError;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PremiumHeader(
            title: 'Parsel Detayları',
            subtitle: 'Ada/parsel bilgileri ve talep açıklaması ekleyiniz.',
            icon: Icons.pin_drop_rounded,
            badge: 'Adım 2 / 3',
          ),
          const SizedBox(height: 20),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ada / Parsel',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: adaController,
                        decoration: InputDecoration(
                          labelText: 'Ada',
                          prefixIcon: const Icon(Icons.numbers_rounded),
                          errorText: adaError,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: parselController,
                        decoration: InputDecoration(
                          labelText: 'Parsel',
                          prefixIcon: const Icon(Icons.tag_rounded),
                          errorText: parselError,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  'Açıklama',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    labelText: 'Talep açıklaması',
                    hintText:
                        'İmar durumu, yapılaşma koşulları, fizibilite beklentileri...',
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(bottom: 64),
                      child: Icon(Icons.description_rounded),
                    ),
                    errorText: descError,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
}

class _Step2Review extends StatelessWidget {
  const _Step2Review({required this.request});
  final StudyRequest request;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PremiumHeader(
            title: 'Talep Özeti',
            subtitle: 'Bilgileri kontrol edip onaylayınız.',
            icon: Icons.checklist_rounded,
            badge: 'Adım 3 / 3',
          ),
          const SizedBox(height: 20),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SummaryRow(
                    label: 'Teslim Süresi', value: request.deliveryTime),
                const Divider(height: 22),
                _SummaryRow(label: 'İl', value: request.city),
                const SizedBox(height: 10),
                _SummaryRow(label: 'İlçe', value: request.district),
                const Divider(height: 22),
                _SummaryRow(
                    label: 'Ada / Parsel',
                    value: '${request.ada} / ${request.parsel}'),
                const SizedBox(height: 10),
                _SummaryRow(
                    label: 'Arsa Alanı',
                    value: '${request.landArea.toStringAsFixed(0)} m²'),
                const Divider(height: 22),
                _SummaryRow(label: 'Açıklama', value: request.description),
              ],
            ),
          ),
          const SizedBox(height: 20),
          GlassCard(
            variant: GlassVariant.elevated,
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline_rounded,
                    color: AppColors.info, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Talebiniz incelendikten sonra danışmanlarımız en kısa sürede size dönüş yapacaktır. Bu bir ön talep olup bağlayıcı değildir.',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.slate, height: 1.35),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.slate, fontWeight: FontWeight.w700)),
          ),
          Expanded(
            child: Text(value,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w800)),
          ),
        ],
      );
}

class _BottomBar extends StatelessWidget {
  const _BottomBar(
      {required this.step, required this.onPrev, required this.onNext});
  final int step;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: AppShadows.soft(Colors.black),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          child: Row(
            children: [
              if (step > 0)
                GradientButton(
                  label: 'Geri',
                  icon: Icons.arrow_back_rounded,
                  onPressed: onPrev,
                ),
              const Spacer(),
              GradientButton(
                label: step == 2 ? 'Onayla ve Gönder' : 'Devam',
                icon: step == 2
                    ? Icons.send_rounded
                    : Icons.arrow_forward_rounded,
                onPressed: onNext,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
