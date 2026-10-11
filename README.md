# Verificación offline del código QR de la GSMI mediante PWA — repositorio de replicación

Material de replicación del trabajo de grado *Verificación offline de la Guía Sanitaria de Movilización Animal (GSMI) mediante código QR y arquitectura PWA* (Ingeniería de Sistemas, Universidad Cooperativa de Colombia, 2026-II).

Contiene **únicamente datos sintéticos**: ninguna guía, productor, predio ni sistema institucional real.

## Qué demuestra

Que el código QR de una guía puede decodificarse **localmente** en el navegador (HTML5 Canvas + jsQR, algoritmo Reed-Solomon de ISO/IEC 18004), sin ninguna petición de red, y cuantifica cómo cambia la tasa de éxito y el tiempo de decodificación bajo 8 escenarios de degradación de imagen.

## Contenido

```
app/          PWA mínima de demostración (index.html, app.js, idb.js, service-worker.js, results.html)
data/guides/  60 guías sintéticas (PNG con QR, nivel de corrección M) + registros_sinteticos.json
data/samples/ 3 guías × 8 escenarios degradados, para la galería de la demostración
experiment/   scripts del experimento (generación, degradación, benchmarks, verificación)
results/reference/  resultados reportados en el documento (Tabla 2)
docs/         capturas de la interfaz de demostración
server.js     servidor estático local
```

## Requisitos

Node.js 18 o superior. Para el benchmark en navegador, un Chromium (Playwright 1.56 usa Chromium 141).

```bash
npm install
npx playwright install chromium     # o use CHROMIUM_PATH=/ruta/a/chrome
```

## 1. Ver la demostración

```bash
npm start
```

- `http://localhost:8080/app/index.html` — verificador: seleccione una imagen o toque cualquier guía de prueba; muestra los datos decodificados, el tiempo en ms y guarda el registro en IndexedDB.
- `http://localhost:8080/app/results.html` — visor de resultados del experimento (referencia y última ejecución).

Para comprobar el modo offline: abra la página, deje que el Service Worker precachee, apague la red (DevTools → Network → Offline) y recargue; la verificación sigue funcionando.

## 2. Reproducir el experimento

```bash
npm run reproduce
```

Equivale a: `dataset:degrade` (480 PNG en `data/degraded/`, ~70 MB, no versionados) → `benchmark:node` → `benchmark:browser` → `verify`.

- `results/latest/` recibe su ejecución; `results/reference/` conserva lo reportado en el documento.
- `npm run verify` exige que la **tasa de éxito coincida exactamente** (es determinista dado el conjunto de datos). Los **tiempos** dependen del hardware y solo se comparan lado a lado.
- `npm run test:offline` corta la red del navegador, recarga la PWA y verifica una guía, comprobando que no se emite ninguna petición HTTP.

### Diseño experimental

60 guías × 8 escenarios (`clean`, `rotate_15`, `blur_light`, `blur_medium`, `blur_heavy`, `low_res`, `low_contrast`, `worst_case`) × 5 repeticiones de tiempo = 2.400 mediciones y 480 evaluaciones de éxito. Medición principal: `performance.now()` en Chromium real (`drawImage` + `getImageData` + jsQR). Verificación cruzada: `process.hrtime()` en Node.js sobre el mismo arreglo RGBA.

### Sobre `dataset:generate`

`npm run dataset:generate` crea un conjunto **nuevo** con valores aleatorios y por eso exige `--force`; los resultados de referencia corresponden al conjunto incluido en `data/guides/`.

## Terceros

jsQR (Apache-2.0), qrcode (MIT), Jimp (MIT), Playwright (Apache-2.0), serve-handler (MIT).

## Titularidad

Copyright © 2026 Daniel Santiago Campos Piñeros. Todos los derechos reservados (Ley 23 de 1982). Repositorio de acceso restringido; su consulta por jurados y evaluadores se concede bajo solicitud del autor.
