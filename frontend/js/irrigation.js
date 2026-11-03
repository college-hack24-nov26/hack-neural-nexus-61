function loadSchedules() {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveSchedules(schedules) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
}
requireAuth();


const SCHEDULE_KEY = "sa_irrigation_schedules";
let currentStatus = "OFF";
const irrigationScene = document.getElementById("irrigationScene");
const irrigationLivePill = document.getElementById("irrigationLivePill");

async function loadIrrigation() {
  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("irrigationContent").style.display = "none";
  document.getElementById("errorState").style.display = "none";

  const result = await getDashboardData();

  if (!result.ok || !result.data) {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorState").style.display = "flex";
    document.getElementById("errorMessage").textContent =
      friendlyErrorMessage(result);
    return;
  }

  const d = result.data;
  const sensors = d.sensors || {};
  const weather = d.weather || {};
  const irrigation = d.irrigation || {};

  // Real sensor data
  document.getElementById("valMoisture").innerHTML =
    `${Number((sensors.soil_moisture != null ? sensors.soil_moisture : 0)).toFixed(1)} <span class="unit">%</span>`;

  document.getElementById("valTemperature").innerHTML =
    `${Number((sensors.temperature != null ? sensors.temperature : 0)).toFixed(1)} <span class="unit">°C</span>`;

  document.getElementById("valHumidity").innerHTML =
    `${Number((sensors.humidity != null ? sensors.humidity : 0)).toFixed(1)} <span class="unit">%</span>`;

  // Real weather prediction
  document.getElementById("valRainPrediction").innerHTML =
    `${Number((weather.rain_probability != null ? weather.rain_probability : 0)).toFixed(0)} <span class="unit">%</span>`;

  // Water level is not provided by the current backend
  document.getElementById("valWaterLevel").innerHTML =
    `-- <span class="unit">%</span>`;

  // Irrigation status
  const manualStatus = localStorage.getItem("sa_manual_irrigation");

  if (manualStatus) {
    setStatusPill(manualStatus);
  } else {
    setStatusPill(irrigation.status || "OFF");
  }

  document.getElementById("recommendationText").textContent =
    irrigation.reason || irrigation.recommendation || "No recommendation available.";

  renderSchedules();

  document.getElementById("loadingState").style.display = "none";
  document.getElementById("irrigationContent").style.display = "block";
}

function saveSchedules(schedules) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
}

function renderSchedules() {
  const schedules = loadSchedules();
  const list = document.getElementById("scheduleList");

  if (!schedules.length) {
    list.innerHTML = `<div class="state-box"><span class="state-icon">🗓️</span>No irrigation schedules yet. Add one above.</div>`;
    return;
  }

  list.innerHTML = schedules.map((s, i) => `
    <div class="alert-item">
      <div class="alert-dot info"></div>
      <div style="flex:1;">
        <div class="alert-text"><strong>${s.crop}</strong> — ${s.date} at ${s.time} for ${s.duration} minutes</div>
      </div>
      <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.8rem;" data-remove-index="${i}">Remove</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-remove-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-remove-index"), 10);
      const updated = loadSchedules();
      updated.splice(idx, 1);
      saveSchedules(updated);
      renderSchedules();
    });
  });
}

document.getElementById("scheduleForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const schedules = loadSchedules();
  schedules.push({
    date: document.getElementById("schedDate").value,
    time: document.getElementById("schedTime").value,
    duration: document.getElementById("schedDuration").value,
    crop: document.getElementById("schedCrop").value,
  });
  saveSchedules(schedules);
  renderSchedules();
  e.target.reset();
  document.getElementById("schedDuration").value = 15;
});

function setStatusPill(status) {
  currentStatus = status;
  const on = status === "ON";
  document.getElementById("valIrrigationStatus").innerHTML = on
    ? `<span class="pill pill-info">💧 IRRIGATION ON</span>`
    : `<span class="pill pill-neutral">IRRIGATION OFF</span>`;

  if (irrigationScene) irrigationScene.classList.toggle("is-running", on);
  if (irrigationLivePill) {
    irrigationLivePill.classList.toggle("is-running", on);
    irrigationLivePill.innerHTML = on
      ? "<span></span> Irrigation active"
      : "<span></span> System idle";
  }
}



/* ---------------------------------------------------------
   Manual controls
   --------------------------------------------------------- */
const autoToggle = document.getElementById("autoIrrigationToggle");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const controlHint = document.getElementById("controlHint");

function updateControlAvailability() {
  const autoOn = autoToggle.checked;
  startBtn.disabled = autoOn;
  stopBtn.disabled = autoOn;
  controlHint.textContent = autoOn
    ? "Auto irrigation is ON — manual Start/Stop is disabled. Turn it off to control irrigation manually."
    : "Auto irrigation is OFF — use Start/Stop to control irrigation manually.";
}

autoToggle.addEventListener("change", () => {
  localStorage.setItem("sa_auto_irrigation", autoToggle.checked ? "true" : "false");
  updateControlAvailability();
});

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  const result = await startIrrigation();
  startBtn.disabled = false;
  if (result.ok) setStatusPill("ON");
});

stopBtn.addEventListener("click", async () => {
  stopBtn.disabled = true;
  const result = await stopIrrigation();
  stopBtn.disabled = false;
  if (result.ok) setStatusPill("OFF");
});

// Restore auto-irrigation toggle preference
autoToggle.checked = localStorage.getItem("sa_auto_irrigation") === "true";
updateControlAvailability();

document.addEventListener("DOMContentLoaded", loadIrrigation);