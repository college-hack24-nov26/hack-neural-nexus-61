import zipfile
from pathlib import Path


# ==============================
# PATHS
# ==============================

ZIP_PATH = Path(
    r"C:\Users\Raiba Kate\.cache\huggingface\hub\datasets--mohanty--PlantVillage"
    r"\snapshots\9e97599868962bd0079b8db4b7f1efa9185fa1e7\data.zip"
)

TRAIN_SPLIT = Path(
    r"C:\Users\Raiba Kate\.cache\huggingface\hub\datasets--mohanty--PlantVillage"
    r"\snapshots\9e97599868962bd0079b8db4b7f1efa9185fa1e7\splits\color_train.txt"
)

TEST_SPLIT = Path(
    r"C:\Users\Raiba Kate\.cache\huggingface\hub\datasets--mohanty--PlantVillage"
    r"\snapshots\9e97599868962bd0079b8db4b7f1efa9185fa1e7\splits\color_test.txt"
)

OUTPUT_DIR = Path("dataset/tomato")


# ==============================
# TOMATO CLASSES
# ==============================

CLASS_NAMES = {
    "Tomato___Bacterial_spot": "Bacterial_spot",
    "Tomato___Early_blight": "Early_blight",
    "Tomato___Late_blight": "Late_blight",
    "Tomato___Leaf_Mold": "Leaf_Mold",
    "Tomato___Septoria_leaf_spot": "Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite": "Spider_mites",
    "Tomato___Target_Spot": "Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus": "Tomato_mosaic_virus",
    "Tomato___healthy": "healthy",
}


# ==============================
# EXTRACT ONE SPLIT
# ==============================

def extract_split(zip_file, split_file, split_name):

    print()
    print("=" * 50)
    print(f"Preparing {split_name} dataset")
    print("=" * 50)

    lines = split_file.read_text(encoding="utf-8").splitlines()

    tomato_paths = []

    for line in lines:
        line = line.strip()

        if line.startswith("raw/color/Tomato___"):
            tomato_paths.append(line)

    print(f"Tomato images in split: {len(tomato_paths)}")

    zip_names = set(zip_file.namelist())

    missing = [
        path for path in tomato_paths
        if path not in zip_names
    ]

    if missing:
        print()
        print("WARNING: Some images are missing from ZIP:")
        for path in missing[:20]:
            print(path)

        print(f"Total missing: {len(missing)}")

    extracted = 0

    for image_path in tomato_paths:

        if image_path not in zip_names:
            continue

        # Example:
        # raw/color/Tomato___Early_blight/image.JPG

        parts = image_path.split("/")

        class_folder = parts[2]

        if class_folder not in CLASS_NAMES:
            print(f"Unknown class: {class_folder}")
            continue

        clean_class = CLASS_NAMES[class_folder]

        output_folder = (
            OUTPUT_DIR
            / split_name
            / clean_class
        )

        output_folder.mkdir(
            parents=True,
            exist_ok=True
        )

        filename = Path(image_path).name

        output_path = output_folder / filename

        if output_path.exists():
            continue

        with zip_file.open(image_path) as source:
            with open(output_path, "wb") as target:
                target.write(source.read())

        extracted += 1

        if extracted % 500 == 0:
            print(
                f"Extracted {extracted}/{len(tomato_paths)}"
            )

    print()
    print(f"{split_name} extraction complete.")
    print(f"New images extracted: {extracted}")
    print(f"Missing images: {len(missing)}")


# ==============================
# MAIN
# ==============================

def main():

    print("Tomato Dataset Preparation")
    print("=" * 50)

    if not ZIP_PATH.exists():
        raise FileNotFoundError(
            f"data.zip not found:\n{ZIP_PATH}"
        )

    if not TRAIN_SPLIT.exists():
        raise FileNotFoundError(
            f"Training split not found:\n{TRAIN_SPLIT}"
        )

    if not TEST_SPLIT.exists():
        raise FileNotFoundError(
            f"Test split not found:\n{TEST_SPLIT}"
        )

    print(f"ZIP found: {ZIP_PATH}")
    print(f"Output: {OUTPUT_DIR.resolve()}")

    print()
    print("Opening ZIP...")
    
    with zipfile.ZipFile(ZIP_PATH, "r") as zip_file:

        extract_split(
            zip_file,
            TRAIN_SPLIT,
            "train"
        )

        extract_split(
            zip_file,
            TEST_SPLIT,
            "test"
        )

    print()
    print("=" * 50)
    print("DATASET PREPARATION COMPLETE")
    print("=" * 50)


if __name__ == "__main__":
    main()