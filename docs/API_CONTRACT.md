# CropNex AI — API Contract

## 1. Overview

The CropNex AI backend uses REST APIs developed with Python FastAPI.

These APIs enable communication between the frontend, machine learning services, IoT devices and database.

## 2. API Endpoints

| Method | Endpoint               | Purpose                               |
| ------ | ---------------------- | ------------------------------------- |
| POST   | /api/detection/analyze | Analyze crop disease images           |
| POST   | /api/pest/analyze      | Analyze pest images                   |
| POST   | /api/sensors/telemetry | Receive ESP32 sensor readings         |
| GET    | /api/sensors/latest    | Retrieve latest sensor readings       |
| GET    | /api/dashboard/stats   | Retrieve dashboard statistics         |
| GET    | /api/advisory          | Retrieve agricultural recommendations |
| GET    | /api/detection/history | Retrieve detection history            |
| GET    | /api/health            | Check backend availability            |

## 3. API Responsibilities

### 3.1 Disease Detection

Method: POST

Endpoint: /api/detection/analyze

Input: Crop image.

Purpose:

* Receive uploaded crop image.
* Validate image.
* Process image using disease detection model.
* Return prediction and confidence.

### 3.2 Pest Detection

Method: POST

Endpoint: /api/pest/analyze

Input: Pest or crop image.

Purpose:

* Receive uploaded image.
* Process image using pest detection model.
* Return supported pest predictions.

### 3.3 Sensor Telemetry

Method: POST

Endpoint: /api/sensors/telemetry

Input:

* Device ID.
* Soil moisture.
* Temperature.
* Humidity.

Purpose:
Receive and store environmental readings from ESP32.

### 3.4 Latest Sensor Readings

Method: GET

Endpoint: /api/sensors/latest

Purpose:
Retrieve the latest available sensor readings.

### 3.5 Dashboard Statistics

Method: GET

Endpoint: /api/dashboard/stats

Purpose:
Provide information required by the dashboard.

### 3.6 Smart Advisory

Method: GET

Endpoint: /api/advisory

Purpose:
Retrieve agricultural recommendations based on available detection results and environmental readings.

### 3.7 Detection History

Method: GET

Endpoint: /api/detection/history

Purpose:
Retrieve previous disease and pest detection records.

### 3.8 Health Check

Method: GET

Endpoint: /api/health

Purpose:
Verify backend server availability.

## 4. Communication Architecture

Frontend communicates with FastAPI using HTTP requests and JSON responses.

ESP32 communicates with the backend through Wi-Fi and HTTP POST requests.

The backend interacts with machine learning services and SQLite.

## 5. Data Validation

* Uploaded images must use supported formats.
* Sensor readings must pass sensor-specific validation.
* Required API fields must be provided.
* Invalid requests must return appropriate error responses.
* ML predictions must use actual model outputs.

## 6. Development Status

These endpoints represent the planned API contract.

Implementation and testing will take place during the hackathon.
