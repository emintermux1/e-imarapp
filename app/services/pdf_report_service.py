import weasyprint
from jinja2 import Template
from app.models.parcel import Parcel
from app.models.plan import Plan
from sqlalchemy.ext.asyncio import AsyncSession

class PDFReportService:
    def __init__(self):
        # Initialize WeasyPrint
        pass
    
    async def generate_report(self, parcel_id: int = None, plan_id: int = None, db: AsyncSession = None):
        """
        Generate a PDF report for a parcel or plan.
        """
        # Fetch data from database
        data = {}
        if parcel_id:
            result = await db.execute(f"SELECT * FROM parcels WHERE id = {parcel_id}")
            parcel = result.fetchone()
            data['parcel'] = parcel
            
        if plan_id:
            result = await db.execute(f"SELECT * FROM plans WHERE id = {plan_id}")
            plan = result.fetchone()
            data['plan'] = plan
        
        # Render template with data
        template = Template("""
        <html>
        <head>
            <title>eImarTR Report</title>
        </head>
        <body>
            <h1>eImarTR Report</h1>
            {% if parcel %}
            <h2>Parcel Information</h2>
            <p>Province: {{ parcel.province }}</p>
            <p>District: {{ parcel.district }}</p>
            <p>Municipality: {{ parcel.municipality }}</p>
            <p>Ada: {{ parcel.ada }}</p>
            <p>Parsel: {{ parcel.parsel }}</p>
            {% endif %}
            
            {% if plan %}
            <h2>Plan Information</h2>
            <p>Plan Type: {{ plan.plan_type }}</p>
            <p>Status: {{ plan.status }}</p>
            {% endif %}
        </body>
        </html>
        """)
        
        html_content = template.render(data)
        
        # Generate PDF
        pdf = weasyprint.HTML(string=html_content).write_pdf()
        
        # Save PDF to file or return as bytes
        # For now, we'll just return a success message
        return {"status": "PDF generated successfully", "data": data}