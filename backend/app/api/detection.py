from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from pathlib import Path
from uuid import uuid4

from app.database.connection import get_db
from app.models.detection import Detection

router = APIRouter(prefix="/api/detection", tags=["Disease Detection"])

UPLOAD_DIR = Path("uploads/disease")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/analyze")
async def analyze_disease(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image")

    content = await image.read()

    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Invalid or oversized image")

    extension = Path(image.filename or "").suffix.lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(content)

    return {
        "status": "model_not_configured",
        "message": "Image uploaded successfully. Disease model integration is pending.",
        "image": filename,
        "prediction": None,
        "confidence": None
    }