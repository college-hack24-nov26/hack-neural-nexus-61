from ultralytics import YOLO

# Load your custom trained model
model = YOLO('./PlantVillage_Model/yolov8_run1/weights/best.pt')

# Export to ONNX format (commonly used for web apps and cross-platform deployment)
print("Exporting to ONNX...")
onnx_path = model.export(format='onnx')
print(f"ONNX model saved to: {onnx_path}")

# Alternatively, export to TFLite format (commonly used for mobile/Raspberry Pi)
# print("Exporting to TFLite...")
# tflite_path = model.export(format='tflite')
# print(f"TFLite model saved to: {tflite_path}")