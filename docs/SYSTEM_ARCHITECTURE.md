# CropNex AI - System Architecture

## 1. Overview

CropNex AI is an AI-powered smart agriculture platform
for early crop disease and pest detection.

It combines computer vision, IoT monitoring and
agricultural advisory.

## 2. Technology Stack

Frontend:
- HTML5
- CSS3
- JavaScript

Backend:
- Python
- FastAPI

Database:
- SQLite
- SQLAlchemy

Machine Learning:
- PyTorch
- Open-source disease detection model
- Open-source pest detection model

Hardware:
- ESP32
- DHT11
- Capacitive Soil Moisture Sensor

Communication:
- HTTP
- Wi-Fi

## 3. System Architecture

FARMER
   |
   v
FRONTEND (HTML + CSS + JavaScript)
   |
   v
FASTAPI BACKEND
   |
   +---- ML SERVICE
   |       |
   |       +---- Disease Detection
   |       +---- Pest Detection
   |
   +---- IoT SERVICE
   |       |
   |       +---- ESP32
   |       +---- Sensor Readings
   |
   +---- ADVISORY ENGINE
   |
   v
SQLITE DATABASE
   |
   v
DASHBOARD DATA

## 4. Main Modules

1. Crop Disease Detection
2. Pest Detection
3. IoT Monitoring
4. Smart Advisory
5. Dashboard
6. Detection History

## 5. Data Flow

Disease Detection:
Farmer -> Frontend -> Backend -> ML Model -> Database -> Frontend

IoT Monitoring:
ESP32 -> Wi-Fi -> Backend -> Database -> Dashboard

Smart Advisory:
Detection Results + Sensor Readings -> Advisory Engine -> Recommendations

## 6. Development Approach

The application will be developed from scratch during
the hackathon.

Public open-source ML resources may be used according
to the hackathon guidelines.

AI tools will be used only for permitted assistance.