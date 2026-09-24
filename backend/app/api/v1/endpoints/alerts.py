from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.user import User, UserRole
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.notification import broadcast_alert

router = APIRouter()


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.govt_officer, UserRole.admin)),
) -> AlertResponse:
    try:
        alert_type = AlertType(alert_data.alert_type)
        severity = AlertSeverity(alert_data.severity)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid alert type or severity")

    alert = Alert(
        title=alert_data.title,
        message=alert_data.message,
        alert_type=alert_type,
        severity=severity,
        district=alert_data.district,
        block=alert_data.block,
        village=alert_data.village,
        target_audience=alert_data.target_audience,
        created_by=current_user.id,
        expires_at=alert_data.expires_at,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    await broadcast_alert(
        title=alert.title,
        message=alert.message,
        severity=alert.severity.value,
        alert_type=alert.alert_type.value,
        district=alert.district,
        block=alert.block,
        village=alert.village,
        target_audience=alert.target_audience,
    )

    return AlertResponse.model_validate(alert)


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    alert_type: str | None = None,
    severity: str | None = None,
    district: str | None = None,
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AlertResponse]:
    query = select(Alert).order_by(Alert.created_at.desc())
    if active_only:
        query = query.where(Alert.is_active.is_(True))
    if alert_type:
        query = query.where(Alert.alert_type == alert_type)
    if severity:
        query = query.where(Alert.severity == severity)
    if district:
        query = query.where(Alert.district == district)

    result = await db.execute(query)
    alerts = list(result.scalars().all())
    return [AlertResponse.model_validate(a) for a in alerts]


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AlertResponse:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return AlertResponse.model_validate(alert)


@router.post("/{alert_id}/deactivate", response_model=AlertResponse)
async def deactivate_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.govt_officer, UserRole.admin)),
) -> AlertResponse:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.is_active = False
    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)
