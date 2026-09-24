from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "livestock_surveillance",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "check-weather-alerts": {
            "task": "app.tasks.celery_tasks.check_weather_alerts",
            "schedule": 3600.0,
        },
        "generate-daily-report": {
            "task": "app.tasks.celery_tasks.generate_daily_report",
            "schedule": 86400.0,
        },
        "send-vaccination-reminders": {
            "task": "app.tasks.celery_tasks.send_vaccination_reminders",
            "schedule": 86400.0,
        },
        "monitor-outbreak-trends": {
            "task": "app.tasks.celery_tasks.monitor_outbreak_trends",
            "schedule": 7200.0,
        },
        "cleanup-expired-alerts": {
            "task": "app.tasks.celery_tasks.cleanup_expired_alerts",
            "schedule": 3600.0,
        },
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
