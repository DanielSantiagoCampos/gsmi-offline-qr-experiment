// Medición principal: carga la PWA en un Chromium real (Playwright) y ejecuta el MISMO
// decodeImageElement() de app/app.js sobre cada imagen degradada, midiendo con
// performance.now() del propio navegador (drawImage + getImageData + jsQR).
//
// Chromium: por defecto el que instala Playwright (npx playwright install chromium).
// Para usar uno existente:  CHROMIUM_PATH=/ruta/al/chrome npm run benchmark:browser
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { startServer } = require("../server");
const { SCENARIOS } = require("./lib/scenarios");
const { summarize } = require("./lib/stats");

const ROOT = path.join(__dirname, "..");
const records = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "guides", "registros_sinteticos.json"), "utf8"));
const REPEATS = 5;
const PORT = 8934;

(async () => {
  if (!fs.existsSync(path.join(ROOT, "data", "degraded"))) {
    console.error("Falta data/degraded/. Ejecute primero: npm run dataset:degrade");
    process.exit(1);
  }
  const server = await startServer(PORT);
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/app/index.html`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__gsmiTestHarness);

  const results = [];
  for (const scenario of SCENARIOS) {
    let successes = 0, mismatches = 0;
    const times = [];
    for (const r of records) {
      const url = `http://localhost:${PORT}/data/degraded/${scenario}/${r.guide_id}.png`;
      for (let t = 0; t < REPEATS; t++) {
        const out = await page.evaluate(async (u) => {
          const img = new Image();
          img.src = u;
          await img.decode();
          return window.__gsmiTestHarness.decodeImageElement(img);
        }, url);
        times.push(out.ms);
        if (t === 0 && out.success) {
          successes++;
          try { if (JSON.parse(out.value).guide_id !== r.guide_id) mismatches++; } catch { mismatches++; }
        }
      }
    }
    const row = summarize(scenario, records.length, times, successes, mismatches);
    results.push(row);
    console.log(row);
  }

  const outDir = path.join(ROOT, "results", "latest");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "resultados_browser.json"), JSON.stringify(results, null, 2));
  const userAgent = await page.evaluate(() => navigator.userAgent);
  fs.writeFileSync(path.join(outDir, "browser_info.json"), JSON.stringify({ userAgent }, null, 2));
  await browser.close();
  server.close();
  console.log("\nGuardado en results/latest/resultados_browser.json");
})().catch((e) => { console.error(e); process.exit(1); });
