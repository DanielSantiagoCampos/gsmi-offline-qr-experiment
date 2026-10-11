// Compara results/latest/ (su ejecución) con results/reference/ (los valores reportados
// en el documento). La tasa de éxito es determinista dado el conjunto de datos: debe
// coincidir EXACTAMENTE. Los tiempos dependen del hardware: solo se muestran lado a lado.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
let failed = false;

for (const file of ["resultados_browser.json", "resultados_node.json"]) {
  const refPath = path.join(ROOT, "results", "reference", file);
  const latestPath = path.join(ROOT, "results", "latest", file);
  if (!fs.existsSync(latestPath)) { console.log(`(omitido) no existe results/latest/${file}`); continue; }
  const ref = JSON.parse(fs.readFileSync(refPath, "utf8"));
  const latest = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  console.log(`\n== ${file} ==`);
  console.log("escenario".padEnd(14), "éxito ref", "éxito ahora", "prom ref (ms)", "prom ahora (ms)", "estado");
  for (const r of ref) {
    const l = latest.find((x) => x.scenario === r.scenario);
    const ok = l && l.tasa_exito_pct === r.tasa_exito_pct && l.coincidencias_incorrectas === 0;
    if (!ok) failed = true;
    console.log(r.scenario.padEnd(14), String(r.tasa_exito_pct).padEnd(9), String(l && l.tasa_exito_pct).padEnd(11),
      String(r.tiempo_prom_ms).padEnd(13), String(l && l.tiempo_prom_ms).padEnd(15), ok ? "OK" : "DIFERENTE");
  }
}
console.log(failed ? "\nVERIFICACIÓN FALLIDA: las tasas de éxito no coinciden." : "\nVERIFICACIÓN OK: las tasas de éxito coinciden exactamente con la referencia.");
process.exit(failed ? 1 : 0);
