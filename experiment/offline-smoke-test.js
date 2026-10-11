// Prueba de humo del modo offline: carga la PWA con red, espera a que el Service Worker
// precachee los activos, corta la red del navegador, recarga y verifica una guía.
// Deja capturas de pantalla en docs/ (evidencia de la interfaz de demostración).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { startServer } = require("../server");

const ROOT = path.join(__dirname, "..");
const PORT = 8935;

(async () => {
  const server = await startServer(PORT);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const url = `http://localhost:${PORT}/app/index.html`;
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "load" }); // ahora la página queda controlada por el SW

  await context.setOffline(true);
  await page.reload({ waitUntil: "load" });  // recarga SIN red: debe servirse desde la caché
  await page.waitForFunction(() => !!window.__gsmiTestHarness);

  // Cuenta de peticiones HTTP emitidas durante la verificación (debe ser 0).
  let requests = 0;
  const seen = []; page.on("request", (r) => { if (/^https?:/.test(r.url())) { requests++; seen.push(r.url()); } }); // blob: es memoria local, no red
  const file = fs.readdirSync(path.join(ROOT, "data", "guides")).filter((f) => f.endsWith(".png"))[0];
  await page.setInputFiles("#file-input", path.join(ROOT, "data", "guides", file));
  await page.waitForSelector(".card.ok");
  const text = await page.textContent("#net-text");
  console.log("Estado de red mostrado:", text);
  console.log("Peticiones durante la verificación offline:", requests, seen);
  fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
  await page.screenshot({ path: path.join(ROOT, "docs", "captura-verificacion-offline.png") });

  await context.setOffline(false);
  const p2 = await context.newPage();
  await p2.setViewportSize({ width: 720, height: 560 });
  await p2.goto(`http://localhost:${PORT}/app/results.html`, { waitUntil: "load" });
  await p2.waitForSelector("table tbody tr");
  await p2.screenshot({ path: path.join(ROOT, "docs", "captura-visor-resultados.png") });

  await browser.close();
  server.close();
  const ok = requests === 0 && /Sin conexión/.test(text);
  console.log(ok ? "OK: verificación offline sin peticiones HTTP." : "FALLÓ la prueba de humo offline.");
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
