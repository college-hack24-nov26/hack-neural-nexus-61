var frontendHost = window.location.hostname || "127.0.0.1";
var apiHost = (frontendHost === "localhost" || frontendHost === "127.0.0.1") ? "127.0.0.1" : frontendHost;
window.APP_CONFIG = window.APP_CONFIG || {
  API_BASE_URL: "http://" + apiHost + ":8000/api/v1",
};

const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;

/**
 * Master switch. Set to false once a real backend/ESP32 is available.
 * Every mock function below is clearly labeled and returns data
 * shaped exactly like the real API responses documented in section 10.
 */
let USE_MOCK_DATA = false;

function setMockMode(enabled) {
  USE_MOCK_DATA = !!enabled;
  localStorage.setItem("sa_use_mock", USE_MOCK_DATA ? "true" : "false");
}

function isMockMode() {
  const stored = localStorage.getItem("sa_use_mock");
  if (stored !== null) return stored === "true";
  return USE_MOCK_DATA;
}

/* ---------------------------------------------------------
   Generic fetch wrapper (GET / POST / PUT / DELETE)
   --------------------------------------------------------- */
async function apiRequest(path, { method = "GET", body, timeoutMs = 8000 } = {}) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = setTimeout(() => { if (controller) controller.abort(); }, timeoutMs);

  const headers = { "Content-Type": "application/json" };
  const token =
  localStorage.getItem("sa_token") ||
  sessionStorage.getItem("sa_token");

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined,
    });
    clearTimeout(timer);

    let data = null;
    try { data = await response.json(); } catch (_) { data = null; }

    return { ok: response.ok, status: response.status, data, networkError: false };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, data: null, networkError: true, message: err.message };
  }
}

const apiGet = (path) => apiRequest(path, { method: "GET" });
const apiPost = (path, body) => apiRequest(path, { method: "POST", body });
const apiPut = (path, body) => apiRequest(path, { method: "PUT", body });
const apiDelete = (path) => apiRequest(path, { method: "DELETE" });

function friendlyErrorMessage(result) {
  if (!result) return "Something went wrong. Please try again.";
  if (result.networkError) return "Unable to connect to the server. Showing demo data instead.";
  switch (result.status) {
    case 400: return (result.data && result.data.message) || "The request could not be processed.";
    case 401: return "Your session has expired. Please log in again.";
    case 404: return "The requested information was not found.";
    case 422: return "Some of the information provided was invalid.";
    case 500: return "The server ran into a problem. Please try again.";
    default: return "Something went wrong. Please try again.";
  }
}

/* ===========================================================
   MOCK DATA GENERATORS
   Every function returns { ok:true, data, is_demo:true } so
   pages can treat mock and real results identically.
   =========================================================== */

function rand(min, max, decimals = 1) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function mockOk(data) {
  return { ok: true, status: 200, data: { ...data, is_demo: true }, networkError: false };
}

/* ---------- Auth ---------- */
function mockLogin(identifier, password) {
  if (!identifier || !password) {
    return { ok: false, status: 400, data: { message: "Email/mobile and password are required." } };
  }
  return mockOk({
    access_token: "demo-token-" + Date.now(),
    username: identifier,
    full_name: "Ramesh Kumar",
    role: "farmer",
  });
}

/* ---------- Dashboard ---------- */
function mockDashboard() {
  return mockOk({
    crop_health: rand(70, 96, 0),
    soil_moisture: rand(30, 75, 1),
    temperature: rand(24, 35, 1),
    humidity: rand(40, 80, 1),
    irrigation_status: Math.random() > 0.5 ? "ON" : "OFF",
    disease_risk: ["Low", "Moderate", "High"][Math.floor(Math.random() * 3)],
    crop: {
      name: "Tomato",
      growth_stage: "Flowering",
      health_pct: rand(75, 95, 0),
      soil_condition: "Good",
    },
    alerts: [
      { level: "yellow", category: "moisture", message: "Soil moisture is below the recommended level.", timestamp: new Date().toISOString() },
      { level: "red", category: "disease", message: "Early signs of Early Blight detected on Field 001.", timestamp: new Date(Date.now() - 3600 * 1000).toISOString() },
      { level: "info", category: "irrigation", message: "Irrigation recommended: run for 15 minutes.", timestamp: new Date(Date.now() - 7200 * 1000).toISOString() },
      { level: "yellow", category: "weather", message: "High temperatures expected this afternoon.", timestamp: new Date(Date.now() - 10800 * 1000).toISOString() },
    ],
  });
}

