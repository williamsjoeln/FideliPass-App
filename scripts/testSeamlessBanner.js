// scripts/testSeamlessBanner.js
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const LOGO_SRC = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/puresoul-logo.jpg';
const OUTPUT_TEST = 'D:/MisProyectos/TarjetaDeFidelidad/public/test-seamless-banner.png';

async function buildSeamlessBanner() {
  const bannerWidth = 1125;
  const bannerHeight = 432;
  const innerSize = 432; 
  const leftPos = Math.round((bannerWidth - innerSize) / 2); // 346

  // The white circle is inside x=190 to x=834
  // So x=0..170 is 100% PURE MARBLE
  const leftMarble = await sharp(LOGO_SRC)
    .extract({ left: 0, top: 0, width: 170, height: 1024 })
    .resize(leftPos + 30, bannerHeight, { fit: 'fill' })
    .toBuffer();

  // x=854..1024 is 100% PURE MARBLE
  const rightMarble = await sharp(LOGO_SRC)
    .extract({ left: 1024 - 170, top: 0, width: 170, height: 1024 })
    .resize(bannerWidth - (leftPos + innerSize - 30), bannerHeight, { fit: 'fill' })
    .toBuffer();

  // Center image (scaled to 432x432)
  const centerSquare = await sharp(LOGO_SRC)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .toBuffer();

  // Smooth feather mask
  const featherMask = Buffer.from(`
    <svg width="${innerSize}" height="${innerSize}">
      <defs>
        <linearGradient id="hFeather" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
          <stop offset="5%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="95%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${innerSize}" height="${innerSize}" fill="url(#hFeather)"/>
    </svg>
  `);

  const featheredCenter = await sharp(centerSquare)
    .composite([{ input: featherMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: bannerWidth,
      height: bannerHeight,
      channels: 4,
      background: { r: 242, g: 242, b: 242, alpha: 1 }
    }
  })
  .composite([
    { input: leftMarble, top: 0, left: 0 },
    { input: rightMarble, top: 0, left: leftPos + innerSize - 30 },
    { input: featheredCenter, top: 0, left: leftPos }
  ])
  .png()
  .toFile(OUTPUT_TEST);

  console.log('✅ Perfectly seamless banner generated!');
}

buildSeamlessBanner().catch(console.error);
