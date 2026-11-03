(function () {
  "use strict";

  var circumference = 2 * Math.PI * 50;
  var meterConfig = {
    soil: { source: "cardSoilMoisture", unit: "%", percent: function (v) { return v; } },
    humidity: { source: "cardHumidity", unit: "%", percent: function (v) { return v; } },
    temperature: { source: "cardTemperature", unit: "°C", percent: function (v) { return (v / 50) * 100; } },
    health: { source: "cardCropHealth", unit: "%", percent: function (v) { return v; } }
  };

  function firstNumber(text) {
    var match = String(text || "").match(/-?\d+(?:\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
  }

  function displayValue(el, value, unit) {
    if (!el) return;
    var number = value == null ? "--" : (unit === "°C" ? value.toFixed(1) : value.toFixed(1));
    if (el.textContent !== number) el.textContent = number;
  }

  function updateMeter(name) {
    var config = meterConfig[name];
    var ring = document.querySelector('[data-meter="' + name + '"]');
    var source = document.getElementById(config.source);
    if (!ring || !source) return;

    var value = firstNumber(source.textContent);
    var bounded = value == null ? 0 : Math.max(0, Math.min(100, config.percent(value)));
    var progress = ring.querySelector(".ring-progress");
    var bar = ring.parentElement.querySelector(".mini-track i");
    if (progress) progress.style.strokeDashoffset = String(circumference - (circumference * bounded / 100));
    if (bar) bar.style.width = bounded + "%";

    var center = ring.querySelector(".meter-center strong");
    if (center && value != null && name === "health") displayValue(center, value, "%");
    if (center && value != null && name === "temperature") displayValue(center, value, "°C");
    if (center && value != null && (name === "soil" || name === "humidity")) displayValue(center, value, "%");
  }

  function updateQuickStats() {
    document.querySelectorAll("[data-hero-source]").forEach(function (el) {
      var source = document.getElementById(el.dataset.heroSource);
      if (!source) return;
      var text = source.textContent.replace(/\s+/g, " ").trim();
      var number = firstNumber(text);
      if (number == null) { el.textContent = "--"; return; }
      var unit = text.indexOf("°C") >= 0 ? "°C" : "%";
      el.textContent = (unit === "°C" ? number.toFixed(1) : number.toFixed(1)) + unit;
    });
  }

  function refresh() {
    Object.keys(meterConfig).forEach(updateMeter);
    updateQuickStats();
  }

  function init() {
    refresh();
    ["cardSoilMoisture", "cardHumidity", "cardTemperature", "cardCropHealth"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(refresh).observe(el, { childList: true, characterData: true, subtree: true });
    });
    setTimeout(refresh, 1200);
    setTimeout(refresh, 2200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();