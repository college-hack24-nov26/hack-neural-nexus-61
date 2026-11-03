from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import Base, engine
from app import models

from app.api.sensors import router as sensor_router
from app.api.detection import router as detection_router
from app.api.pest import router as pest_router
from app.api.advisory import router as advisory_router
from app.api.dashboard import router as dashboard_router
from app.api.history import router as history_router

app = FastAPI(
    title="CropNex AI Backend",
    version="1.0.0",
    docs_url=None, 
    redoc_url=None
)

# Frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize database
Base.metadata.create_all(bind=engine)

# Register API routers
app.include_router(sensor_router)
app.include_router(detection_router)
app.include_router(pest_router)
app.include_router(advisory_router)
app.include_router(dashboard_router)
app.include_router(history_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "project": "CropNex AI",
        "version": "1.0.0"
    }

@app.get("/")
def home():
    return {
        "project": "CropNex AI",
        "status": "running",
        "message": "Backend is operational"
    }