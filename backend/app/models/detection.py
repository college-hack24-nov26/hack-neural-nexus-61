from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String)
    prediction = Column(String)
    confidence = Column(Float)
    detection_type = Column(String)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())