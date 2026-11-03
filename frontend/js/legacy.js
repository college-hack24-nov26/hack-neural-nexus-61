/* Smart Agriculture legacy mode. Keep this file ES3-compatible. */
(function () {
  function byId(id) { return document.getElementById(id); }
  function on(el, event, fn) {
    if (!el) return;
    if (el.addEventListener) el.addEventListener(event, fn, false);
    else if (el.attachEvent) el.attachEvent("on" + event, fn);
    else el["on" + event] = fn;
  }
  function text(el, value) {
    if (!el) return;
    if (typeof el.textContent !== "undefined") el.textContent = value;
    else el.innerText = value;
  }
  function html(el, value) { if (el) el.innerHTML = value; }
  function show(id) { var el = byId(id); if (el) el.style.display = "block"; }
  function hide(id) { var el = byId(id); if (el) el.style.display = "none"; }
  function setValue(id, value) { var el = byId(id); if (el) el.value = value; }
  function storageGet(key) {
    try { return window.localStorage ? localStorage.getItem(key) : null; } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { if (window.localStorage) { localStorage.setItem(key, value); return; } } catch (e) {}
    document.cookie = key + "=" + encodeURIComponent(value) + "; path=/";
  }
  function storageRemove(key) {
    try { if (window.localStorage) localStorage.removeItem(key); } catch (e) {}
    document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }
  function hasSession() { return !!(storageGet("sa_token") || storageGet("sa_legacy_token")); }
  function saveDemoSession() {
    storageSet("sa_legacy_token", "demo");
    storageSet("sa_token", "demo");
    storageSet("sa_user", '{"full_name":"Demo Farmer","username":"farmer"}');
  }
  function logout() {
    storageRemove("sa_token");
    storageRemove("sa_legacy_token");
    storageRemove("sa_user");
    window.location.href = (window.location.pathname.indexOf("/pages/") >= 0) ? "../login.html" : "login.html";
  }
  function path(file) { return window.location.pathname.indexOf("/pages/") >= 0 ? "../" + file : file; }

  function openNotice(title, message) {
    text(byId("infoModalTitle"), title);
    text(byId("infoModalBody"), message);
    show("infoModal");
  }

  function initLogin() {
    if (hasSession()) { window.location.href = "index.html"; return; }
    var form = byId("loginForm");
    var demo = byId("demoLoginBtn");
    var password = byId("password");
    var toggle = byId("togglePassword");
    var close = byId("infoModalClose");
    var create = byId("createAccountLink");
    var forgot = byId("forgotPasswordLink");
    var error = byId("loginError");

    on(toggle, "click", function () {
      if (!password) return;
      password.type = password.type === "text" ? "password" : "text";
    });
    on(close, "click", function () { hide("infoModal"); });
    on(create, "click", function (e) { if (e && e.preventDefault) e.preventDefault(); openNotice("Create account", "Account creation will be available when the farm server is connected."); });
    on(forgot, "click", function (e) { if (e && e.preventDefault) e.preventDefault(); openNotice("Forgot password", "Please contact your farm administrator to reset access."); });
    on(demo, "click", function () { saveDemoSession(); window.location.href = "index.html"; });
    on(form, "submit", function (e) {
      if (e && e.preventDefault) e.preventDefault();
      var identifier = byId("identifier");
      if (!identifier || !identifier.value || !password || !password.value) {
        text(error, "Enter a phone number or username and password.");
        return false;
      }
      saveDemoSession();
      window.location.href = "index.html";
      return false;
    });
  }

  function initShell() {
    var links = document.getElementsByTagName("a");
    var i;
    for (i = 0; i < links.length; i += 1) {
      if (links[i].id === "logoutBtn" || links[i].id === "logoutBtnSidebar" || links[i].id === "settingsLogoutBtn") {
        on(links[i], "click", function (e) { if (e && e.preventDefault) e.preventDefault(); logout(); });
      }
    }
    var names = document.getElementsByTagName("strong");
    for (i = 0; i < names.length; i += 1) {
      if (names[i].getAttribute("data-current-username") !== null) text(names[i], "Farmer");
    }
  }

  function initDashboard() {
    show("dashboardContent"); hide("loadingState"); hide("errorState");
    text(byId("cardSoilMoisture"), "58");
    text(byId("cardHumidity"), "64");
    text(byId("cardTemperature"), "28");
    text(byId("cardCropHealth"), "88");
    text(byId("overviewHealthPct"), "Healthy");
    text(byId("overviewCropName"), "Tomato");
    text(byId("overviewGrowthStage"), "Flowering");
    text(byId("overviewSoilCondition"), "Good");
    text(byId("weatherTemp"), "28°C");
    text(byId("weatherHumidity"), "64%");
    text(byId("weatherRain"), "20%");
    text(byId("weatherWind"), "8 km/h");
    text(byId("weatherCondition"), "Sunny");
    html(byId("cardIrrigation"), "Irrigation OFF");
    html(byId("cardDiseaseRisk"), "Risk Low");
    html(byId("alertsList"), "<p>All monitoring systems are healthy.</p><p>Next check: soil moisture in 2 hours.</p>");
  }

  function initIrrigation() {
    show("irrigationContent"); hide("loadingState"); hide("errorState");
    text(byId("valMoisture"), "58 %");
    text(byId("valWaterLevel"), "76 %");
    text(byId("valTemperature"), "28 °C");
    text(byId("valHumidity"), "64 %");
    text(byId("valRainPrediction"), "20 %");
    text(byId("valIrrigationStatus"), "OFF");
    text(byId("recommendationText"), "Soil moisture is within a healthy range. No irrigation needed right now.");
    on(byId("startBtn"), "click", function () { text(byId("valIrrigationStatus"), "ON"); text(byId("controlHint"), "Irrigation started locally."); });
    on(byId("stopBtn"), "click", function () { text(byId("valIrrigationStatus"), "OFF"); text(byId("controlHint"), "Irrigation stopped locally."); });
  }

  function initCropHealth() {
    show("healthContent"); hide("loadingState"); hide("errorState");
    text(byId("valAge"), "42 days");
    text(byId("valStage"), "Flowering");
    text(byId("valHealthScore"), "88 %");
    text(byId("valPestRisk"), "Low");
    var bars = ["soilHealthBar", "nutrientBar", "waterStatusBar"];
    var vals = [82, 76, 84];
    var i;
    for (i = 0; i < bars.length; i += 1) { if (byId(bars[i])) byId(bars[i]).style.width = vals[i] + "%"; }
  }

  function initDisease() {
    var analyze = byId("analyzeBtn");
    if (analyze) analyze.disabled = false;
    on(analyze, "click", function () {
      show("resultContent"); hide("resultLoading");
      text(byId("diseaseLabel"), "Healthy Leaf");
      text(byId("confidenceValue"), "94%");
      text(byId("symptomsText"), "No visible spots, discoloration, or wilting detected.");
      text(byId("treatmentText"), "No treatment necessary. Continue regular care.");
      text(byId("preventionText"), "Maintain consistent watering and good field airflow.");
      if (byId("confidenceBar")) byId("confidenceBar").style.width = "94%";
    });
  }

  function initAnalytics() {
    hide("loadingState"); show("analyticsContent"); hide("errorState");
    text(byId("avgMoisture"), "58 %");
    text(byId("avgTemp"), "28 °C");
    text(byId("healthTrend"), "Improving");
    var canvases = document.getElementsByTagName("canvas");
    var i;
    for (i = 0; i < canvases.length; i += 1) {
      var message = document.createElement("p");
      message.className = "chart-fallback-message";
      text(message, "Chart view is unavailable on this older browser. Summary values are shown above.");
      if (canvases[i].parentNode) canvases[i].parentNode.appendChild(message);
    }
  }

  function initSettings() {
    on(byId("saveBtn"), "click", function () { show("saveStatus"); });
  }

  function start() {
    var page = window.location.pathname;
    initShell();
    if (page.indexOf("login.html") >= 0 || byId("loginForm")) { initLogin(); return; }
    if (!hasSession()) { window.location.href = path("login.html"); return; }
    if (byId("dashboardContent")) initDashboard();
    else if (byId("irrigationContent")) initIrrigation();
    else if (byId("healthContent")) initCropHealth();
    else if (byId("analyzeBtn")) initDisease();
    else if (byId("analyticsContent")) initAnalytics();
    else if (byId("saveBtn")) initSettings();
  }
  on(window, "load", start);
}());