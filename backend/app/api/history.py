from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.detection import Detection

router = APIRouter(prefix="/api/detection", tags=["History"])


@router.get("/history")
def detection_history(db: Session = Depends(get_db)):
    records = (
        db.query(Detection)
        .order_by(Detection.id.desc())
        .limit(100)
        .all()
    )

    return [
        {
            "id": r.id,
            "crop_name": r.crop_name,
            "prediction": r.prediction,
            "confidence": r.confidence,
            "detection_type": r.detection_type,
            "recorded_at": r.recorded_at
        }
        for r in records
    ]