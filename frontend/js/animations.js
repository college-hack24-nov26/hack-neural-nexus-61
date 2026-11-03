/* =========================================================
   animations.js
   Small, dependency-free motion helpers layered on top of the
   existing pages. Safe to include everywhere: every function
   guards for missing elements so it never throws on pages that
   don't have a given widget.
   ========================================================= */
(function () {
  "use strict";

  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var lowPowerDevice = !!(
    (connection && connection.saveData) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
  );
  if (lowPowerDevice) {
    document.documentElement.className += " low-power-device";
  }
  var prefersReducedMotion =
    lowPowerDevice ||
    (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- 1. Kick the staggered card-reveal animation ---------- */
  function triggerReveal() {
    // Wait a tick so freshly-rendered dashboard/chart content is in the DOM
    requestAnimationFrame(function () {
      document.body.classList.add("anim-ready");
    });
  }

  /* ---------- 2. Animate numbers counting up when they change ---------- */
  // Watches elements for text-content changes (e.g. "-- %" -> "62 %")
  // and animates the numeric portion from 0 (or its old value) upward.
  function animateNumber(el, newText) {
    if (prefersReducedMotion) { el.textContent = newText; return; }

    var match = newText.match(/-?\d+(\.\d+)?/);
    if (!match) { el.textContent = newText; return; }

    var target = parseFloat(match[0]);
    var prefix = newText.slice(0, match.index);
    var suffix = newText.slice(match.index + match[0].length);
    var decimals = (match[0].split(".")[1] || "").length;
    var duration = 700;
    var startTime = null;
    var startVal = 0;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      // ease-out-cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = startVal + (target - startVal) * eased;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = newText;
      }
    }
    requestAnimationFrame(step);
  }

  function watchMetricCounters() {
  var selectors = [
    "#cardCropHealth",
    "#cardSoilMoisture",
    "#cardTemperature",
    "#cardHumidity",
    "#weatherTemp",
    "#weatherHumidity",
    "#weatherRain",
    "#weatherWind",
    "#overviewHealthPct"
  ];

  selectors.forEach(function (sel) {
    var el = document.querySelector(sel);
    if (!el) return;

    var lastText = el.textContent;
    var animating = false;

    var observer = new MutationObserver(function () {
      if (animating) return;

      var newText = el.textContent;

      if (
        newText !== lastText &&
        /\d/.test(newText) &&
        !/--/.test(newText)
      ) {
        lastText = newText;
        animating = true;

        animateNumber(el, newText);

        setTimeout(function () {
          lastText = el.textContent;
          animating = false;
        }, 750);
      } else {
        lastText = newText;
      }
    });

    observer.observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });
}

  /* ---------- 3. Animate bar/gauge fills from 0 to their target width ---------- */
  function animateFillBars() {
    var bars = document.querySelectorAll(".bar-fill, .gauge-fill, .pred-bar-fill");
    bars.forEach(function (bar) {
      if (bar.dataset.animInit) return;
      bar.dataset.animInit = "1";
      var observer = new MutationObserver(function () {
        // no-op placeholder; width transition handled by CSS transition already
      });
      observer.observe(bar, { attributes: true, attributeFilter: ["style"] });

      // Ensure a fresh element starts from 0 then transitions to its set width
      var targetWidth = bar.style.width;
      if (targetWidth) {
        bar.style.width = "0%";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            bar.style.width = targetWidth;
          });
        });
      }
    });
  }

  /* ---------- 4. Ripple effect on .btn clicks ---------- */
  function wireButtonRipples() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".btn");
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      btn.style.setProperty("--rx", (e.clientX - rect.left) + "px");
      btn.style.setProperty("--ry", (e.clientY - rect.top) + "px");
      btn.classList.remove("rippling");
      // force reflow so the animation can restart on rapid clicks
      void btn.offsetWidth;
      btn.classList.add("rippling");
      setTimeout(function () { btn.classList.remove("rippling"); }, 600);
    });
  }

  /* ---------- 5. Ambient floating leaves on the dashboard hero ---------- */
  function spawnAmbientLeaves() {
    if (prefersReducedMotion) return;
    if (!document.body.matches) return;
    // Only on the main dashboard, and only if not already added
    if (!document.getElementById("dashboardContent")) return;
    if (document.querySelector(".leaf-ambient")) return;

    var glyphs = ["🍃", "🌿", "🍂"];
    var count = 6;
    for (var i = 0; i < count; i++) {
      var span = document.createElement("span");
      span.className = "leaf-ambient";
      span.setAttribute("aria-hidden", "true");
      span.textContent = glyphs[i % glyphs.length];
      span.style.left = (Math.random() * 96 + 2) + "vw";
      span.style.animationDuration = (14 + Math.random() * 10) + "s";
      span.style.animationDelay = (Math.random() * -20) + "s";
      span.style.fontSize = (1 + Math.random() * 0.8) + "rem";
      document.body.appendChild(span);
    }
  }

  /* ---------- 6. Fade the loading spinner out / content in smoothly ---------- */
  function watchLoadingSwap() {
    var loading = document.getElementById("loadingState");
    var content = document.getElementById("dashboardContent");
    if (!loading || !content) return;
    var observer = new MutationObserver(function () {
      if (content.style.display !== "none") {
        triggerReveal();
        animateFillBars();
      }
    });
    observer.observe(content, { attributes: true, attributeFilter: ["style"] });
  }

  /* ---------- Init ---------- */
  function init() {
    triggerReveal();
    watchMetricCounters();
    animateFillBars();
    wireButtonRipples();
    spawnAmbientLeaves();
    watchLoadingSwap();

    // Re-run fill-bar + reveal animations whenever other scripts
    // repaint big chunks of the page (e.g. after fetch completes).
    var mainObserver = new MutationObserver(function () {
      animateFillBars();
    });
    var target = document.querySelector(".content") || document.body;
    mainObserver.observe(target, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();