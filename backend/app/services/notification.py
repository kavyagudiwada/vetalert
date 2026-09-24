import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


async def send_sms(phone_number: str, message: str) -> bool:
    try:
        logger.info(f"SMS would be sent to {phone_number}: {message[:50]}...")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone_number}: {e}")
        return False


async def send_push(user_id: int, title: str, body: str, data: Optional[dict] = None) -> bool:
    try:
        logger.info(f"Push notification would be sent to user {user_id}: {title}")
        return True
    except Exception as e:
        logger.error(f"Failed to send push to user {user_id}: {e}")
        return False


async def send_alert(
    title: str,
    message: str,
    severity: str = "medium",
    alert_type: str = "general",
    target_users: Optional[list[int]] = None,
    target_phones: Optional[list[str]] = None,
) -> dict:
    results = {"sms": [], "push": []}

    if target_phones:
        for phone in target_phones:
            ok = await send_sms(phone, f"[{severity.upper()}] {title}: {message}")
            results["sms"].append({"phone": phone, "success": ok})

    if target_users:
        for user_id in target_users:
            ok = await send_push(user_id, title, message, {"type": alert_type, "severity": severity})
            results["push"].append({"user_id": user_id, "success": ok})

    return results


async def broadcast_alert(
    title: str,
    message: str,
    severity: str = "medium",
    alert_type: str = "general",
    district: Optional[str] = None,
    block: Optional[str] = None,
    village: Optional[str] = None,
    target_audience: Optional[list[str]] = None,
    user_dir: Optional[dict[int, dict]] = None,
) -> dict:
    if user_dir is None:
        user_dir = {}

    recipients = []
    for user_id, profile in user_dir.items():
        matches = True

        if district and profile.get("district"):
            if profile["district"] != district:
                matches = False

        if block and profile.get("block") and matches:
            if profile["block"] != block:
                matches = False

        if village and profile.get("village") and matches:
            if profile["village"] != village:
                matches = False

        if target_audience and matches:
            if profile.get("role") not in target_audience:
                matches = False

        if matches:
            recipients.append({"user_id": user_id, "phone": profile.get("phone")})

    target_user_ids = [r["user_id"] for r in recipients]
    target_phones = [r["phone"] for r in recipients if r.get("phone")]

    results = await send_alert(
        title=title,
        message=message,
        severity=severity,
        alert_type=alert_type,
        target_users=target_user_ids,
        target_phones=target_phones,
    )

    return {
        "recipients": len(recipients),
        "results": results,
    }
