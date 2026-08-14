import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

_TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
_env = Environment(loader=FileSystemLoader(_TEMPLATE_DIR))


def generate_report_pdf(record: dict) -> bytes:
    template = _env.get_template("report_template.html")
    html_content = template.render(
        record=record,
        generated_at=datetime.utcnow().strftime("%d %b %Y, %H:%M UTC"),
    )
    return HTML(string=html_content).write_pdf()
