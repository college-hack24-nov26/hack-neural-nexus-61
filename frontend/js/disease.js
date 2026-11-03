requireAuth();

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const previewWrap = document.getElementById("previewWrap");
const previewImg = document.getElementById("previewImg");
const analyzeBtn = document.getElementById("analyzeBtn");
const uploadError = document.getElementById("uploadError");
const scanStage = document.getElementById("scanStage");
const scanStatusText = document.getElementById("scanStatusText");
const pipelineSteps = document.querySelectorAll(".pipeline-step");

let selectedFile = null;

function updateScanState(state, label) {
  scanStage.classList.remove("has-preview", "is-scanning", "is-complete", "has-error");
  if (state) scanStage.classList.add(state);
  if (label) scanStatusText.textContent = label;

  pipelineSteps.forEach((step, index) => {
    step.classList.toggle("active", index === 0 && state !== "is-scanning" && state !== "is-complete");
    step.classList.toggle("processing", index === 1 && state === "is-scanning");
    step.classList.toggle("complete", index < 2 && state === "is-complete");
    step.classList.toggle("complete", index === 2 && state === "is-complete");
  });
}

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  uploadError.textContent = "";

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowed.includes(file.type)) {
    uploadError.textContent = "Please upload a JPEG, PNG, or WEBP image.";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    uploadError.textContent = "Image is too large. Maximum size is 8MB.";
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewWrap.classList.add("visible");
  };
  reader.readAsDataURL(file);

  analyzeBtn.disabled = false;
  updateScanState("has-preview", "Leaf image ready for analysis");

  // Reset any previous result while a new image is staged
  document.getElementById("resultEmpty").style.display = "flex";
  document.getElementById("resultContent").style.display = "none";
}

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  document.getElementById("resultEmpty").style.display = "none";
  document.getElementById("resultContent").style.display = "none";
  document.getElementById("resultLoading").style.display = "flex";
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Scanning leaf...";
  updateScanState("is-scanning", "Scanning leaf texture and color signals...");

  // Simulated processing delay so the loading state is visible (demo mode)
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const result = await detectDisease(selectedFile);

  document.getElementById("resultLoading").style.display = "none";
  analyzeBtn.disabled = false;
  analyzeBtn.textContent = "Analyze Image";

  if (!result.ok || !result.data) {
    updateScanState("has-error", "Scan could not be completed. Try again.");
    document.getElementById("resultEmpty").style.display = "flex";
    uploadError.textContent = friendlyErrorMessage(result);
    return;
  }

  const d = result.data;
const prediction = d.prediction || {};
const recommendation = d.recommendation || {};

const disease = prediction.disease || "Unknown";
const confidence = Number(prediction.confidence || 0);

const recommendations = recommendation.recommendations || [];

document.getElementById("diseaseLabel").textContent = disease;

document.getElementById("confidenceValue").textContent =
  `${confidence.toFixed(1)}% confidence`;

document.getElementById("confidenceBar").style.width =
  `${Math.min(confidence, 100)}%`;

document.getElementById("symptomsText").textContent =
  recommendations[0] || "No symptom information available.";

document.getElementById("treatmentText").textContent =
  recommendations[0] || "Follow the recommended crop-care practices.";

document.getElementById("preventionText").textContent =
  recommendations[1] ||
  "Maintain good field airflow and monitor the crop regularly.";

  document.getElementById("resultContent").style.display = "block";
  updateScanState("is-complete", "Analysis complete — review the recommendation");
});