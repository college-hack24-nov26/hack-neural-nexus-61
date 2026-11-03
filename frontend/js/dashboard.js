requireAuth();

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return "--";
  }
}

function alertDotClass(level) {
  if (level === "red") return "red";
  if (level === "yellow") return "yellow";
  if (level === "green") return "green";
  return "info";
}

function riskPillClass(risk) {
  if (risk === "Low") return "pill-good";
  if (risk === "Moderate") return "pill-warn";
  if (risk === "High") return "pill-critical";
  return "pill-neutral";
}

async function loadDashboard() {
  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("dashboardContent").style.display = "none";
  document.getElementById("errorState").style.display = "none";

  const [dashRes, weatherRes] = await Promise.all([
    getDashboardData(),
    getWeather()
  ]);

  if (!dashRes.ok || !dashRes.data) {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorState").style.display = "flex";
    document.getElementById("errorMessage").textContent =
      friendlyErrorMessage(dashRes);
    return;
  }

  const d = dashRes.data;

  // -----------------------------
  // REAL BACKEND DATA
  // -----------------------------

  const sensors = d.sensors || d.readings || {};
  const irrigation = d.irrigation || { status: d.irrigation_status };
  const healthRaw = d.crop_health != null ? d.crop_health : (d.health != null ? d.health : {});
  const health = typeof healthRaw === "number"
    ? { confidence: healthRaw, disease: null }
    : healthRaw;
  const numberValue = (...values) => {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))) {
        return Number(value);
      }
    }
    return 0;
  };
  const cropName =
  typeof d.crop === "string"
    ? d.crop
    : (d.crop && d.crop.name) || "tomato";

  const soilMoisture = numberValue(sensors.soil_moisture, d.soil_moisture, d.soilMoisture);
  const temperature = numberValue(sensors.temperature, d.temperature);
  const humidity = numberValue(sensors.humidity, d.humidity);
  const diseaseConfidence = Number(health.confidence != null ? health.confidence : 0);

  // -----------------------------
  // TOP DASHBOARD CARDS
  // -----------------------------

  document.getElementById("cardCropHealth").innerHTML =
  health.disease
    ? `${health.disease}<div style="font-size:14px; margin-top:8px; font-family:Arial, sans-serif;">
        ${diseaseConfidence.toFixed(2)}% confidence
      </div>`
    : (health.confidence != null
      ? `${diseaseConfidence.toFixed(2)}% health score`
      : "No disease detected");

  document.getElementById("cardSoilMoisture").innerHTML =
    `${soilMoisture.toFixed(1)} <span class="unit">%</span>`;

  document.getElementById("cardTemperature").innerHTML =
    `${temperature.toFixed(1)} <span class="unit">°C</span>`;

  document.getElementById("cardHumidity").innerHTML =
    `${humidity.toFixed(1)} <span class="unit">%</span>`;

  // -----------------------------
// IRRIGATION
// -----------------------------

const manualStatus = localStorage.getItem("sa_manual_irrigation");

const irrigationStatus =
  manualStatus || irrigation.status || "OFF";

