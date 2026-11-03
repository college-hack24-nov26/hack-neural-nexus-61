from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

VALID_DIR = BASE_DIR / "dataset" / "valid"

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "tomato_efficientnet_b0_v2_best.pth"
)


# ============================================================
# DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("=" * 70)
print("TOMATO DISEASE V2 MODEL - EVALUATION")
print("=" * 70)

print(f"Device: {device}")

if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")


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
# LOAD VALIDATION DATASET
# ============================================================

print("\nLoading V2 validation dataset...")

valid_dataset = datasets.ImageFolder(
    VALID_DIR,
    transform=transform
)

valid_loader = DataLoader(
    valid_dataset,
    batch_size=32,
    shuffle=False,
    num_workers=0,
    pin_memory=True
)

class_names = valid_dataset.classes

print(f"Validation images: {len(valid_dataset)}")

print("\nClasses:")

for i, name in enumerate(class_names):
    print(f"{i}: {name}")


# ============================================================
# LOAD MODEL
# ============================================================

print("\nLoading V2 trained model...")

checkpoint = torch.load(
    MODEL_PATH,
    map_location=device
)

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

print("V2 model loaded successfully.")


# ============================================================
# PREDICTIONS
# ============================================================

print("\nRunning V2 evaluation...")

all_predictions = []
all_labels = []

with torch.no_grad():

    for images, labels in valid_loader:

        images = images.to(
            device,
            non_blocking=True
        )

        outputs = model(images)

        predictions = outputs.argmax(
            dim=1
        )

        all_predictions.extend(
            predictions.cpu().numpy()
        )

        all_labels.extend(
            labels.numpy()
        )


# ============================================================
# OVERALL ACCURACY
# ============================================================

accuracy = accuracy_score(
    all_labels,
    all_predictions
)

print("\n" + "=" * 70)
print("OVERALL RESULT")
print("=" * 70)

print(
    f"Validation Accuracy: {accuracy * 100:.2f}%"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        all_labels,
        all_predictions,
        target_names=class_names,
        digits=4,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

cm = confusion_matrix(
    all_labels,
    all_predictions
)

print("\nRows = Actual")
print("Columns = Predicted\n")

print(cm)


# ============================================================
# BEST MODEL INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("SAVED MODEL INFORMATION")
print("=" * 70)

print(f"Model: {MODEL_PATH}")

if "validation_accuracy" in checkpoint:

    print(
        f"Best validation accuracy: "
        f"{checkpoint['validation_accuracy'] * 100:.2f}%"
    )

print("\n🍅 V2 Evaluation complete!")