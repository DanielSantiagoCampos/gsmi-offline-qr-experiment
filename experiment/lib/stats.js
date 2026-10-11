function summarize(scenario, nImages, times, successes, mismatches) {
  const sorted = [...times].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return {
    scenario,
    n_imagenes: nImages,
    n_mediciones: sorted.length,
    tasa_exito_pct: Number(((successes / nImages) * 100).toFixed(1)),
    coincidencias_incorrectas: mismatches,
    tiempo_prom_ms: Number(avg.toFixed(3)),
    tiempo_p50_ms: Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(3)),
    tiempo_p95_ms: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(3)),
    tiempo_min_ms: Number(sorted[0].toFixed(3)),
    tiempo_max_ms: Number(sorted[sorted.length - 1].toFixed(3)),
  };
}
module.exports = { summarize };
