from pathlib import Path

import sys
import torch
from torch import nn
from torchvision import transforms, models
from PIL import Image


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "tomato_efficientnet_b0_best.pth"
)


# ============================================================
# DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# IMAGE TRANSFORM
# ============================================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# LOAD MODEL
# ============================================================

print("=" * 70)
print("TOMATO DISEASE PREDICTION")
print("=" * 70)

print(f"Device: {device}")

if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")


print("\nLoading model...")

checkpoint = torch.load(
    MODEL_PATH,
    map_location=device
)

class_names = checkpoint["class_names"]

model = models.efficientnet_b0(
    weights=None
)

num_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    num_features,
    len(class_names)
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model = model.to(device)
model.eval()

print("Model loaded successfully.")


# ============================================================
# GET IMAGE PATH
# ============================================================

if len(sys.argv) < 2:

    print("\nUsage:")
    print(
        "python .\\scripts\\predict.py "
        "\"path\\to\\image.jpg\""
    )

    sys.exit(1)


image_path = Path(sys.argv[1])


if not image_path.exists():

    print(f"\nERROR: Image not found:")
    print(image_path)

    sys.exit(1)


# ============================================================
# LOAD IMAGE
# ============================================================

print("\nLoading image...")

try:

    image = Image.open(image_path).convert("RGB")

except Exception as e:

    print(f"ERROR: Could not open image: {e}")

    sys.exit(1)


print(f"Image: {image_path.name}")
print(f"Original size: {image.size}")


# ============================================================
# PREPARE IMAGE
# ============================================================

input_tensor = transform(image)

input_tensor = input_tensor.unsqueeze(0)

input_tensor = input_tensor.to(device)


# ============================================================
# PREDICTION
# ============================================================

print("\nRunning prediction...")

with torch.no_grad():

    outputs = model(input_tensor)

    probabilities = torch.softmax(
        outputs,
        dim=1
    )

    confidence, predicted_index = torch.max(
        probabilities,
        dim=1
    )


predicted_class = class_names[
    predicted_index.item()
]

confidence_value = confidence.item() * 100


# ============================================================
# TOP 3 PREDICTIONS
# ============================================================

top_probabilities, top_indices = torch.topk(
    probabilities[0],
    min(3, len(class_names))
)


print("\n" + "=" * 70)
print("PREDICTION RESULT")
print("=" * 70)

print(
    f"\nDisease: {predicted_class}"
)

print(
    f"Confidence: {confidence_value:.2f}%"
)


print("\nTop predictions:")

for probability, index in zip(
    top_probabilities,
    top_indices
):

    name = class_names[index.item()]

    print(
        f"{name}: "
        f"{probability.item() * 100:.2f}%"
    )


print("\n" + "=" * 70)
print("Prediction complete 🍅")
print("=" * 70)