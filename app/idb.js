// idb.js — envoltorio mínimo sobre IndexedDB para persistir la guía capturada.
// Un único object store ("guides") indexado por guide_id. No usa localStorage:
// IndexedDB es el único mecanismo del navegador capaz de almacenar el blob de la
// imagen/PDF original junto con sus metadatos en una sola transacción.

const DB_NAME = "gsmi-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "guides";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "guide_id" });
        store.createIndex("captured_at", "captured_at", { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Guarda el archivo original (Blob) junto con el valor crudo decodificado del QR.
async function saveGuide({ guideId, rawQrValue, fileBlob, capturedAt }) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      guide_id: guideId,
      raw_qr_value: rawQrValue,
      file_blob: fileBlob,
      captured_at: capturedAt || new Date().toISOString(),
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (event) => reject(event.target.error);
  });
}

async function getGuide(guideId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(guideId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function listGuides() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
}

window.GsmiOfflineDB = { saveGuide, getGuide, listGuides };
