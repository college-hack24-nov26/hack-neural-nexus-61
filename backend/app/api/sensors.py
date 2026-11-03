from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.device import Device
from app.models.sensor import SensorReading

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])


class SensorData(BaseModel):
    device_id: str
    temperature: float = Field(ge=-50, le=100)
    humidity: float = Field(ge=0, le=100)
    soil_moisture: float = Field(ge=0, le=100)


@router.post("/telemetry")
def receive_telemetry(data: SensorData, db: Session = Depends(get_db)):

    device = db.query(Device).filter(
        Device.device_id == data.device_id
    ).first()

    if not device:
        device = Device(
            device_id=data.device_id,
            device_name="CropNex ESP32",
            status="online"
        )
        db.add(device)
    else:
        device.status = "online"

    readings = [
        ("temperature", data.temperature, "°C"),
        ("humidity", data.humidity, "%"),
        ("soil_moisture", data.soil_moisture, "%")
    ]

    for sensor_type, value, unit in readings:
        db.add(SensorReading(
            device_id=data.device_id,
            sensor_type=sensor_type,
            value=value,
            unit=unit
        ))

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    return {
        "status": "success",
        "message": "Sensor data stored successfully",
        "device_id": data.device_id
    }


@router.get("/latest")
def get_latest_readings(db: Session = Depends(get_db)):

    readings = (
        db.query(SensorReading)
        .order_by(SensorReading.id.desc())
        .limit(100)
        .all()
    )

    latest = {}

    for reading in readings:
        if reading.sensor_type not in latest:
            latest[reading.sensor_type] = {
                "value": reading.value,
                "unit": reading.unit,
                "device_id": reading.device_id,
                "recorded_at": reading.recorded_at
            }

    return {
        "status": "success",
        "readings": latest
    }