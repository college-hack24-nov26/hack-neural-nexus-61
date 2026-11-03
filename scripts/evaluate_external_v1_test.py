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

EXTERNAL_TEST_DIR = (
    BASE_DIR
    / "dataset"
    / "tomato"
    / "test"
)

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
print("TOMATO V2 - EXTERNAL TEST EVALUATION")
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
# LOAD EXTERNAL DATASET
# ============================================================

print("\nLoading external test dataset...")

external_dataset = datasets.ImageFolder(
    EXTERNAL_TEST_DIR,
    transform=transform
)

external_loader = DataLoader(
    external_dataset,
    batch_size=32,
    shuffle=False,
    num_workers=0,
    pin_memory=True
)

external_class_names = external_dataset.classes

print(f"External test images: {len(external_dataset)}")

print("\nExternal dataset classes:")

for i, name in enumerate(external_class_names):
    print(f"{i}: {name}")


# ============================================================
# V2 CLASS DEFINITIONS
# ============================================================

v2_classes = [
    "Bacterial_spot",
    "Early_blight",
    "Late_blight",
    "Leaf_Mold",
    "Septoria_leaf_spot",
    "Spider_mites Two-spotted_spider_mite",
    "Target_Spot",
    "Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato_mosaic_virus",
    "healthy",
    "powdery_mildew",
]

v2_class_to_index = {
    name: index
    for index, name in enumerate(v2_classes)
}


# ============================================================
# CLASS NAME MAPPING
# ============================================================

class_mapping = {
    "Bacterial_spot":
        "Bacterial_spot",

    "Early_blight":
        "Early_blight",

    "Late_blight":
        "Late_blight",

    "Leaf_Mold":
        "Leaf_Mold",

    "Septoria_leaf_spot":
        "Septoria_leaf_spot",

    "Spider_mites":
        "Spider_mites Two-spotted_spider_mite",

    "Target_Spot":
        "Target_Spot",

    "Yellow_Leaf_Curl_Virus":
        "Tomato_Yellow_Leaf_Curl_Virus",

    "Tomato_mosaic_virus":
        "Tomato_mosaic_virus",

    "healthy":
        "healthy",
}


# ============================================================
# VERIFY CLASS MAPPING
# ============================================================

print("\nClass mapping:")

for external_name in external_class_names:

    if external_name not in class_mapping:
        raise ValueError(
            f"No mapping found for external class: "
            f"{external_name}"
        )

    v2_name = class_mapping[external_name]

    print(
        f"{external_name} -> {v2_name}"
    )


# ============================================================
# LOAD V2 MODEL
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
    len(v2_classes)
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

print("\nRunning external evaluation...")

all_predictions = []
all_labels = []

with torch.no_grad():

    for images, labels in external_loader:

        images = images.to(
            device,
            non_blocking=True
        )

        outputs = model(images)

        predictions = outputs.argmax(
            dim=1
        )

        for prediction, label in zip(
            predictions.cpu().numpy(),
            labels.numpy()
        ):

            external_name = (
                external_class_names[label]
            )

            v2_name = class_mapping[
                external_name
            ]

            true_v2_index = (
                v2_class_to_index[v2_name]
            )

            all_predictions.append(
                int(prediction)
            )

            all_labels.append(
                true_v2_index
            )


# ============================================================
# OVERALL ACCURACY
# ============================================================

accuracy = accuracy_score(
    all_labels,
    all_predictions
)

print("\n" + "=" * 70)
print("EXTERNAL TEST RESULT")
print("=" * 70)

print(
    f"External Test Accuracy: "
    f"{accuracy * 100:.2f}%"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

evaluated_classes = [
    class_mapping[name]
    for name in external_class_names
]

evaluated_indices = [
    v2_class_to_index[name]
    for name in evaluated_classes
]

print(
    classification_report(
        all_labels,
        all_predictions,
        labels=evaluated_indices,
        target_names=evaluated_classes,
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
    all_predictions,
    labels=evaluated_indices
)

print("\nRows = Actual")
print("Columns = Predicted\n")

print(cm)


# ============================================================
# MODEL INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("MODEL INFORMATION")
print("=" * 70)

print(f"Model: {MODEL_PATH}")

if "validation_accuracy" in checkpoint:

    print(
        f"V2 best validation accuracy: "
        f"{checkpoint['validation_accuracy'] * 100:.2f}%"
    )

print("\n🍅 External evaluation complete!")