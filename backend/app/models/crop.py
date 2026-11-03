from sqlalchemy import Column, Integer, String
from app.database.connection import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String, nullable=False)
    variety = Column(String, nullable=True)