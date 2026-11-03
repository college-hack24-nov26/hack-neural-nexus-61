from pathlib import Path
from PIL import Image

DATASET_DIR = Path("dataset")

image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

bad_images = []
total = 0

for path in DATASET_DIR.rglob("*"):
    if path.suffix.lower() not in image_extensions:
        continue

    total += 1

    try:
        with Image.open(path) as img:
            img.verify()

    except Exception as e:
        bad_images.append((path, str(e)))

print(f"\nChecked: {total} images")
print(f"Bad images: {len(bad_images)}")

if bad_images:
    print("\nBAD IMAGES:")
    for path, error in bad_images:
        print(f"\n{path}")
        print(f"  Error: {error}")
else:
    print("\nNo corrupted images found.")