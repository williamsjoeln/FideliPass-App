// scripts/generateAllStrips.js
// 1. Generates 6-stamp luxury strips for Pure Soul (0 to 6 stamps)
// 2. Overwrites Universal strips (0 to 8 stamps) to be 100% WHITE-LABEL (NO FideliPass logo or watermark anywhere)

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/functions/assets';
const PUBLIC_STRIPS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/strips';

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_STRIPS_DIR)) fs.mkdirSync(PUBLIC_STRIPS_DIR, { recursive: true });

// ==========================================
// 1. GENERATE PURE SOUL 6-STAMP STRIPS
// ==========================================
async function generatePureSoulStrips() {
  const width = 1125;
  const height = 432;
  const maxStamps = 6;

  // 3 columns, 2 rows for 6 stamps
  // Evenly spaced
  const colCenters = [330, 562, 795];
  const rowCenters = [170, 310];

  for (let currentStamps = 0; currentStamps <= maxStamps; currentStamps++) {
    let slotsSvg = '';

    for (let i = 0; i < maxStamps; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = colCenters[col];
      const cy = rowCenters[row];
      const isEarned = i < currentStamps;
      const isRewardSlot = (i === maxStamps - 1);

      if (isEarned) {
        slotsSvg += `
          <!-- Earned Slot ${i + 1} -->
          <g>
            <!-- Glowing Gold Outer Ring -->
            <circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#E2C99D" stroke-width="3.5" opacity="0.95"/>
            <!-- White/Ivory Base -->
            <circle cx="${cx}" cy="${cy}" r="50" fill="#FAF7F5"/>
            
            <!-- Elegant Golden Sparkle / Star Icon -->
            <circle cx="${cx}" cy="${cy}" r="34" fill="#6A1B9A" opacity="0.12"/>
            <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="38" fill="#8E24AA">✨</text>
            
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
  console.log('✅ Generated 7 Pure Soul strips (0-6 stamps) with NO FIDELIPASS watermark.');
}

// ==========================================
// 2. REGENERATE 100% WHITE-LABEL UNIVERSAL STRIPS
// ==========================================
async function generateWhiteLabelUniversalStrips() {
  const width = 1125;
  const height = 432;
  const maxStamps = 8;
  const cols = 4;
  const colCenters = [250, 458, 667, 875];
  const rowCenters = [170, 310];

  for (let currentStamps = 0; currentStamps <= maxStamps; currentStamps++) {
    let slotsSvg = '';

    for (let i = 0; i < maxStamps; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = colCenters[col];
      const cy = rowCenters[row];
      const isEarned = i < currentStamps;
      const isRewardSlot = (i === maxStamps - 1);

      if (isEarned) {
        slotsSvg += `
          <!-- Earned Slot ${i + 1} - 100% WHITE-LABEL (Gold Star VIP Stamp) -->
          <g>
            <circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#F59E0B" stroke-width="3.5" opacity="0.95"/>
            <circle cx="${cx}" cy="${cy}" r="50" fill="#FFFFFF"/>
            
            <!-- Elegant Gold Star Stamp (Universal for any store) -->
            <polygon points="${cx},${cy - 28} ${cx + 8},${cy - 10} ${cx + 27},${cy - 8} ${cx + 13},${cy + 5} ${cx + 17},${cy + 24} ${cx},${cy + 13} ${cx - 17},${cy + 24} ${cx - 13},${cy + 5} ${cx - 27},${cy - 8} ${cx - 8},${cy - 10}" fill="#F59E0B"/>
            <polygon points="${cx},${cy - 20} ${cx + 6},${cy - 7} ${cx + 20},${cy - 6} ${cx + 10},${cy + 4} ${cx + 13},${cy + 18} ${cx},${cy + 10} ${cx - 13},${cy + 18} ${cx - 10},${cy + 4} ${cx - 20},${cy - 6} ${cx - 6},${cy - 7}" fill="#FCD34D"/>

            <!-- Success Checkmark Badge -->
            <circle cx="${cx + 34}" cy="${cy - 34}" r="15" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5"/>
            <path d="M${cx + 28} ${cy - 34} l4 4 l8 -8" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        `;
      } else {
        if (isRewardSlot) {
          slotsSvg += `
            <g>
              <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(245, 158, 11, 0.25)" stroke="#F59E0B" stroke-width="3" stroke-dasharray="6,4"/>
              <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="28">🎁</text>
              <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="12" fill="#FDE68A" letter-spacing="1">PREMIO</text>
            </g>
          `;
        } else {
          slotsSvg += `
            <g>
              <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(0, 0, 0, 0.25)" stroke="rgba(255, 255, 255, 0.50)" stroke-width="2.5" stroke-dasharray="6,4"/>
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

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="neutralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="50%" stop-color="#0F172A"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>

      <!-- Background - Elegant Neutral Carbon Slate -->
      <rect width="${width}" height="${height}" fill="url(#neutralGrad)"/>

      <!-- Sleek framing -->
      <rect x="24" y="20" width="1077" height="392" rx="20" fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="1.5"/>

      <!-- Header Pills (NO FIDELIPASS BRANDING) -->
      <rect x="50" y="44" width="320" height="34" rx="17" fill="rgba(255, 255, 255, 0.10)" stroke="rgba(255, 255, 255, 0.20)" stroke-width="1"/>
      <text x="210" y="67" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF" letter-spacing="3">
        ✦ CLUB VIP • TARJETA ✦
      </text>

      <rect x="620" y="44" width="455" height="34" rx="17" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" stroke-width="1"/>
      <text x="847" y="67" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="12" fill="#FDE68A" letter-spacing="1">
        ${statusText}
      </text>

      <!-- Stamp Slots -->
      ${slotsSvg}
    </svg>
    `;

    const outAssets = path.join(ASSETS_DIR, `fidelipass-strip-${currentStamps}.png`);
    const outPublic = path.join(PUBLIC_STRIPS_DIR, `fidelipass-strip-${currentStamps}.png`);

    await sharp(Buffer.from(svg)).png().toFile(outAssets);
    fs.copyFileSync(outAssets, outPublic);
  }
  console.log('✅ Overwritten 9 Universal strips (0-8 stamps) with 100% WHITE-LABEL clean designs.');
}

async function run() {
  await generatePureSoulStrips();
  await generateWhiteLabelUniversalStrips();
}

run().catch(console.error);
