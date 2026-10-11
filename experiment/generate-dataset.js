// Fase 3 — Genera 60 guías sintéticas (datos ficticios, sin relación con guías reales).
// ATENCIÓN: usa valores aleatorios; regenerar produce un conjunto DISTINTO al incluido en
// data/guides/ (que es el conjunto canónico con el que se obtuvieron los resultados de
// referencia). Por eso exige --force si ya existe.
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OUT_DIR = path.join(__dirname, "..", "data", "guides");
const N = 60;

if (fs.existsSync(path.join(OUT_DIR, "registros_sinteticos.json")) && !process.argv.includes("--force")) {
  console.error("Ya existe data/guides/. Use --force para regenerar (los resultados de referencia dejarán de coincidir).");
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const randomId = () => crypto.randomBytes(8).toString("hex").toUpperCase();
const pad = (n, len) => String(n).padStart(len, "0");

const records = [];
for (let i = 0; i < N; i++) {
  records.push({
    guide_id: `SYN-GSMI-${pad(i + 1, 4)}-${randomId().slice(0, 6)}`,
    origin_code: `PRED-${pad(1000 + Math.floor(Math.random() * 8999), 4)}`,
    destination_code: `PRED-${pad(1000 + Math.floor(Math.random() * 8999), 4)}`,
    animal_count: 5 + Math.floor(Math.random() * 95),
    issue_date: `2026-0${1 + Math.floor(Math.random() * 8)}-${pad(1 + Math.floor(Math.random() * 27), 2)}`,
    checksum: randomId().slice(0, 8),
  });
}
fs.writeFileSync(path.join(OUT_DIR, "registros_sinteticos.json"), JSON.stringify(records, null, 2));

(async () => {
  for (const r of records) {
    await QRCode.toFile(path.join(OUT_DIR, `${r.guide_id}.png`), JSON.stringify(r), {
      errorCorrectionLevel: "M", type: "png", margin: 4, scale: 8,
    });
  }
  console.log(`Generadas ${records.length} guías sintéticas en ${OUT_DIR}`);
})();
