import os
from typing import Dict, Optional
from jinja2 import Environment, FileSystemLoader

try:
    from weasyprint import HTML
except ImportError:
    HTML = None

class PDFReportService:
    """
    WeasyPrint + Jinja2 ile profesyonel PDF rapor üretimi.
    Şablonlar: templates/ dizini altında.
    """
    def __init__(self):
        self.template_dir = os.path.join(os.path.dirname(__file__), "../../templates")
        os.makedirs(self.template_dir, exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(self.template_dir))

    def _ensure_templates(self):
        """Create default templates if they don't exist."""
        parcel_template = os.path.join(self.template_dir, "parcel_report.html")
        if not os.path.exists(parcel_template):
            with open(parcel_template, "w", encoding="utf-8") as f:
                f.write(PARCEL_REPORT_TEMPLATE)

    async def generate_parcel_report(self, parcel_data: Dict,
                                     plan_data: Optional[Dict] = None,
                                     imar_data: Optional[Dict] = None) -> bytes:
        """
        Generate a professional PDF parcel report.
        Returns PDF bytes.
        """
        self._ensure_templates()
        if HTML is None:
            raise RuntimeError("weasyprint not installed. Install with: pip install weasyprint")

        template = self.jinja_env.get_template("parcel_report.html")
        html_out = template.render(
            parcel=parcel_data,
            plan=plan_data,
            imar=imar_data,
            report_title="Parsel Raporu",
            report_date="{{ now }}",
        )
        pdf_bytes = HTML(string=html_out).write_pdf()
        return pdf_bytes

    async def generate_plan_report(self, plan_data: Dict) -> bytes:
        """Generate a plan report PDF."""
        self._ensure_templates()
        if HTML is None:
            raise RuntimeError("weasyprint not installed")
        template = self.jinja_env.get_template("parcel_report.html")
        html_out = template.render(parcel={}, plan=plan_data, imar={}, report_title="Plan Raporu")
        return HTML(string=html_out).write_pdf()

PARCEL_REPORT_TEMPLATE = '''
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>{{ report_title }}</title>
<style>
body { font-family: "DejaVu Sans", Arial, sans-serif; margin: 40px; color: #333; }
h1 { color: #1a5276; border-bottom: 3px solid #1a5276; padding-bottom: 10px; }
h2 { color: #2874a6; margin-top: 30px; }
table { width: 100%; border-collapse: collapse; margin-top: 15px; }
th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
th { background: #1a5276; color: white; }
.footer { margin-top: 40px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
.stamp { margin-top: 20px; padding: 15px; border: 2px dashed #1a5276; color: #1a5276; font-weight: bold; text-align: center; }
</style>
</head>
<body>
<h1>{{ report_title }} — eImarTR</h1>
<p><strong>Tarih:</strong> {{ report_date }}<br>
<strong>Rapor ID:</strong> eimar-report-{{ parcel.ada | default('N/A') }}-{{ parcel.parsel | default('N/A') }}</p>

<h2>Parsel Bilgileri</h2>
<table>
<tr><th>Alan</th><th>Değer</th></tr>
<tr><td>Ada</td><td>{{ parcel.ada | default('Bilinmiyor') }}</td></tr>
<tr><td>Parsel</td><td>{{ parcel.parsel | default('Bilinmiyor') }}</td></tr>
<tr><td>İl</td><td>{{ parcel.il | default('Bilinmiyor') }}</td></tr>
<tr><td>İlçe</td><td>{{ parcel.ilce | default('Bilinmiyor') }}</td></tr>
<tr><td>Mahalle</td><td>{{ parcel.mahalle | default('Bilinmiyor') }}</td></tr>
<tr><td>Nitelik</td><td>{{ parcel.nitelik | default('Bilinmiyor') }}</td></tr>
<tr><td>Alan (m²)</td><td>{{ parcel.alan_m2 | default('Bilinmiyor') }}</td></tr>
<tr><td>Tapu Durumu</td><td>{{ parcel.tapu_durumu | default('Bilinmiyor') }}</td></tr>
<tr><td>Pafta</td><td>{{ parcel.pafta | default('Bilinmiyor') }}</td></tr>
</table>

{% if imar %}
<h2>İmar Durumu</h2>
<table>
<tr><th>Alan</th><th>Değer</th></tr>
<tr><td>Plan Türü</td><td>{{ imar.plan_turu | default('Bilinmiyor') }}</td></tr>
<tr><td>TAKS</td><td>{{ imar.taks | default('Bilinmiyor') }}</td></tr>
<tr><td>KAKS</td><td>{{ imar.kaks | default('Bilinmiyor') }}</td></tr>
<tr><td>Hmax</td><td>{{ imar.h_max | default('Bilinmiyor') }}</td></tr>
<tr><td>Gabari</td><td>{{ imar.gabari | default('Bilinmiyor') }}</td></tr>
<tr><td>Kullanım Amacı</td><td>{{ imar.kullanim_amaci | default('Bilinmiyor') }}</td></tr>
</table>
{% endif %}

<div class="stamp">
Bu rapor eImarTR Ulusal E-İmar Platformu tarafından otomatik üretilmiştir.<br>
Noter / Banka / Mimar uyumlu standart rapor formatı.
</div>

<div class="footer">
eImarTR — Türkiye Ulusal e-İmar Platformu | Veri kaynakları: TKGM, e-Plan, TUCBS<br>
Bu rapor bilgilendirme amaçlıdır; resmi işlemler için ilgili kurumlara başvurunuz.
</div>
</body>
</html>
'''
