from fastapi import APIRouter

from app.api.v1.endpoints import (
    alerts,
    animals,
    auth,
    dashboard,
    diseases,
    lab_samples,
    outbreaks,
    symptom_reports,
    vaccinations,
    weather,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(animals.router, prefix="/animals", tags=["Animals"])
api_router.include_router(symptom_reports.router, prefix="/symptom-reports", tags=["Symptom Reports"])
api_router.include_router(diseases.router, prefix="/diseases", tags=["Diseases"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(vaccinations.router, prefix="/vaccinations", tags=["Vaccinations"])
api_router.include_router(lab_samples.router, prefix="/lab-samples", tags=["Lab Samples"])
api_router.include_router(outbreaks.router, prefix="/outbreaks", tags=["Outbreaks"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather"])