const on = irrigationStatus === "ON";

  document.getElementById("cardIrrigation").innerHTML = on
    ? `<span class="pill pill-info">💧 ON</span>`
    : `<span class="pill pill-neutral">OFF</span>`;

  // -----------------------------
  // DISEASE RISK
  // -----------------------------

  let diseaseRisk = "Low";

  if (diseaseConfidence >= 80) {
    diseaseRisk = "High";
  } else if (diseaseConfidence >= 50) {
    diseaseRisk = "Moderate";
  }

  document.getElementById("cardDiseaseRisk").innerHTML =
    `<span class="pill ${riskPillClass(diseaseRisk)}">${diseaseRisk}</span>`;

  // -----------------------------
  // CROP OVERVIEW
  // -----------------------------

  document.getElementById("overviewCropName").textContent =
    cropName.charAt(0).toUpperCase() + cropName.slice(1);

  document.getElementById("overviewGrowthStage").textContent =
    "Monitoring";

  document.getElementById("overviewHealthPct").textContent =
    diseaseConfidence >= 90 ? "Needs Attention" : "Monitoring";

  document.getElementById("overviewSoilCondition").textContent =
    soilMoisture < 25
      ? "Dry"
      : soilMoisture < 40
        ? "Below target"
        : "Good";

  document.getElementById("fieldChip")
    .querySelector(".field-crop")
    .textContent = `· ${cropName} Crop`;

  // -----------------------------
  // ALERTS
  // -----------------------------

  const alertsList = document.getElementById("alertsList");
  const notifList = document.getElementById("notifList");
  const notifBadge = document.getElementById("notifBadge");

  const alerts = [];

  if (soilMoisture < 25) {
    alerts.push({
      level: "red",
      message: "Soil moisture is below the minimum level.",
      timestamp: d.timestamp
    });
  }

  if (irrigationStatus === "ON") {
    alerts.push({
      level: "yellow",
      message: "Irrigation is currently ON.",
      timestamp: d.timestamp
    });
  }

  if (health.disease) {
    alerts.push({
      level: diseaseConfidence >= 80 ? "red" : "yellow",
      message:
        `${health.disease.replaceAll("_", " ")} detected with ` +
        `${diseaseConfidence.toFixed(2)}% confidence.`,
      timestamp: health.timestamp || d.timestamp
    });
  }

  if (alerts.length) {
    alertsList.innerHTML = alerts.map(a => `
      <div class="alert-item">
        <div class="alert-dot ${alertDotClass(a.level)}"></div>
        <div>
          <div class="alert-text">${escapeHtml(a.message)}</div>
          <div class="alert-time">${fmtTime(a.timestamp)}</div>
        </div>
      </div>
    `).join("");

    notifList.innerHTML = alerts.map(a => `
      <div class="dropdown-item" style="white-space:normal; line-height:1.4;">
        <div class="alert-dot ${alertDotClass(a.level)}"
             style="display:inline-block; margin-right:6px;"></div>
        ${escapeHtml(a.message)}
      </div>
    `).join("");

    notifBadge.style.display = "inline-block";
  } else {
    alertsList.innerHTML =
      `<div class="state-box"><span class="state-icon">✅</span>No active alerts right now.</div>`;

    notifList.innerHTML =
      `<div class="dropdown-item">No new notifications.</div>`;

    notifBadge.style.display = "none";
  }

  // -----------------------------
  // WEATHER
  // -----------------------------

  if (weatherRes.ok && weatherRes.data) {
    const w = weatherRes.data;

    const current = w.current || w || {};
    const hourly = w.hourly || {};

    const weatherTemperature =
      current.temperature_2m != null ? current.temperature_2m : (current.temperature != null ? current.temperature : "--");

    const weatherHumidity =
      current.relative_humidity_2m != null ? current.relative_humidity_2m : (current.humidity != null ? current.humidity : "--");

    const rainProbability =
      (hourly.precipitation_probability && hourly.precipitation_probability.length ? hourly.precipitation_probability[0] : (w.rain_probability != null ? w.rain_probability : 0));

    document.getElementById("weatherTemp").textContent =
      `${weatherTemperature}°C`;

    document.getElementById("weatherHumidity").textContent =
      `${weatherHumidity}%`;

    document.getElementById("weatherRain").textContent =
      `${rainProbability}%`;

    document.getElementById("weatherWind").textContent =
      `${w.wind_speed != null ? w.wind_speed : "--"} km/h`;

    document.getElementById("weatherCondition").textContent =
      w.condition || "Forecast available";
  }

  // -----------------------------
  // SHOW DASHBOARD
  // -----------------------------

  document.getElementById("loadingState").style.display = "none";
  document.getElementById("dashboardContent").style.display = "block";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Logout link inside the profile dropdown (separate id from sidebar logout)
var logoutDropdownButton = document.getElementById("logoutBtnDropdown");
if (logoutDropdownButton) logoutDropdownButton.addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

document.addEventListener("DOMContentLoaded", loadDashboard);