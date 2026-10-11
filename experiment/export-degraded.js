// Exporta las imágenes degradadas (8 escenarios x 60 guías = 480 PNG, ~70 MB) a data/degraded/
// para que el arnés de Chromium las cargue por HTTP. Además copia 3 guías por escenario
// a data/samples/ (incluidas en el repositorio) para la galería de la demostración.
const { Jimp } = require("jimp");
const fs = require("fs");
const path = require("path");
const { SCENARIOS, degrade } = require("./lib/scenarios");

const ROOT = path.join(__dirname, "..");
const GUIDES = path.join(ROOT, "data", "guides");
const records = JSON.parse(fs.readFileSync(path.join(GUIDES, "registros_sinteticos.json"), "utf8"));
const SAMPLE_COUNT = 3;

(async () => {
  for (const scenario of SCENARIOS) {
    const dir = path.join(ROOT, "data", "degraded", scenario);
    const sampleDir = path.join(ROOT, "data", "samples", scenario);
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(sampleDir, { recursive: true });
    for (let i = 0; i < records.length; i++) {
      const img = await Jimp.read(path.join(GUIDES, `${records[i].guide_id}.png`));
      const out = await degrade(img, scenario);
      const file = path.join(dir, `${records[i].guide_id}.png`);
      await out.write(file);
      if (i < SAMPLE_COUNT) fs.copyFileSync(file, path.join(sampleDir, `${records[i].guide_id}.png`));
    }
    console.log("Exportado escenario:", scenario);
  }
})();
