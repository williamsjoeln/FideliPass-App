import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BANNER_SRC = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/mcrolls-banner.png';
const LOGO_SRC = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/mcrolls.png';
const OUTPUT_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/strips';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const logoBase64 = fs.readFileSync(LOGO_SRC).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

export async function createStampStrip({ currentStamps = 2, maxStamps = 8, outputPath }) {
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
      <clipPath id="logoClip-${i}">
        <circle cx="${cx}" cy="${cy}" r="47"/>
      </clipPath>
    `;

    if (isEarned) {
      slotsSvg += `
        <!-- Earned Slot ${i + 1} -->
        <g>
          <!-- Outer Neon / Brand Ring -->
          <circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#2DD4BF" stroke-width="3.5" opacity="0.95"/>
          <circle cx="${cx}" cy="${cy}" r="50" fill="#FFFFFF"/>
          <!-- Clipped Store Logo -->
          <g clip-path="url(#logoClip-${i})">
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
            <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(245, 158, 11, 0.25)" stroke="#F59E0B" stroke-width="3" stroke-dasharray="6,4"/>
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="28">🎁</text>
            <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="12" fill="#FDE68A" letter-spacing="1">PREMIO</text>
          </g>
        `;
      } else {
        slotsSvg += `
          <!-- Unearned Slot ${i + 1} -->
          <g>
            <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(255, 255, 255, 0.14)" stroke="rgba(255, 255, 255, 0.45)" stroke-width="2.5" stroke-dasharray="6,4"/>
            <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="rgba(255, 255, 255, 0.85)">${i + 1}</text>
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
        <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#07151a" stop-opacity="0.48"/>
          <stop offset="100%" stop-color="#050d11" stop-opacity="0.78"/>
        </linearGradient>
        ${clipDefs}
      </defs>

      <!-- Gradient darkening over real photo -->
      <rect width="${width}" height="${height}" fill="url(#overlayGrad)"/>

      <!-- Glassmorphic Container Plate -->
      <rect x="42" y="24" width="1041" height="384" rx="28" fill="rgba(255, 255, 255, 0.10)" stroke="rgba(255, 255, 255, 0.32)" stroke-width="2"/>

      <!-- Header Pills -->
      <g>
        <rect x="68" y="44" width="310" height="34" rx="17" fill="rgba(27, 71, 74, 0.92)" stroke="rgba(45, 212, 191, 0.45)" stroke-width="1.5"/>
        <text x="223" y="66" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" letter-spacing="1.5">🍦 CLUB VIP • MC ROLLS</text>

        <!-- Right Side Progress Status -->
        <rect x="685" y="44" width="370" height="34" rx="17" fill="rgba(0, 0, 0, 0.50)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5"/>
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
    const out = path.join(OUTPUT_DIR, `mcrolls-strip-${s}.png`);
    await createStampStrip({ currentStamps: s, maxStamps: 8, outputPath: out });
  }
  // Also copy to functions/assets/
  const functionsAssetsDir = 'D:/MisProyectos/TarjetaDeFidelidad/functions/assets';
  for (let s = 0; s <= 8; s++) {
    const src = path.join(OUTPUT_DIR, `mcrolls-strip-${s}.png`);
    const dst = path.join(functionsAssetsDir, `mcrolls-strip-${s}.png`);
    fs.copyFileSync(src, dst);
  }
  console.log('🎉 Refined stamp strips (0-8) successfully generated and saved!');
}

run().catch(console.error);
