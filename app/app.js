// app.js — pipeline de captura y decodificación offline del código QR de la GSMI.
// Núcleo: <input type="file"> -> HTML5 Canvas (drawImage/getImageData) -> jsQR -> IndexedDB.
// decodeImageElement() y saveGuide() no realizan ninguna petición de red. La galería de
// guías de prueba SÍ hace peticiones al servidor local, pero solo para obtener las
// imágenes de demostración; no forma parte del flujo de verificación medido.

const canvas = document.getElementById("capture-canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const fileInput = document.getElementById("file-input");
const resultBox = document.getElementById("result");
const savedList = document.getElementById("saved");
const galleryBox = document.getElementById("gallery");

// Decodifica el QR de un <img> ya cargado: lo dibuja en el canvas local y lee la matriz
// de píxeles con getImageData(); costo O(n) en el número de píxeles.
function decodeImageElement(imageEl) {
  const w = imageEl.naturalWidth || imageEl.videoWidth;
  const h = imageEl.naturalHeight || imageEl.videoHeight;
  canvas.width = w;
  canvas.height = h;
  const t0 = performance.now();
  ctx.drawImage(imageEl, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const decoded = jsQR(imageData.data, imageData.width, imageData.height);
  const t1 = performance.now();
  return { success: !!decoded, value: decoded ? decoded.data : null, ms: t1 - t0 };
}

async function verifyBlob(blob) {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();
  const result = decodeImageElement(img);
  URL.revokeObjectURL(url);

  if (!result.success) return renderError();
  let parsed;
  try { parsed = JSON.parse(result.value); } catch { parsed = { raw: result.value }; }
  await window.GsmiOfflineDB.saveGuide({
    guideId: parsed.guide_id || `SIN-ID-${Date.now()}`,
    rawQrValue: result.value,
    fileBlob: blob,
    capturedAt: new Date().toISOString(),
  });
  renderResult(parsed, result.ms);
  refreshSaved();
}

const LABELS = {
  guide_id: "Identificador de guía", origin_code: "Predio de origen", destination_code: "Predio de destino",
  animal_count: "Número de animales", issue_date: "Fecha de expedición", checksum: "Checksum",
};
function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

function renderResult(parsed, ms) {
  const rows = Object.entries(parsed).map(([k, v]) => `<tr><td>${esc(LABELS[k] || k)}</td><td>${esc(v)}</td></tr>`).join("");
  resultBox.innerHTML = `<div class="card ok"><div class="ok-title">✔ Guía verificada offline en ${ms.toFixed(1)} ms</div><table class="kv">${rows}</table></div>`;
}
function renderError() {
  resultBox.innerHTML = `<div class="card error"><div class="err-title">✖ No se pudo leer el código QR</div><div>Verifique enfoque e iluminación e intente de nuevo. (Con desenfoque severo la tasa de éxito del experimento cae a 0 %.)</div></div>`;
}

async function refreshSaved() {
  const guides = await window.GsmiOfflineDB.listGuides();
  if (!guides.length) { savedList.innerHTML = "<li>Sin registros todavía.</li>"; return; }
  savedList.innerHTML = guides
    .sort((a, b) => b.captured_at.localeCompare(a.captured_at))
    .map((g) => `<li><span>${esc(g.guide_id)}</span><span>${new Date(g.captured_at).toLocaleTimeString()}</span></li>`).join("");
}

fileInput.addEventListener("change", (e) => { if (e.target.files[0]) verifyBlob(e.target.files[0]); });

// ---- Galería de demostración (datos sintéticos) ----
const SCENARIO_LABELS = {
  clean: "clean — imagen nítida", rotate_15: "rotate_15 — rotación 15°", blur_light: "blur_light — desenfoque leve",
  blur_medium: "blur_medium — desenfoque medio", blur_heavy: "blur_heavy — desenfoque severo",
  low_res: "low_res — baja resolución", low_contrast: "low_contrast — bajo contraste", worst_case: "worst_case — combinado",
};
async function buildGallery() {
  try {
    const records = await (await fetch("../data/guides/registros_sinteticos.json")).json();
    const section = (title, items) => `<div class="scenario">${title}</div><div class="grid">${items}</div>`;
    const btn = (src, id) => `<button data-src="${src}" title="${id}"><img src="${src}" alt="${id}" loading="lazy"></button>`;
    let html = section("60 guías sintéticas (imagen nítida)", records.map((r) => btn(`../data/guides/${r.guide_id}.png`, r.guide_id)).join(""));
    for (const [sc, label] of Object.entries(SCENARIO_LABELS)) {
      html += section(`Muestras degradadas · ${label}`, records.slice(0, 3).map((r) => btn(`../data/samples/${sc}/${r.guide_id}.png`, r.guide_id)).join(""));
    }
    galleryBox.innerHTML = html;
    galleryBox.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-src]");
      if (!b) return;
      verifyBlob(await (await fetch(b.dataset.src)).blob());
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } catch {
    galleryBox.innerHTML = '<p class="lead">La galería requiere el servidor local (npm start). Puede usar el selector de archivo.</p>';
  }
}

// ---- Estado de red ----
function updateNet() {
  const on = navigator.onLine;
  document.getElementById("net-status").className = "status " + (on ? "online" : "offline");
  document.getElementById("net-text").textContent = on ? "En línea" : "Sin conexión — modo offline activo";
}
window.addEventListener("online", updateNet);
window.addEventListener("offline", updateNet);
updateNet();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("./service-worker.js").catch(() => {}); });
}
refreshSaved();
buildGallery();

// Expuesto para el arnés de medición (experiment/run-browser-benchmark.js).
window.__gsmiTestHarness = { decodeImageElement };