/* ---------- Weather ---------- */
function mockWeather() {
  return mockOk({
    temperature: rand(26, 34, 0),
    humidity: rand(45, 75, 0),
    rain_probability: rand(0, 60, 0),
    wind_speed: rand(4, 22, 0),
    condition: ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"][Math.floor(Math.random() * 4)],
  });
}

/* ---------- Crops / Crop Health ---------- */
const CROP_LIST = ["Tomato", "Wheat", "Rice", "Maize", "Cotton"];
const GROWTH_STAGES = ["Seed", "Germination", "Vegetative", "Flowering", "Harvest"];

function mockCrops() {
  return mockOk({ crops: CROP_LIST });
}

function mockCropHealth(cropName = "Tomato") {
  const stageIndex = Math.floor(Math.random() * (GROWTH_STAGES.length - 1)) + 1; // avoid "Seed" looking too empty
  return mockOk({
    crop: cropName,
    age_days: Math.floor(rand(10, 90, 0)),
    growth_stage: GROWTH_STAGES[stageIndex],
    growth_stage_index: stageIndex,
    health_score: rand(60, 96, 0),
    soil_health: rand(55, 95, 0),
    nutrient_status: rand(50, 90, 0),
    water_status: rand(40, 95, 0),
    pest_risk: ["Low", "Moderate", "High"][Math.floor(Math.random() * 3)],
  });
}

/* ---------- Disease Detection ---------- */
const DISEASE_LIBRARY = [
  {
    disease: "Healthy Leaf",
    confidence: rand(92, 99, 1),
    symptoms: "No visible spots, discoloration, or wilting. Leaf color and texture are normal.",
    treatment: "No treatment necessary. Continue your regular care routine.",
    prevention: "Maintain consistent watering, balanced fertilization, and good field airflow.",
  },
  {
    disease: "Early Blight",
    confidence: rand(80, 98, 1),
    symptoms: "Dark concentric spots on older leaves, yellowing around lesions, leaf drop.",
    treatment: "Remove and destroy infected leaves. Apply a copper-based or chlorothalonil fungicide.",
    prevention: "Rotate crops yearly, avoid overhead watering, and stake plants for better airflow.",
  },
  {
    disease: "Leaf Spot",
    confidence: rand(75, 96, 1),
    symptoms: "Small brown or black spots with yellow halos scattered across leaves.",
    treatment: "Apply a labeled fungicide and remove severely affected foliage.",
    prevention: "Avoid working in wet fields and space plants to reduce humidity buildup.",
  },
  {
    disease: "Late Blight",
    confidence: rand(78, 97, 1),
    symptoms: "Water-soaked patches that turn brown/black rapidly, white mold on leaf undersides.",
    treatment: "Isolate affected plants immediately and apply a systemic fungicide.",
    prevention: "Improve field drainage, avoid overhead irrigation, and monitor during humid weather.",
  },
];

function mockDiseaseDetect() {
  const result = DISEASE_LIBRARY[Math.floor(Math.random() * DISEASE_LIBRARY.length)];
  return mockOk({ ...result });
}

/* ---------- Sensors / Irrigation ---------- */
function mockSensors() {
  return mockOk({
    soil_moisture: rand(20, 70, 1),
    water_level: rand(40, 95, 1),
    temperature: rand(24, 35, 1),
    humidity: rand(40, 80, 1),
    rain_prediction_pct: rand(0, 50, 0),
  });
}

function mockIrrigationStatus() {
  const moisture = rand(18, 55, 1);
  const minMoisture = 25;
  const status = moisture < minMoisture ? "ON" : "OFF";
  return mockOk({
    status,
    soil_moisture: moisture,
    min_moisture: minMoisture,
    recommendation: moisture < minMoisture
      ? `Water your crop for 15 minutes because soil moisture (${moisture}%) is below the recommended level (${minMoisture}%).`
      : "Soil moisture is within a healthy range. No irrigation needed right now.",
  });
}

function mockIrrigationAction(action) {
  return mockOk({ status: action === "start" ? "ON" : "OFF", message: `Irrigation ${action === "start" ? "started" : "stopped"} (demo mode).` });
}

