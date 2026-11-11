// scripts/generateFideliPassStrips.js
// Generates Universal Apple Wallet Stamp Strip Cartillas (0-8 stamps) for ANY store
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUTPUT_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/strips';
const FUNCTIONS_ASSETS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/functions/assets';
const LOGO_SRC = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/fidelipass-logo.png';
const BANNER_SRC = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/fidelipass-banner.png';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const logoBase64 = fs.readFileSync(LOGO_SRC).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

export async function createUniversalStampStrip({ currentStamps = 0, maxStamps = 8, outputPath }) {
  const width = 1125;
  const height = 432;

  // 4 columns, 2 rows for 8 stamps
  const cols = 4;
  const colCenters = [250, 458, 667, 875];
  const rowCenters = [170, 310];

  let clipDefs = '';
  let slotsSvg = '';

  for (let i = 0; i < maxStamps; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = colCenters[col];
    const cy = rowCenters[row];
    const isEarned = i < currentStamps;
    const isRewardSlot = (i === maxStamps - 1);

    clipDefs += `
      <clipPath id="fidelipassClip-${i}">
        <circle cx="${cx}" cy="${cy}" r="47"/>
      </clipPath>
    `;

    if (isEarned) {
      slotsSvg += `
        <!-- Earned Slot ${i + 1} -->
        <g>
          <!-- Outer Emerald / Gold Ring -->
          <circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#10B981" stroke-width="3.5" opacity="0.95"/>
          <circle cx="${cx}" cy="${cy}" r="50" fill="#FFFFFF"/>
          <!-- Clipped Logo -->
          <g clip-path="url(#fidelipassClip-${i})">
            <image href="${logoDataUri}" x="${cx - 45}" y="${cy - 45}" width="90" height="90" preserveAspectRatio="xMidYMid slice"/>
          </g>
          <!-- Success Checkmark Badge -->
          <circle cx="${cx + 34}" cy="${cy - 34}" r="15" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5"/>
          <path d="M${cx + 28} ${cy - 34} l4 4 l8 -8" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
    } else {
      if (isRewardSlot) {
        slotsSvg += `
          <!-- Reward Slot (Goal) -->
          <g>
            <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(245, 158, 11, 0.35)" stroke="#F59E0B" stroke-width="3" stroke-dasharray="6,4"/>
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="28">🎁</text>
            <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="12" fill="#FDE68A" letter-spacing="1">PREMIO</text>
          </g>
        `;
      } else {
        slotsSvg += `
          <!-- Unearned Slot ${i + 1} -->
          <g>
            <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(0, 0, 0, 0.25)" stroke="rgba(255, 255, 255, 0.55)" stroke-width="2.5" stroke-dasharray="6,4"/>
            <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF">${i + 1}</text>
          </g>
        `;
      }
    }
  }

  const remaining = Math.max(0, maxStamps - currentStamps);
  const statusText = remaining === 0
    ? '🎉 ¡PREMIO COMPLETADO! LISTO PARA CANJEAR'
    : remaining === 1
      ? '¡SOLO TE FALTA 1 SELLO PARA TU PREMIO!'
      : `TE FALTAN ${remaining} SELLOS PARA TU PREMIO`;

  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="universalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" stop-opacity="0.88"/>
          <stop offset="50%" stop-color="#1E293B" stop-opacity="0.80"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0.92"/>
        </linearGradient>
        ${clipDefs}
      </defs>

      <!-- Gradient darkening with luxury titanium/slate palette -->
      <rect width="${width}" height="${height}" fill="url(#universalGrad)"/>

      <!-- Glassmorphic Container Plate -->
      <rect x="42" y="24" width="1041" height="384" rx="28" fill="rgba(255, 255, 255, 0.12)" stroke="rgba(255, 255, 255, 0.35)" stroke-width="2"/>

      <!-- Header Pills -->
      <g>
        <rect x="68" y="44" width="350" height="34" rx="17" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(16, 185, 129, 0.55)" stroke-width="1.5"/>
        <text x="243" y="66" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" letter-spacing="1.5">⭐ CLUB VIP • TARJETA DE FIDELIDAD</text>

        <!-- Right Side Progress Status -->
        <rect x="685" y="44" width="370" height="34" rx="17" fill="rgba(0, 0, 0, 0.60)" stroke="rgba(255, 255, 255, 0.30)" stroke-width="1.5"/>
        <text x="870" y="66" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="12" fill="#FDE68A" letter-spacing="1">${statusText}</text>
      </g>

      <!-- Stamp Slots -->
      ${slotsSvg}
    </svg>
  `;

  const svgBuffer = Buffer.from(svgOverlay);

  // Resize base banner and composite SVG on top
  await sharp(BANNER_SRC)
    .resize(width, height, { fit: 'cover' })
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png({ quality: 95 })
    .toFile(outputPath);
}

async function run() {
  for (let s = 0; s <= 8; s++) {
    const out = path.join(OUTPUT_DIR, `fidelipass-strip-${s}.png`);
    await createUniversalStampStrip({ currentStamps: s, maxStamps: 8, outputPath: out });
  }
  // Copy to functions/assets/
  for (let s = 0; s <= 8; s++) {
    const src = path.join(OUTPUT_DIR, `fidelipass-strip-${s}.png`);
    const dst = path.join(FUNCTIONS_ASSETS_DIR, `fidelipass-strip-${s}.png`);
    fs.copyFileSync(src, dst);
  }
  console.log('🎉 Universal FideliPass stamp strips (0-8) successfully generated and saved!');
}

run().catch(console.error);
