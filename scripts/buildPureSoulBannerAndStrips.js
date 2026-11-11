// scripts/buildPureSoulBannerAndStrips.js
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const LOGO_SRC = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/puresoul-logo.jpg';
const BADGE_PNG = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/puresoul-stamp-badge.png';
const BANNER_PNG = 'D:/MisProyectos/TarjetaDeFidelidad/public/puresoul-banner.png';
const ASSETS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/functions/assets';
const PUBLIC_STRIPS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/strips';

async function main() {
  const bannerWidth = 1125;
  const bannerHeight = 432;
  const innerSize = 432; 
  const leftPos = Math.round((bannerWidth - innerSize) / 2); // 346

  // 1. Build the 100% seamless horizontal base banner
  // Left marble sample
  const leftMarble = await sharp(LOGO_SRC)
    .extract({ left: 0, top: 0, width: 170, height: 1024 })
    .resize(leftPos + 30, bannerHeight, { fit: 'fill' })
    .toBuffer();

  // Right marble sample
  const rightMarble = await sharp(LOGO_SRC)
    .extract({ left: 1024 - 170, top: 0, width: 170, height: 1024 })
    .resize(bannerWidth - (leftPos + innerSize - 30), bannerHeight, { fit: 'fill' })
    .toBuffer();

  // Center logo
  const centerSquare = await sharp(LOGO_SRC)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .toBuffer();

  // Feather mask to blend center into sides seamlessly
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

  // Save the seamless base banner
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
  .toFile(BANNER_PNG);

  console.log('✅ Base seamless banner created at:', BANNER_PNG);
  fs.copyFileSync(BANNER_PNG, path.join(ASSETS_DIR, 'puresoul-banner.png'));

  // 2. Read stamp badge for inside the circles
  const badgeBase64 = fs.readFileSync(BADGE_PNG).toString('base64');
  const badgeDataUri = `data:image/png;base64,${badgeBase64}`;

  // 3. Generate the 7 Pure Soul strips composited over the seamless marble banner!
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
              <circle cx="${cx}" cy="${cy}" r="54" fill="rgba(226, 201, 157, 0.40)" stroke="#E2C99D" stroke-width="3" stroke-dasharray="6,4"/>
              <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="28">🎁</text>
              <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="11" fill="#F5E4C3" letter-spacing="1">FACIAL</text>
            </g>
          `;
        } else {
          slotsSvg += `
            <!-- Unearned Slot ${i + 1} -->
            <g>
              <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(0, 0, 0, 0.50)" stroke="rgba(255, 255, 255, 0.70)" stroke-width="2.5" stroke-dasharray="6,4"/>
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

    // Seamless glassmorphic overlay: dark plum translucent tint over the marble background so it's readable
    const svgOverlay = `
    <svg width="${bannerWidth}" height="${bannerHeight}" viewBox="0 0 ${bannerWidth} ${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="seamlessDarken" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2D1137" stop-opacity="0.80"/>
          <stop offset="50%" stop-color="#1F0B26" stop-opacity="0.70"/>
          <stop offset="100%" stop-color="#14061A" stop-opacity="0.82"/>
        </linearGradient>
        ${clipDefs}
      </defs>

      <!-- Translucent darkening across the seamless banner so stamps pop -->
      <rect width="${bannerWidth}" height="${bannerHeight}" fill="url(#seamlessDarken)"/>

      <!-- Delicate Inner Gold Frame -->
      <rect x="24" y="20" width="1077" height="392" rx="20" fill="none" stroke="#E2C99D" stroke-width="1.6" opacity="0.55"/>
      <rect x="30" y="26" width="1065" height="380" rx="16" fill="none" stroke="#FFFFFF" stroke-width="0.8" opacity="0.15"/>

      <!-- Header Pills -->
      <g>
        <rect x="58" y="44" width="370" height="34" rx="17" fill="rgba(45, 17, 55, 0.90)" stroke="#E2C99D" stroke-width="1.5" opacity="0.95"/>
        <text x="243" y="66" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="13" fill="#F5E4C3" letter-spacing="2">
          ✦ PURE SOUL • CLUB VIP ✦
        </text>

        <!-- Right Side Progress Status -->
        <rect x="635" y="44" width="440" height="34" rx="17" fill="rgba(0, 0, 0, 0.65)" stroke="rgba(226, 201, 157, 0.6)" stroke-width="1.5"/>
        <text x="855" y="66" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" letter-spacing="1">
          ${statusText}
        </text>
      </g>

      <!-- Stamp Slots -->
      ${slotsSvg}
    </svg>
    `;

    const svgBuffer = Buffer.from(svgOverlay);
    const outAssets = path.join(ASSETS_DIR, `puresoul-strip-${currentStamps}.png`);
    const outPublic = path.join(PUBLIC_STRIPS_DIR, `puresoul-strip-${currentStamps}.png`);

    // Composite overlay over the seamless banner!
    await sharp(BANNER_PNG)
      .resize(bannerWidth, bannerHeight, { fit: 'cover' })
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .png({ quality: 95 })
      .toFile(outAssets);

    fs.copyFileSync(outAssets, outPublic);
  }

  console.log('🎉 Generated all 7 Pure Soul strips over the 100% SEAMLESS horizontal banner!');
}

main().catch(console.error);
