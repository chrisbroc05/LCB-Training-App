const sharp = require("sharp");
const path = require("path");

const logoPath = path.join(__dirname, "public", "logo", "lcb-training-logo.png");

async function generateIcons() {
  await sharp(logoPath)
    .resize(192, 192)
    .flatten({ background: { r: 10, g: 22, b: 40 } })
    .png()
    .toFile(path.join(__dirname, "public", "pwa-192.png"));

  await sharp(logoPath)
    .resize(512, 512)
    .flatten({ background: { r: 10, g: 22, b: 40 } })
    .png()
    .toFile(path.join(__dirname, "public", "pwa-512.png"));

  await sharp(logoPath)
    .resize(180, 180)
    .flatten({ background: { r: 10, g: 22, b: 40 } })
    .png()
    .toFile(path.join(__dirname, "public", "apple-touch-icon.png"));

  console.log("PWA icons generated successfully");
}

generateIcons();
