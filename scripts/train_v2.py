from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.utils.class_weight import compute_class_weight


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_DIR = BASE_DIR / "dataset" / "train"
VALID_DIR = BASE_DIR / "dataset" / "valid"

MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

BEST_MODEL_PATH = MODEL_DIR / "tomato_efficientnet_b0_v2_best.pth"


# ============================================================
# 2. CONFIGURATION
# ============================================================

BATCH_SIZE = 32
NUM_EPOCHS = 20
LEARNING_RATE = 0.0001
WEIGHT_DECAY = 0.0001

IMAGE_SIZE = 224

PATIENCE = 5

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# 3. DEVICE INFORMATION
# ============================================================

print("=" * 70)
print("TOMATO DISEASE CLASSIFICATION - V2 TRAINING")
print("=" * 70)

print(f"Device: {device}")

if torch.cuda.is_available():

    print(
        f"GPU: {torch.cuda.get_device_name(0)}"
    )

    print(
        f"CUDA: {torch.version.cuda}"
    )

    torch.backends.cudnn.benchmark = True


# ============================================================
# 4. IMAGE TRANSFORMS
# ============================================================

train_transform = transforms.Compose([

    transforms.Resize(
        (IMAGE_SIZE, IMAGE_SIZE)
    ),

    transforms.RandomHorizontalFlip(
        p=0.5
    ),

    transforms.RandomRotation(
        15
    ),

    transforms.ColorJitter(
        brightness=0.2,
        contrast=0.2,
        saturation=0.2
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


valid_transform = transforms.Compose([

    transforms.Resize(
        (IMAGE_SIZE, IMAGE_SIZE)
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# 5. LOAD DATASETS
# ============================================================

print("\nLoading datasets...")

train_dataset = datasets.ImageFolder(
    TRAIN_DIR,
    transform=train_transform
)

valid_dataset = datasets.ImageFolder(
    VALID_DIR,
    transform=valid_transform
)

print(
    f"Training images:   {len(train_dataset)}"
)

print(
    f"Validation images: {len(valid_dataset)}"
)


# ============================================================
# 6. VERIFY CLASSES
# ============================================================

print("\nClasses:")

for i, class_name in enumerate(
    train_dataset.classes
):

    print(
        f"{i}: {class_name}"
    )


if train_dataset.classes != valid_dataset.classes:

    raise RuntimeError(
        "Training and validation classes do not match."
    )


NUM_CLASSES = len(
    train_dataset.classes
)

print(
    f"\nNumber of classes: {NUM_CLASSES}"
)


# ============================================================
# 7. DATA LOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0,
    pin_memory=True
)

valid_loader = DataLoader(
    valid_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0,
    pin_memory=True
)


# ============================================================
# 8. CLASS WEIGHTS
# ============================================================

print("\nCalculating class weights...")

targets = train_dataset.targets

class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.arange(NUM_CLASSES),
    y=targets
)

class_weights = torch.tensor(
    class_weights,
    dtype=torch.float32
).to(device)


print("\nClass weights:")

for name, weight in zip(
    train_dataset.classes,
    class_weights
):

    print(
        f"{name}: {weight.item():.4f}"
    )


# ============================================================
# 9. LOAD EFFICIENTNET-B0
# ============================================================

print("\nLoading pretrained EfficientNet-B0...")

weights = models.EfficientNet_B0_Weights.DEFAULT

model = models.efficientnet_b0(
    weights=weights
)


num_features = (
    model.classifier[1].in_features
)


model.classifier[1] = nn.Linear(
    num_features,
    NUM_CLASSES
)


model = model.to(device)


# ============================================================
# 10. LOSS + OPTIMIZER
# ============================================================

criterion = nn.CrossEntropyLoss(
    weight=class_weights
)


optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=WEIGHT_DECAY
)


# ============================================================
# 11. MIXED PRECISION
# ============================================================

use_amp = device.type == "cuda"

if use_amp:

    scaler = torch.amp.GradScaler(
        "cuda"
    )

    print("\nMixed precision: ENABLED")

else:

    scaler = None

    print("\nMixed precision: DISABLED")


# ============================================================
# 12. TRAINING FUNCTION
# ============================================================

def train_one_epoch():

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:

        images = images.to(
            device,
            non_blocking=True
        )

        labels = labels.to(
            device,
            non_blocking=True
        )

        optimizer.zero_grad(
            set_to_none=True
        )

        if use_amp:

            with torch.autocast(
                device_type="cuda",
                dtype=torch.float16
            ):

                outputs = model(images)

                loss = criterion(
                    outputs,
                    labels
                )

            scaler.scale(loss).backward()

            scaler.step(optimizer)

            scaler.update()

        else:

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

            loss.backward()

            optimizer.step()


        running_loss += (
            loss.item() * images.size(0)
        )

        predictions = outputs.argmax(
            dim=1
        )

        correct += (
            predictions == labels
        ).sum().item()

        total += labels.size(0)


    epoch_loss = (
        running_loss / total
    )

    epoch_accuracy = (
        correct / total
    )

    return epoch_loss, epoch_accuracy


# ============================================================
# 13. VALIDATION FUNCTION
# ============================================================

def validate():

    model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():

        for images, labels in valid_loader:

            images = images.to(
                device,
                non_blocking=True
            )

            labels = labels.to(
                device,
                non_blocking=True
            )

            if use_amp:

                with torch.autocast(
                    device_type="cuda",
                    dtype=torch.float16
                ):

                    outputs = model(images)

                    loss = criterion(
                        outputs,
                        labels
                    )

            else:

                outputs = model(images)

                loss = criterion(
                    outputs,
                    labels
                )


            running_loss += (
                loss.item() * images.size(0)
            )

            predictions = outputs.argmax(
                dim=1
            )

            correct += (
                predictions == labels
            ).sum().item()

            total += labels.size(0)


    epoch_loss = (
        running_loss / total
    )

    epoch_accuracy = (
        correct / total
    )

    return epoch_loss, epoch_accuracy


# ============================================================
# 14. TRAINING LOOP
# ============================================================

print("\nStarting V2 training...")
print("=" * 70)

best_accuracy = 0.0
epochs_without_improvement = 0


for epoch in range(NUM_EPOCHS):

    print(
        f"\nEpoch {epoch + 1}/{NUM_EPOCHS}"
    )

    train_loss, train_accuracy = (
        train_one_epoch()
    )

    valid_loss, valid_accuracy = (
        validate()
    )


    print(
        f"Train Loss:       {train_loss:.4f}"
    )

    print(
        f"Train Accuracy:   "
        f"{train_accuracy * 100:.2f}%"
    )

    print(
        f"Validation Loss:  {valid_loss:.4f}"
    )

    print(
        f"Validation Accuracy: "
        f"{valid_accuracy * 100:.2f}%"
    )


    # ========================================================
    # SAVE BEST MODEL
    # ========================================================

    if valid_accuracy > best_accuracy:

        best_accuracy = valid_accuracy

        epochs_without_improvement = 0

        torch.save(
            {
                "model_state_dict":
                    model.state_dict(),

                "class_names":
                    train_dataset.classes,

                "image_size":
                    IMAGE_SIZE,

                "validation_accuracy":
                    valid_accuracy,

                "num_classes":
                    NUM_CLASSES,

                "model_name":
                    "EfficientNet-B0",

                "version":
                    "V2"
            },
            BEST_MODEL_PATH
        )

        print(
            f"Best V2 model saved:"
            f"\n{BEST_MODEL_PATH}"
        )

    else:

        epochs_without_improvement += 1

        print(
            f"No improvement: "
            f"{epochs_without_improvement}/"
            f"{PATIENCE}"
        )


    # ========================================================
    # EARLY STOPPING
    # ========================================================

    if (
        epochs_without_improvement
        >= PATIENCE
    ):

        print(
            "\nEarly stopping triggered."
        )

        break


# ============================================================
# 15. FINISHED
# ============================================================

print("\n" + "=" * 70)
print("V2 TRAINING COMPLETE")
print("=" * 70)

print(
    f"Best validation accuracy: "
    f"{best_accuracy * 100:.2f}%"
)

print(
    f"Model saved at:"
    f"\n{BEST_MODEL_PATH}"
)

if torch.cuda.is_available():

    print(
        "\nGPU memory allocated: "
        f"{torch.cuda.memory_allocated() / 1024**2:.2f} MB"
    )

    print(
        "GPU memory reserved: "
        f"{torch.cuda.memory_reserved() / 1024**2:.2f} MB"
    )

print("\nV2 model training finished.")