requireAuth();



function pestRiskPill(risk) {
  const map = { Low: "pill-good", Moderate: "pill-warn", High: "pill-critical" };
  return `<span class="pill ${map[risk] || "pill-neutral"}">${risk}</span>`;
}

function renderTimeline(currentStageIndex) {
  const el = document.getElementById("growthTimeline");
  el.innerHTML = GROWTH_STAGES.map((stage, i) => {
    let cls = "timeline-step";
    if (i < currentStageIndex) cls += " completed";
    else if (i === currentStageIndex) cls += " current";
    return `
      <div class="${cls}">
        <div class="timeline-dot"></div>
        <div class="timeline-label">${stage}</div>
      </div>
    `;
  }).join("");
}

async function populateCropSelect() {
  const select = document.getElementById("cropSelect");


  const crops = ["Tomato"];

  select.innerHTML = crops
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");

  select.value = "Tomato";
}

async function loadCropHealth() {
  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("healthContent").style.display = "none";
  document.getElementById("errorState").style.display = "none";

  const cropName = document.getElementById("cropSelect").value || "Tomato";
  const result = await getCropHealth(cropName);

  if (!result.ok || !result.data) {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorState").style.display = "flex";
    document.getElementById("errorMessage").textContent = friendlyErrorMessage(result);
    return;
  }

  const d = result.data;

  document.getElementById("valAge").innerHTML = `${d.age_days} <span class="unit">days</span>`;
  document.getElementById("valStage").textContent = d.growth_stage;
  document.getElementById("valHealthScore").innerHTML = `${d.health_score} <span class="unit">%</span>`;
  document.getElementById("valPestRisk").innerHTML = pestRiskPill(d.pest_risk);

  renderTimeline(d.growth_stage_index);

  document.getElementById("soilHealthBar").style.width = `${d.soil_health}%`;
  document.getElementById("soilHealthValue").textContent = `${d.soil_health}%`;

  document.getElementById("nutrientBar").style.width = `${d.nutrient_status}%`;
  document.getElementById("nutrientValue").textContent = `${d.nutrient_status}%`;

  document.getElementById("waterStatusBar").style.width = `${d.water_status}%`;
  document.getElementById("waterStatusValue").textContent = `${d.water_status}%`;

  document.getElementById("loadingState").style.display = "none";
  document.getElementById("healthContent").style.display = "block";
}

document.addEventListener("DOMContentLoaded", async () => {
  await populateCropSelect();
  loadCropHealth();
});