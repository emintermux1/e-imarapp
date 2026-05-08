from celery import Celery
from app.config import settings

# Initialize Celery
celery_app = Celery("eimar")

# Configure Celery
celery_app.conf.update(
    broker_url=settings.REDIS_URL,
    result_backend=settings.REDIS_URL,
    timezone="Europe/Istanbul",
    enable_utc=True,
    beat_schedule={
        "discover-all-municipalities-every-7-days": {
            "task": "app.tasks.discovery_task.batch_discover_municipalities",
            "schedule": 60 * 60 * 24 * 7,
            "args": (None, 500),
        }
    },
)

# Import tasks to register them
from app.tasks import discovery_task, ingestion_task, notification_task