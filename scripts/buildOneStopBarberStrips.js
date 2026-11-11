import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const LOGO_PNG = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/onestopbarber-logo.png';
const BANNER_PNG = 'D:/MisProyectos/TarjetaDeFidelidad/public/onestopbarber-banner.png';
const ASSETS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/functions/assets';
const PUBLIC_STRIPS_DIR = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/strips';

async function main() {
  const bannerWidth = 1125;
  const bannerHeight = 432;

  // 1. Generate clean white horizontal banner with centered logo
  // Sized 360x360, centered on pure white #FFFFFF
  const centerLogoFull = await sharp(LOGO_PNG)
    .resize(360, 360, { fit: 'contain' })
    .toBuffer();

  const whiteBanner = await sharp({
    create: {
      width: bannerWidth,
      height: bannerHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    { input: centerLogoFull, top: Math.round((bannerHeight - 360) / 2), left: Math.round((bannerWidth - 360) / 2) }
  ])
  .png()
  .toBuffer();

  await sharp(whiteBanner).toFile(BANNER_PNG);
  fs.copyFileSync(BANNER_PNG, path.join(ASSETS_DIR, 'onestopbarber-banner.png'));
  console.log('✅ Base white banner created at:', BANNER_PNG);

  // 2. Read clean logo as base64 for clipping inside stamp circles & center watermark
  const logoBase64 = fs.readFileSync(LOGO_PNG).toString('base64');
  const badgeDataUri = `data:image/png;base64,${logoBase64}`;

  // 3. Generate strips 0 through 6
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
        <clipPath id="barberClip-${i}">
          <circle cx="${cx}" cy="${cy}" r="48"/>
        </clipPath>
      `;

      if (isEarned) {
        slotsSvg += `
          <!-- Earned Slot ${i + 1} with OFFICIAL ONE STOP BARBER LOGO STAMP -->
          <g>
            <!-- Glowing Gold Outer Ring -->
            <circle cx="${cx}" cy="${cy}" r="55" fill="none" stroke="#D4AF37" stroke-width="4" opacity="0.95"/>
            <!-- White Base Behind Logo -->
            <circle cx="${cx}" cy="${cy}" r="50" fill="#FFFFFF"/>
            
            <!-- Official One Stop Barber Studio Logo -->
            <g clip-path="url(#barberClip-${i})">
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
              <circle cx="${cx}" cy="${cy}" r="54" fill="rgba(212, 175, 55, 0.20)" stroke="#D4AF37" stroke-width="3" stroke-dasharray="6,4"/>
              <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="28">🎁</text>
              <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="11" fill="#B8860B" letter-spacing="1">50% OFF</text>
            </g>
          `;
        } else {
          slotsSvg += `
            <!-- Unearned Slot ${i + 1} on White Background -->
            <g>
              <circle cx="${cx}" cy="${cy}" r="52" fill="rgba(255, 255, 255, 0.85)" stroke="#222222" stroke-width="2.5" stroke-dasharray="6,4"/>
              <text x="${cx}" y="${cy + 11}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="#1A1A1A">${i + 1}</text>
            </g>
          `;
        }
      }
    }

    const remaining = Math.max(0, maxStamps - currentStamps);
    const statusText = remaining === 0
      ? '🎉 REWARD READY: 50% OFF / FREE BEARD TRIM!'
      : remaining === 1
        ? 'ONLY 1 STAMP LEFT FOR YOUR REWARD!'
        : `ONLY ${remaining} STAMPS LEFT FOR YOUR REWARD`;

    // Pure white horizontal background, with centered circular logo watermark and elegant frames
    const svgOverlay = `
    <svg width="${bannerWidth}" height="${bannerHeight}" viewBox="0 0 ${bannerWidth} ${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${clipDefs}
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
        </filter>
      </defs>

      <!-- Pure White Base Background Across Entire Horizontal -->
      <rect width="${bannerWidth}" height="${bannerHeight}" fill="#FFFFFF"/>

      <!-- Centered Official Logo Emblem on White -->
      <g opacity="0.30">
        <image href="${badgeDataUri}" x="${Math.round((bannerWidth - 360) / 2)}" y="${Math.round((bannerHeight - 360) / 2)}" width="360" height="360" preserveAspectRatio="xMidYMid contain"/>
      </g>

      <!-- Elegant Gold Outer Frame -->
      <rect x="24" y="20" width="1077" height="392" rx="20" fill="none" stroke="#D4AF37" stroke-width="2"/>
      <rect x="30" y="26" width="1065" height="380" rx="16" fill="none" stroke="#E5E7EB" stroke-width="1"/>

      <!-- Header Pills (Black & Gold luxury headers for perfect contrast on white) -->
      <g>
        <rect x="58" y="44" width="410" height="34" rx="17" fill="#111111" stroke="#D4AF37" stroke-width="1.5"/>
        <text x="263" y="66" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="12" fill="#FFD700" letter-spacing="2">
          ✦ ONE STOP BARBER STUDIO • VIP ✦
        </text>

        <!-- Right Side Progress Status -->
        <rect x="710" y="44" width="355" height="34" rx="17" fill="#1A1A1A" stroke="#D4AF37" stroke-width="1.5"/>
        <text x="887" y="66" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" letter-spacing="1">
          ${statusText}
        </text>
      </g>

      <!-- Stamp Slots -->
      ${slotsSvg}
    </svg>
    `;

    const stripBuffer = await sharp(Buffer.from(svgOverlay))
      .png({ quality: 95 })
      .toBuffer();

    const publicOut = path.join(PUBLIC_STRIPS_DIR, `onestopbarber-strip-${currentStamps}.png`);
    const assetsOut = path.join(ASSETS_DIR, `onestopbarber-strip-${currentStamps}.png`);

    fs.writeFileSync(publicOut, stripBuffer);
    fs.writeFileSync(assetsOut, stripBuffer);
    console.log(`✅ Strip ${currentStamps} generated (size: ${stripBuffer.length} bytes)`);
  }

  console.log('🎉 All One Stop Barber Studio white banners & strips updated successfully!');
}

main().catch(console.error);
