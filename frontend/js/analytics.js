requireAuth();

let charts = {};

function fmtLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function destroyCharts() {
  Object.keys(charts).forEach(function (key) {
    if (charts[key]) charts[key].destroy();
  });
  charts = {};
}

function makeLineChart(canvasId, labels, datasets) {
  var canvas = document.getElementById(canvasId);
  if (typeof Chart === "undefined") {
    if (canvas && canvas.parentNode) {
      canvas.style.display = "none";
      var fallback = document.createElement("p");
      fallback.className = "chart-fallback-message";
      fallback.textContent = "Charts are unavailable on this older browser. Summary values are still shown above.";
      canvas.parentNode.appendChild(fallback);
    }
    return { options: { scales: { y: { min: 0, max: 100, ticks: {} } } }, update: function () {} };
  }
  var ctx = canvas.getContext("2d");
  return new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) ? 0 : 180 },
      interaction: { intersect: false, mode: "index" },
      plugins: { legend: { display: datasets.length > 1, labels: { color: "#aac0c5", boxWidth: 12, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: "#78949d", maxTicksLimit: 8, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: "#78949d", font: { size: 10 } }, grid: { color: "rgba(91, 143, 151, .16)" } },
      },
      elements: { point: { radius: 0 }, line: { tension: 0.35, borderWidth: 2 } },
    },
  });
}




async function loadAnalytics() {
  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("analyticsContent").style.display = "none";
  document.getElementById("errorState").style.display = "none";

  const rangeDays = parseInt(document.getElementById("rangeSelect").value, 10);
  const result = await getAnalytics(rangeDays);

  if (!result.ok || !result.data) {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorState").style.display = "flex";
    document.getElementById("errorMessage").textContent = friendlyErrorMessage(result);
    return;
  }

  const { points, summary } = result.data;
  const labels = points.map((p) => fmtLabel(p.date));

  document.getElementById("avgMoisture").innerHTML = `${summary.avg_soil_moisture} <span class="unit">%</span>`;
  document.getElementById("avgTemp").innerHTML = `${summary.avg_temperature} <span class="unit">°C</span>`;
 
  document.getElementById("healthTrend").textContent = summary.crop_health_trend;

  destroyCharts();

  charts.moisture = makeLineChart("moistureChart", labels, [
  {
    label: "Soil Moisture (%)",
    data: points.map((p) => p.soil_moisture),
    borderColor: "#2E6E8E",
    backgroundColor: "rgba(46,110,142,0.08)",
    fill: true,
  },
  {
    label: "Minimum (25%)",
    data: labels.map(() => 25),
    borderColor: "#C77B2E",
    borderDash: [6, 6],
    pointRadius: 0,
    fill: false,
  },
  {
    label: "Target (40%)",
    data: labels.map(() => 40),
    borderColor: "#4C7A4F",
    borderDash: [6, 6],
    pointRadius: 0,
    fill: false,
  }
]);

  charts.temp = makeLineChart("tempChart", labels, [{
    label: "Temperature (°C)", data: points.map((p) => p.temperature),
    borderColor: "#C77B2E", backgroundColor: "rgba(199,123,46,0.08)", fill: true,
  }]);

  charts.humidity = makeLineChart("humidityChart", labels, [{
    label: "Humidity (%)", data: points.map((p) => p.humidity),
    borderColor: "#4C7A4F", backgroundColor: "rgba(76,122,79,0.08)", fill: true,
  }]);

  

  charts.health = makeLineChart("healthChart", labels, [{
  label: "Crop Health (%)",
  data: points.map((p) => p.crop_health),
  borderColor: "#3E7C3E",
  backgroundColor: "rgba(62,124,62,0.08)",
  fill: true,
}]);

charts.health.options.scales.y.min = 0;
charts.health.options.scales.y.max = 100;
charts.health.options.scales.y.ticks.stepSize = 20;
charts.health.update();

  

  document.getElementById("loadingState").style.display = "none";
  document.getElementById("analyticsContent").style.display = "block";
}

var rangeSelect = document.getElementById("rangeSelect");
if (rangeSelect) rangeSelect.addEventListener("change", loadAnalytics);
document.addEventListener("DOMContentLoaded", loadAnalytics);