/* ---------- Analytics ---------- */
function mockAnalytics(rangeDays = 7) {
  const points = [];
  const now = Date.now();
  let moisture = 45, temp = 27, humidity = 60, waterUsage = 0, health = 85, disease = 15;

  for (let i = rangeDays; i >= 0; i--) {
    moisture = Math.min(70, Math.max(15, moisture + rand(-4, 4)));
    temp = Math.min(38, Math.max(18, temp + rand(-1.5, 1.5)));
    humidity = Math.min(85, Math.max(30, humidity + rand(-3, 3)));
    health = Math.min(98, Math.max(55, health + rand(-2, 2)));
    disease = Math.min(60, Math.max(2, disease + rand(-3, 3)));
    const dailyWater = rand(80, 220, 0);
    waterUsage += dailyWater;

    points.push({
      date: new Date(now - i * 24 * 3600 * 1000).toISOString().split("T")[0],
      soil_moisture: parseFloat(moisture.toFixed(1)),
      temperature: parseFloat(temp.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      water_usage_l: dailyWater,
      crop_health: parseFloat(health.toFixed(1)),
      disease_risk: parseFloat(disease.toFixed(1)),
    });
  }

  const avg = (key) => parseFloat((points.reduce((s, p) => s + p[key], 0) / points.length).toFixed(1));

  return mockOk({
    points,
    summary: {
      avg_soil_moisture: avg("soil_moisture"),
      total_water_used_l: Math.round(waterUsage),
      avg_temperature: avg("temperature"),
      crop_health_trend: points[points.length - 1].crop_health >= points[0].crop_health ? "Improving" : "Declining",
    },
  });
}

/* ===========================================================
   PUBLIC API FUNCTIONS (used by page scripts)
   Each checks isMockMode() first, falling back to mock data
   automatically on any network error so the UI never breaks.
   =========================================================== */

async function loginUser(identifier, password) {
  if (isMockMode()) return mockLogin(identifier, password);

  return await apiPost("/auth/login", { identifier, password });
}

async function getDashboardData() {
  if (isMockMode()) return mockDashboard();
  const result = await apiGet("/dashboard");
  return result.ok ? result : mockDashboard();
}

async function getWeather() {
  if (isMockMode()) return mockWeather();
  const result = await apiGet(
  "/weather?latitude=18.172232&longitude=74.5614"
  );
  return result.ok ? result : mockWeather();
}

async function getCrops() {
  if (isMockMode()) return mockCrops();
  const result = await apiGet("/crops");
  return result.ok ? result : mockCrops();
}

async function getCropHealth(cropName) {
  if (isMockMode()) return mockCropHealth(cropName);

  const result = await apiGet("/crop-health/live");
  return result.ok ? result : mockCropHealth(cropName);
}

async function detectDisease(file) {
  if (isMockMode()) return mockDiseaseDetect();

  if (!file) {
    return {
      ok: false,
      status: 400,
      data: null,
      networkError: false,
      message: "No image selected."
    };
  }

  const formData = new FormData();
  formData.append("image", file);

  const token =
  localStorage.getItem("sa_token") ||
  sessionStorage.getItem("sa_token");

  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/plant-image/analyze`,
      {
        method: "POST",
        headers,
        body: formData
      }
    );

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      networkError: false
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      networkError: true,
      message: err.message
    };
  }
}

async function getSensors() {
  if (isMockMode()) return mockSensors();
  const result = await apiGet("/sensors");
  return result.ok ? result : mockSensors();
}

async function getIrrigationStatus() {
  if (isMockMode()) return mockIrrigationStatus();
  const result = await apiGet("/irrigation/status");
  return result.ok ? result : mockIrrigationStatus();
}

async function startIrrigation() {
  if (isMockMode()) {
    localStorage.setItem("sa_manual_irrigation", "ON");
    return mockIrrigationAction("start");
  }

  const result = await apiPost("/irrigation/start");

  if (result.ok) {
    localStorage.setItem("sa_manual_irrigation", "ON");
  }

  return result.ok ? result : mockIrrigationAction("start");
}

async function stopIrrigation() {
  if (isMockMode()) {
    localStorage.setItem("sa_manual_irrigation", "OFF");
    return mockIrrigationAction("stop");
  }

  const result = await apiPost("/irrigation/stop");

  if (result.ok) {
    localStorage.setItem("sa_manual_irrigation", "OFF");
  }

  return result.ok ? result : mockIrrigationAction("stop");
}

async function getAnalytics(rangeDays) {
  if (isMockMode()) return mockAnalytics(rangeDays);
  const result = await apiGet(`/analytics?range=${rangeDays}`);
  return result.ok ? result : mockAnalytics(rangeDays);
}