from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    recommendation = Column(String, nullable=False)
    severity = Column(String, default="normal")
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())