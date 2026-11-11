// scripts/buildPureSoulLogoAndStrips.js
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const LOGO_SRC = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/puresoul-logo.jpg';
const BADGE_PNG = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/puresoul-stamp-badge.png';
const ASSETS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/functions/assets';
const PUBLIC_STRIPS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/strips';

async function main() {
  const meta = await sharp(LOGO_SRC).metadata();
  console.log(`Original logo size: ${meta.width}x${meta.height}`);

  // 1. In the uploaded image, there is a central white circle containing the gold logo
  // The circle occupies approximately the central 65% of the image
  // Let's create a circular mask to extract the white badge perfectly
  const size = Math.min(meta.width, meta.height);
  
  // Crop to center square
  const left = Math.floor((meta.width - size) / 2);
  const top = Math.floor((meta.height - size) / 2);

  // The white circle radius is approximately size * 0.315 (diameter is ~63% of the image)
  // Let's crop tightly to the circle (about center 63% of the square)
  const circleSize = Math.floor(size * 0.63);
  const cropLeft = left + Math.floor((size - circleSize) / 2);
  const cropTop = top + Math.floor((size - circleSize) / 2);

  await sharp(LOGO_SRC)
    .extract({ left: cropLeft, top: cropTop, width: circleSize, height: circleSize })
    .resize(300, 300)
    .png()
    .toFile(BADGE_PNG);

  console.log('✅ Cropped circular Pure Soul logo badge created at:', BADGE_PNG);

  // Copy to functions/assets
  fs.copyFileSync(BADGE_PNG, path.join(ASSETS_DIR, 'puresoul-logo.png'));
  fs.copyFileSync(BADGE_PNG, 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/puresoul-logo.png');

  // Convert badge to base64 Data URI for SVG embedding
  const badgeBase64 = fs.readFileSync(BADGE_PNG).toString('base64');
  const badgeDataUri = `data:image/png;base64,${badgeBase64}`;

  // 2. Generate the 7 Pure Soul stamp strips (0-6 stamps)
  const width = 1125;
  const height = 432;
  const maxStamps = 6;
  const colCenters = [330, 562, 795];
  const rowCenters = [170, 310];

  for (let currentStamps = 0; currentStamps <= maxStamps; currentStamps++) {
    let clipDefs = '';
    let slotsSvg = '';

    for (let i = 0; i < maxStamps; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = colCenters[col];
      const cy = rowCenters[row];
      const isEarned = i < currentStamps;
      const isRewardSlot = (i === maxStamps - 1);

      clipDefs += `
        <clipPath id="psClip-${i}">
          <circle cx="${cx}" cy="${cy}" r="48"/>
        </clipPath>
      `;

      if (isEarned) {
        slotsSvg += `
          <!-- Earned Slot ${i + 1} with OFFICIAL PURE SOUL LOGO -->
          <g>
            <!-- Glowing Gold Outer Ring -->
            <circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#E2C99D" stroke-width="3.5" opacity="0.95"/>
            <!-- White Base -->
            <circle cx="${cx}" cy="${cy}" r="50" fill="#FFFFFF"/>
            
            <!-- Clipped Official Pure Soul Logo -->
            <g clip-path="url(#psClip-${i})">
              <image href="${badgeDataUri}" x="${cx - 48}" y="${cy - 48}" width="96" height="96" preserveAspectRatio="xMidYMid slice"/>
            </g>
            
            <!-- Success Checkmark Badge -->
            <circle cx="${cx + 34}" cy="${cy - 34}" r="15" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5"/>
            <path d="M${cx + 28} ${cy - 34} l4 4 l8 -8" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        `;
      } else {
        if (isRewardSlot) {
          slotsSvg += `
            <!-- Reward Goal Slot 6 -->
            <g>
              <circle cx="${cx}" cy="${cy}" r="54" fill="rgba(226, 201, 157, 0.22)" stroke="#E2C99D" stroke-width="3" stroke-dasharray="6,4"/>
              <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="28">🎁</text>
              <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="11" fill="#F5E4C3" letter-spacing="1">FACIAL</text>
            </g>
          `;
        } else {
          slotsSvg += `
            <!-- Unearned Slot ${i + 1} -->
            <g>
              <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.45)" stroke-width="2.5" stroke-dasharray="6,4"/>
              <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF">${i + 1}</text>
            </g>
          `;
        }
      }
    }

    const remaining = Math.max(0, maxStamps - currentStamps);
    const statusText = remaining === 0
      ? '🎉 ¡PREMIO DESBLOQUEADO! 1 LIMPIEZA FACIAL PROFUNDA'
      : remaining === 1
        ? '¡SOLO TE FALTA 1 SESIÓN PARA TU LIMPIEZA FACIAL!'
        : `TE FALTAN ${remaining} SESIONES PARA TU LIMPIEZA FACIAL GRATIS`;

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="psGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3B1C48"/>
          <stop offset="50%" stop-color="#281132"/>
          <stop offset="100%" stop-color="#1A0B21"/>
        </linearGradient>

        <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#E2C99D"/>
          <stop offset="100%" stop-color="#F5E4C3"/>
        </linearGradient>
        ${clipDefs}
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#psGrad)"/>

      <!-- Delicate Inner Golden Border -->
      <rect x="24" y="20" width="1077" height="392" rx="20" fill="none" stroke="#E2C99D" stroke-width="1.5" opacity="0.4"/>
      <rect x="30" y="26" width="1065" height="380" rx="16" fill="none" stroke="#FFFFFF" stroke-width="0.8" opacity="0.15"/>

      <!-- Header Pills -->
      <rect x="50" y="44" width="360" height="34" rx="17" fill="rgba(255, 255, 255, 0.10)" stroke="#E2C99D" stroke-width="1" opacity="0.85"/>
      <text x="230" y="67" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#F5E4C3" letter-spacing="3">
        ✦ PURE SOUL • CLUB VIP ✦
      </text>

      <rect x="635" y="44" width="440" height="34" rx="17" fill="rgba(226, 201, 157, 0.15)" stroke="#E2C99D" stroke-width="1" opacity="0.95"/>
      <text x="855" y="67" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" letter-spacing="1">
        ${statusText}
      </text>

      <!-- Stamp Slots -->
      ${slotsSvg}
    </svg>
    `;

    const outAssets = path.join(ASSETS_DIR, `puresoul-strip-${currentStamps}.png`);
    const outPublic = path.join(PUBLIC_STRIPS_DIR, `puresoul-strip-${currentStamps}.png`);

    await sharp(Buffer.from(svg)).png().toFile(outAssets);
    fs.copyFileSync(outAssets, outPublic);
  }

  console.log('✅ Generated all 7 Pure Soul strips with the OFFICIAL GOLD LOGO inside every stamp!');
}

main().catch(console.error);
