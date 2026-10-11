// Verificación cruzada en Node.js: aplica jsQR al mismo arreglo RGBA que devolvería
// CanvasRenderingContext2D.getImageData(). Mide con process.hrtime(). La medición
// principal del trabajo es la del navegador (run-browser-benchmark.js).
const { Jimp } = require("jimp");
const jsQR = require("jsqr");
const fs = require("fs");
const path = require("path");
const { SCENARIOS, degrade } = require("./lib/scenarios");
const { summarize } = require("./lib/stats");

const ROOT = path.join(__dirname, "..");
const GUIDES = path.join(ROOT, "data", "guides");
const records = JSON.parse(fs.readFileSync(path.join(GUIDES, "registros_sinteticos.json"), "utf8"));
const REPEATS = 5;

(async () => {
  const results = [];
  for (const scenario of SCENARIOS) {
    let successes = 0, mismatches = 0;
    const times = [];
    for (const r of records) {
      const base = await Jimp.read(path.join(GUIDES, `${r.guide_id}.png`));
      const img = await degrade(base.clone(), scenario);
      const rgba = new Uint8ClampedArray(img.bitmap.data.buffer, img.bitmap.data.byteOffset, img.bitmap.data.length);
      let first = null;
      for (let t = 0; t < REPEATS; t++) {
        const s = process.hrtime.bigint();
        const out = jsQR(rgba, img.bitmap.width, img.bitmap.height);
        times.push(Number(process.hrtime.bigint() - s) / 1e6);
        if (t === 0) first = out;
      }
      if (first && first.data) {
        successes++;
        try { if (JSON.parse(first.data).guide_id !== r.guide_id) mismatches++; } catch { mismatches++; }
      }
    }
    const row = summarize(scenario, records.length, times, successes, mismatches);
    results.push(row);
    console.log(row);
  }
  const outDir = path.join(ROOT, "results", "latest");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "resultados_node.json"), JSON.stringify(results, null, 2));
  console.log("\nGuardado en results/latest/resultados_node.json");
})();
