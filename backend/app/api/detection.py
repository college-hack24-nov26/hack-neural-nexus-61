from fastapi import APIRouter, UploadFile, File, HTTPException
import torch
from torchvision import transforms, models
from torch import nn
from PIL import Image
import io
import os

router = APIRouter(prefix="/api/detection", tags=["Disease Detection"])


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

MODEL_PATH = "models/tomato_efficientnet_b0_best.pth" 
model = None
class_names = []

try:
    if os.path.exists(MODEL_PATH):
        checkpoint = torch.load(MODEL_PATH, map_location=device)
        class_names = checkpoint["class_names"]
        
        model = models.efficientnet_b0(weights=None)
        num_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_features, len(class_names))
        model.load_state_dict(checkpoint["model_state_dict"])
        model = model.to(device)
        model.eval()
        print("✅ ML Model connected and loaded successfully!")
    else:
        print(f"⚠️ Error: Model not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading model: {e}")


@router.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="ML Model is not loaded.")
        
    try:
        
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted_index = torch.max(probabilities, dim=1)
            
        
        return {
            "success": True,
            "disease": class_names[predicted_index.item()],
            "confidence": round(confidence.item() * 100, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")