requireAuth();

const SETTINGS_KEY = "sa_settings";

const DEFAULT_SETTINGS = {
  farmerName: "Ramesh Kumar",
  mobileNumber: "9876543210",
  emailAddress: "farmer@demo.com",
  farmName: "Green Valley Farm",
  farmLocation: "Nashik, India",
  farmSize: 5.5,
  soilType: "Loamy",
  mainCrop: "Tomato",
  language: "en",
  tempUnit: "celsius",
  notifications: true,
  darkMode: false,
};

function loadSettingsFromStorage() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };
  } catch (_) {
    return { ...DEFAULT_SETTINGS };
  }
}

function applySettingsToForm(s) {
  document.getElementById("farmerName").value = s.farmerName;
  document.getElementById("mobileNumber").value = s.mobileNumber;
  document.getElementById("emailAddress").value = s.emailAddress;
  document.getElementById("farmName").value = s.farmName;
  document.getElementById("farmLocation").value = s.farmLocation;
  document.getElementById("farmSize").value = s.farmSize;
  document.getElementById("soilType").value = s.soilType;
  document.getElementById("mainCrop").value = s.mainCrop;
  document.getElementById("languageSelect").value = s.language;
  document.getElementById("tempUnitSelect").value = s.tempUnit;
  document.getElementById("notificationsToggle").checked = s.notifications;
  document.getElementById("darkModeToggle").checked = s.darkMode;
}

function readSettingsFromForm() {
  return {
    farmerName: document.getElementById("farmerName").value.trim(),
    mobileNumber: document.getElementById("mobileNumber").value.trim(),
    emailAddress: document.getElementById("emailAddress").value.trim(),
    farmName: document.getElementById("farmName").value.trim(),
    farmLocation: document.getElementById("farmLocation").value.trim(),
    farmSize: parseFloat(document.getElementById("farmSize").value) || 0,
    soilType: document.getElementById("soilType").value,
    mainCrop: document.getElementById("mainCrop").value,
    language: document.getElementById("languageSelect").value,
    tempUnit: document.getElementById("tempUnitSelect").value,
    notifications: document.getElementById("notificationsToggle").checked,
    darkMode: document.getElementById("darkModeToggle").checked,
  };
}

function applyDarkMode(enabled) {
  document.body.classList.toggle("dark-mode", enabled);
  localStorage.setItem("sa_dark_mode", enabled ? "true" : "false");
}

// ---- Initial load ----
const initialSettings = loadSettingsFromStorage();
applySettingsToForm(initialSettings);
applyDarkMode(initialSettings.darkMode);

// ---- Live dark mode preview (applies immediately, saved on Save) ----
document.getElementById("darkModeToggle").addEventListener("change", (e) => {
  applyDarkMode(e.target.checked);
});

// ---- Save changes ----
document.getElementById("saveBtn").addEventListener("click", () => {
  const updated = readSettingsFromForm();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  applyDarkMode(updated.darkMode);

  const saveStatus = document.getElementById("saveStatus");
  saveStatus.style.display = "inline";
  setTimeout(() => (saveStatus.style.display = "none"), 3000);
});

// ---- Demo password change ----
document.getElementById("changePasswordBtn").addEventListener("click", () => {
  const errorEl = document.getElementById("passwordChangeError");
  const current = document.getElementById("currentPassword").value;
  const next = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  errorEl.textContent = "";

  if (!current || !next || !confirm) {
    errorEl.textContent = "Please fill in all three password fields.";
    return;
  }
  if (next.length < 6) {
    errorEl.textContent = "New password must be at least 6 characters.";
    return;
  }
  if (next !== confirm) {
    errorEl.textContent = "New password and confirmation do not match.";
    return;
  }

  errorEl.style.color = "var(--color-good)";
  errorEl.textContent = "✓ Password updated (demo mode — no real account was changed).";
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
});

// ---- Logout button inside Security section ----
document.getElementById("settingsLogoutBtn").addEventListener("click", () => logout());