from sqlalchemy import Column, Integer, String
from app.database.connection import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, nullable=False)
    device_name = Column(String)
    status = Column(String, default="online")