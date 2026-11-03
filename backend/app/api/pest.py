from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from uuid import uuid4

router = APIRouter(prefix="/api/pest", tags=["Pest Detection"])

UPLOAD_DIR = Path("uploads/pest")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/analyze")
async def analyze_pest(image: UploadFile = File(...)):

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image")

    content = await image.read()

    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Invalid or oversized image")

    extension = Path(image.filename or "").suffix.lower()

    if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(content)

    return {
        "status": "model_not_configured",
        "message": "Image uploaded successfully. Pest model integration is pending.",
        "image": filename,
        "prediction": None,
        "confidence": None
    }