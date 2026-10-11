// Escenarios de degradación de imagen del experimento (Fase 4). Una única definición
// compartida por la exportación de imágenes y el benchmark en Node, para garantizar
// que ambos operan sobre exactamente las mismas transformaciones.
const SCENARIOS = [
  "clean", "rotate_15", "blur_light", "blur_medium",
  "blur_heavy", "low_res", "low_contrast", "worst_case",
];

async function degrade(image, scenario) {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  switch (scenario) {
    case "clean": return image;
    case "rotate_15": return image.rotate(15);
    case "blur_light": return image.blur(2);
    case "blur_medium": return image.blur(3);
    case "blur_heavy": return image.blur(5);
    case "low_res": return image.resize({ w: Math.round(w * 0.25), h: Math.round(h * 0.25) }).resize({ w, h });
    case "low_contrast": return image.contrast(-0.45).brightness(0.2);
    case "worst_case":
      return image.rotate(12)
        .resize({ w: Math.round(w * 0.3), h: Math.round(h * 0.3) })
        .resize({ w, h })
        .blur(2).contrast(-0.3).brightness(0.15);
    default: throw new Error("Escenario desconocido: " + scenario);
  }
}

module.exports = { SCENARIOS, degrade };
