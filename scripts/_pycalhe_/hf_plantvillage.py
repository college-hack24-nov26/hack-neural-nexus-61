from datasets import load_dataset

# 1. Download and load the dataset directly from Hugging Face
print("Downloading dataset... (This may take a few minutes the first time)")
dataset = load_dataset("mohanty/PlantVillage")

# 2. Print the structure to see what you downloaded
print(dataset)

# 3. Access the first image in the training set
first_item = dataset['train'][0]
image = first_item['image']
label_id = first_item['label']

# 4. Get the actual text name of the label (e.g., "Tomato___Bacterial_spot")
label_name = dataset['train'].features['label'].int2str(label_id)

print(f"Showing image for: {label_name}")
image.show()