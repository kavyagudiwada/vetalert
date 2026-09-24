import logging
from datetime import datetime, timedelta

from celery import shared_task
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database import async_session_factory
from app.models.alert import Alert
from app.models.vaccination import Vaccination
from app.models.outbreak import Outbreak

logger = logging.getLogger(__name__)
settings = get_settings()


@shared_task
def check_weather_alerts() -> dict:
    async def _run() -> dict:
        async with async_session_factory() as session:
            alerts = []
            result = await session.execute(
                select(Alert).where(
                    Alert.alert_type == "weather_advisory",
                    Alert.is_active.is_(True),
                )
            )
            alerts = list(result.scalars().all())
            return {"active_weather_alerts": len(alerts)}

    try:
        from asyncio import run
        return run(_run())
    except Exception as e:
        logger.error(f"check_weather_alerts failed: {e}")
        return {"error": str(e)}


@shared_task
def generate_daily_report() -> dict:
    async def _run() -> dict:
        async with async_session_factory() as session:
            today = datetime.utcnow().date()
            yesterday_start = datetime.combine(today - timedelta(days=1), datetime.min.time())
            today_start = datetime.combine(today, datetime.min.time())

            from app.models.symptom_report import SymptomReport

            reports_result = await session.execute(
                select(SymptomReport).where(SymptomReport.created_at >= yesterday_start)
            )
            new_reports = list(reports_result.scalars().all())

            outbreaks_result = await session.execute(
                select(Outbreak).where(Outbreak.created_at >= today_start)
            )
            new_outbreaks = list(outbreaks_result.scalars().all())

            return {
                "date": str(today),
                "new_reports": len(new_reports),
                "new_outbreaks": len(new_outbreaks),
            }

    try:
        from asyncio import run
        return run(_run())
    except Exception as e:
        logger.error(f"generate_daily_report failed: {e}")
        return {"error": str(e)}


@shared_task
def send_vaccination_reminders() -> dict:
    async def _run() -> dict:
        async with async_session_factory() as session:
            today = datetime.utcnow()
            reminder_window_end = today + timedelta(days=7)

            result = await session.execute(
                select(Vaccination).where(
                    Vaccination.status == "scheduled",
                    Vaccination.next_due_date.isnot(None),
                    Vaccination.next_due_date <= reminder_window_end,
                )
            )
            reminders = list(result.scalars().all())

            return {
                "reminders_sent": len(reminders),
                "due_animals": [r.animal_id for r in reminders[:50]],
            }

    try:
        from asyncio import run
        return run(_run())
    except Exception as e:
        logger.error(f"send_vaccination_reminders failed: {e}")
        return {"error": str(e)}


@shared_task
def monitor_outbreak_trends() -> dict:
    async def _run() -> dict:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Outbreak).where(
                    Outbreak.status.in_(["suspected", "confirmed"])
                )
            )
            active_outbreaks = list(result.scalars().all())

            high_risk = [
                o.id for o in active_outbreaks
                if o.risk_level in ("high", "critical")
            ]

            disease_counts = {}
            for o in active_outbreaks:
                disease_counts[o.disease_id] = disease_counts.get(o.disease_id, 0) + 1

            return {
                "active_outbreaks": len(active_outbreaks),
                "high_risk_outbreaks": len(high_risk),
                "disease_distribution": disease_counts,
            }

    try:
        from asyncio import run
        return run(_run())
    except Exception as e:
        logger.error(f"monitor_outbreak_trends failed: {e}")
        return {"error": str(e)}


@shared_task
def cleanup_expired_alerts() -> dict:
    async def _run() -> dict:
        async with async_session_factory() as session:
            now = datetime.utcnow()

            result = await session.execute(
                select(Alert.id).where(
                    Alert.expires_at.isnot(None),
                    Alert.expires_at < now,
                    Alert.is_active.is_(True),
                )
            )
            expired_ids = [row[0] for row in result.all()]

            if expired_ids:
                await session.execute(
                    delete(Alert).where(Alert.id.in_(expired_ids))
                )
                await session.commit()

            return {"cleaned_alerts": len(expired_ids)}

    try:
        from asyncio import run
        return run(_run())
    except Exception as e:
        logger.error(f"cleanup_expired_alerts failed: {e}")
        return {"error": str(e)}
