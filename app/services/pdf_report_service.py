import os
import hashlib
import uuid
from typing import Dict, Optional, Any
from datetime import datetime
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
        """Templates are now created separately, so this is a no-op."""
        pass

    def _generate_report_hash(self, data: Dict[str, Any]) -> str:
        """Generate a hash for the report data for version tracking."""
        hash_input = str(sorted(data.items()))
        return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()[:16]

    def _generate_report_id(self) -> str:
        """Generate a unique report ID."""
        return f"eimar-report-{uuid.uuid4().hex[:8]}"

    async def generate_parcel_report(self, parcel_data: Dict,
                                     plan_data: Optional[Dict] = None,
                                     imar_data: Optional[Dict] = None,
                                     map_image: Optional[str] = None) -> bytes:
        """
        Generate a professional PDF parcel report.
        Returns PDF bytes.
        """
        if HTML is None:
            raise RuntimeError("weasyprint not installed. Install with: pip install weasyprint")

        report_id = self._generate_report_id()
        report_hash = self._generate_report_hash({
            "parcel": parcel_data,
            "plan": plan_data,
            "imar": imar_data
        })
        
        template = self.jinja_env.get_template("parcel_report.html")
        html_out = template.render(
            parcel=parcel_data,
            plan=plan_data,
            imar=imar_data,
            map_image=map_image,
            report_title="Parsel Raporu",
            report_id=report_id,
            report_hash=report_hash,
            report_date=datetime.now().strftime("%d.%m.%Y %H:%M")
        )
        pdf_bytes = HTML(string=html_out).write_pdf()
        return pdf_bytes

    async def generate_plan_report(self, plan_data: Dict) -> bytes:
        """Generate a plan report PDF."""
        if HTML is None:
            raise RuntimeError("weasyprint not installed")
            
        report_id = self._generate_report_id()
        report_hash = self._generate_report_hash({"plan": plan_data})
        
        template = self.jinja_env.get_template("plan_report.html")
        html_out = template.render(
            plan=plan_data,
            report_title="Plan Raporu",
            report_id=report_id,
            report_hash=report_hash,
            report_date=datetime.now().strftime("%d.%m.%Y %H:%M")
        )
        return HTML(string=html_out).write_pdf()

    async def generate_aski_report(self, plan_data: Dict, aski_data: Dict) -> bytes:
        """Generate an askı report PDF."""
        if HTML is None:
            raise RuntimeError("weasyprint not installed")
            
        report_id = self._generate_report_id()
        report_hash = self._generate_report_hash({
            "plan": plan_data,
            "aski": aski_data
        })
        
        template = self.jinja_env.get_template("aski_report.html")
        html_out = template.render(
            plan=plan_data,
            aski=aski_data,
            report_title="Askı Plan Raporu",
            report_id=report_id,
            report_hash=report_hash,
            report_date=datetime.now().strftime("%d.%m.%Y %H:%M")
        )
        return HTML(string=html_out).write_pdf()

    async def generate_combined_report(self, parcel_data: Dict,
                                       plan_data: Optional[Dict] = None,
                                       imar_data: Optional[Dict] = None,
                                       satellite_data: Optional[Dict] = None,
                                       map_image: Optional[str] = None) -> bytes:
        """Generate a combined report PDF with parcel, plan, imar, and satellite data."""
        if HTML is None:
            raise RuntimeError("weasyprint not installed")
            
        report_id = self._generate_report_id()
        report_hash = self._generate_report_hash({
            "parcel": parcel_data,
            "plan": plan_data,
            "imar": imar_data,
            "satellite": satellite_data
        })
        
        template = self.jinja_env.get_template("combined_report.html")
        html_out = template.render(
            parcel=parcel_data,
            plan=plan_data,
            imar=imar_data,
            satellite=satellite_data,
            map_image=map_image,
            report_title="Birleşik Rapor",
            report_id=report_id,
            report_hash=report_hash,
            report_date=datetime.now().strftime("%d.%m.%Y %H:%M")
        )
        return HTML(string=html_out).write_pdf()