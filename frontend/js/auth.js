const AUTH_KEYS = {
  token: "sa_token",
  user: "sa_user",
  remember: "sa_remember",
};

function isLoggedIn() {
  return !!localStorage.getItem(AUTH_KEYS.token) || !!sessionStorage.getItem(AUTH_KEYS.token);
}

function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_KEYS.user) || sessionStorage.getItem(AUTH_KEYS.user);
  try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}

function saveSession({ token, user, remember }) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem(AUTH_KEYS.token, token);
  store.setItem(AUTH_KEYS.user, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("sa_token");
  localStorage.removeItem("sa_user");

  sessionStorage.removeItem("sa_token");
  sessionStorage.removeItem("sa_user");

  window.location.href = "index.html";
}

/** Works whether the current page is at the root or inside /pages/ */
function resolvePath(target) {
  return window.location.pathname.includes("/pages/") ? `../${target}` : target;
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = resolvePath("login.html");
  }
}

/* ---------------------------------------------------------
   Shared shell: sidebar toggle, logout, profile/notification
   dropdowns, current username label, dark mode restore.
   --------------------------------------------------------- */
function initShell() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("visible");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("visible");
    });
  }

  const logoutHandler = (e) => {
    e.preventDefault();
    logout();
  };
  var logoutButton = document.getElementById("logoutBtn");
  var sidebarLogoutButton = document.getElementById("logoutBtnSidebar");
  if (logoutButton) logoutButton.addEventListener("click", logoutHandler);
  if (sidebarLogoutButton) sidebarLogoutButton.addEventListener("click", logoutHandler);

  const user = getCurrentUser();
  document.querySelectorAll("[data-current-username]").forEach((el) => {
    el.textContent = (user && (user.full_name || user.username)) || "Farmer";
  });

  // ---- Notification dropdown ----
  const notifBtn = document.getElementById("notifBtn");
  const notifPanel = document.getElementById("notifPanel");
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle("open");
      var profilePanelElement = document.getElementById("profilePanel");
      if (profilePanelElement) profilePanelElement.classList.remove("open");
    });
  }

  // ---- Profile dropdown ----
  const profileBtn = document.getElementById("profileBtn");
  const profilePanel = document.getElementById("profilePanel");
  if (profileBtn && profilePanel) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profilePanel.classList.toggle("open");
      var notifPanelElement = document.getElementById("notifPanel");
      if (notifPanelElement) notifPanelElement.classList.remove("open");
    });
  }

  document.addEventListener("click", () => {
    var notifPanelElement = document.getElementById("notifPanel");
      if (notifPanelElement) notifPanelElement.classList.remove("open");
    var profilePanelElement = document.getElementById("profilePanel");
      if (profilePanelElement) profilePanelElement.classList.remove("open");
  });

  // ---- Header search (demo: filters nothing external, just UX-ready) ----
  const searchInput = document.getElementById("headerSearch");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchInput.blur();
      }
    });
  }

  // ---- Dark mode restore ----
  if (localStorage.getItem("sa_dark_mode") === "true") {
    document.body.classList.add("dark-mode");
  }
}

document.addEventListener("DOMContentLoaded", initShell);