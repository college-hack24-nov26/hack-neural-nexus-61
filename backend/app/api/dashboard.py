from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.device import Device
from app.models.sensor import SensorReading
from app.models.detection import Detection

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    return {
        "total_devices": db.query(Device).count(),
        "total_sensor_readings": db.query(SensorReading).count(),
        "total_detections": db.query(Detection).count(),
        "online_devices": db.query(Device).filter(
            Device.status == "online"
        ).count()
    }


@router.get("/sensors")
def dashboard_sensors(db: Session = Depends(get_db)):
    readings = (
        db.query(SensorReading)
        .order_by(SensorReading.id.desc())
        .limit(30)
        .all()
    )

    return [
        {
            "sensor_type": r.sensor_type,
            "value": r.value,
            "unit": r.unit,
            "device_id": r.device_id,
            "recorded_at": r.recorded_at
        }
        for r in readings
    ]