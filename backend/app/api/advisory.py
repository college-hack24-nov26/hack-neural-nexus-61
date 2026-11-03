from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.sensor import SensorReading

router = APIRouter(
    prefix="/api/advisory",
    tags=["Agricultural Advisory"]
)


@router.get("/")
def get_advisory(db: Session = Depends(get_db)):

    readings = (
        db.query(SensorReading)
        .order_by(SensorReading.id.desc())
        .limit(100)
        .all()
    )

    latest = {}

    for reading in readings:
        if reading.sensor_type not in latest:
            latest[reading.sensor_type] = reading.value

    recommendations = []

    moisture = latest.get("soil_moisture")
    temperature = latest.get("temperature")

    if moisture is not None:
        if moisture < 30:
            recommendations.append({
                "severity": "high",
                "message": "Low soil moisture. Irrigation recommended."
            })
        elif moisture > 80:
            recommendations.append({
                "severity": "medium",
                "message": "High soil moisture. Monitor waterlogging."
            })
        else:
            recommendations.append({
                "severity": "normal",
                "message": "Soil moisture is within the configured range."
            })

    if temperature is not None and temperature > 35:
        recommendations.append({
            "severity": "high",
            "message": "High temperature detected. Monitor crop heat stress."
        })

    if not recommendations:
        recommendations.append({
            "severity": "info",
            "message": "Waiting for sensor data."
        })

    return {
        "status": "success",
        "sensor_data": latest,
        "recommendations": recommendations
    }