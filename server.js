// Servidor estático mínimo para la demostración y el arnés de medición.
// Sirve la raíz del repositorio: /app/ (PWA), /data/ (guías sintéticas) y /results/.
const http = require("http");
const path = require("path");
const handler = require("serve-handler");

function startServer(port = 8080) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) =>
      handler(req, res, { public: path.join(__dirname), cleanUrls: false, directoryListing: false })
    );
    server.listen(port, () => resolve(server));
  });
}

module.exports = { startServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 8080;
  startServer(port).then(() => {
    console.log(`Demostración:        http://localhost:${port}/app/index.html`);
    console.log(`Visor de resultados: http://localhost:${port}/app/results.html`);
  });
}
