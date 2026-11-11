import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const WIDTH = 1179;
const HEIGHT = 2556;
const OUT_DIR = path.join(process.env.USERPROFILE, 'Downloads', 'AppStore_Screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

const screens = [
  {
    filename: '1_tarjetas_fidelidad.png',
    badge: 'TARJETAS DIGITALES INTERACTIVAS',
    title: 'Fideliza a tus Clientes',
    subtitle: 'Sellos digitales y premios en tiempo real',
    primaryColor: '#0ea5e9',
    cardTitle: 'MC Rolls Heladería',
    cardReward: '1 Helado Artesanal Gratis',
    cardSub: 'Acumula 8 sellos en tus visitas',
    stamps: [true, true, true, true, true, false, false, false],
    metric1: '5 de 8',
    metric1Label: 'Sellos obtenidos',
    metric2: '3 visitas',
    metric2Label: 'Para tu premio'
  },
  {
    filename: '2_escaner_qr.png',
    badge: 'PUNTO DE VENTA Y CAJA',
    title: 'Escáner QR Ultra Rápido',
    subtitle: 'Sella tarjetas con la cámara en un segundo',
    primaryColor: '#10b981',
    cardTitle: 'Escáner de Cliente',
    cardReward: '¡Código QR Escaneado con Éxito!',
    cardSub: 'Cliente: Juan Pérez (#FP-8921)',
    stamps: [true, true, true, true, true, true, false, false],
    metric1: '+1 Sello',
    metric1Label: 'Otorgado ahora',
    metric2: 'MC Rolls',
    metric2Label: 'Sucursal Principal'
  },
  {
    filename: '3_panel_gestion.png',
    badge: 'MÉTRICAS & CONTROL TOTAL',
    title: 'Panel en Tiempo Real',
    subtitle: 'Supervisa visitas, sellos y clientes activos',
    primaryColor: '#6366f1',
    cardTitle: 'Panel de Administración',
    cardReward: 'Resumen Mensual de Fidelización',
    cardSub: 'Actualizado automáticamente con Firebase',
    stamps: [true, true, true, true, true, true, true, true],
    metric1: '1,420',
    metric1Label: 'Sellos entregados',
    metric2: '89',
    metric2Label: 'Premios canjeados'
  },
  {
    filename: '4_apple_wallet.png',
    badge: 'ECOSISTEMA APPLE WALLET',
    title: 'Pases en Apple Wallet',
    subtitle: 'Tus clientes llevan su tarjeta en el iPhone',
    primaryColor: '#f59e0b',
    cardTitle: 'FideliPass Multi-Comercio',
    cardReward: 'Compatible con Apple Wallet y Google Wallet',
    cardSub: 'Notificaciones automáticas y geolocalización',
    stamps: [true, true, true, true, false, false, false, false],
    metric1: '100% Digital',
    metric1Label: 'Sin tarjetas de papel',
    metric2: 'Notificaciones',
    metric2Label: 'En pantalla de bloqueo'
  }
];

async function generateScreenshots() {
  console.log('Generando capturas de pantalla de alta resolución para App Store...');

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    
    // Stamps grid SVG
    let stampsSvg = '';
    const startX = 140;
    const startY = 1380;
    const size = 180;
    const gap = 30;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 4 + col;
        const x = startX + col * (size + gap);
        const y = startY + row * (size + gap);
        const isStamped = s.stamps[idx];

        stampsSvg += `
          <g transform="translate(${x}, ${y})">
            <rect width="${size}" height="${size}" rx="32" fill="${isStamped ? 'url(#stampGrad)' : '#1e293b'}" stroke="${isStamped ? '#38bdf8' : '#334155'}" stroke-width="3" filter="${isStamped ? 'url(#glow)' : 'none'}"/>
            ${isStamped ? `
              <circle cx="${size/2}" cy="${size/2}" r="45" fill="#ffffff" fill-opacity="0.2"/>
              <path d="M ${size/2 - 25} ${size/2} L ${size/2 - 8} ${size/2 + 20} L ${size/2 + 30} ${size/2 - 22}" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            ` : `
              <circle cx="${size/2}" cy="${size/2}" r="35" fill="none" stroke="#475569" stroke-width="4" stroke-dasharray="8 6"/>
              <text x="${size/2}" y="${size/2 + 10}" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" text-anchor="middle">${idx + 1}</text>
            `}
          </g>
        `;
      }
    }

    const svg = `
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16" />
            <stop offset="50%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>

          <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#090d16" />
          </linearGradient>

          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>

          <linearGradient id="stampGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${s.primaryColor}" />
            <stop offset="100%" stop-color="#2563eb" />
          </linearGradient>

          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${s.primaryColor}" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="shadow" x="-10%" y="-5%" width="120%" height="115%">
            <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)" />

        <!-- Ambient glow blobs -->
        <circle cx="200" cy="400" r="350" fill="${s.primaryColor}" fill-opacity="0.15" filter="url(#glow)" />
        <circle cx="950" cy="1800" r="450" fill="#6366f1" fill-opacity="0.12" filter="url(#glow)" />

        <!-- Header Content -->
        <g transform="translate(0, 160)">
          <!-- Category Pill -->
          <rect x="${(WIDTH - 500) / 2}" y="0" width="500" height="58" rx="29" fill="${s.primaryColor}" fill-opacity="0.15" stroke="${s.primaryColor}" stroke-opacity="0.4" stroke-width="2"/>
          <text x="${WIDTH / 2}" y="38" fill="${s.primaryColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" letter-spacing="2" text-anchor="middle">${escapeXml(s.badge)}</text>

          <!-- Main Title -->
          <text x="${WIDTH / 2}" y="150" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" text-anchor="middle" letter-spacing="-1">${escapeXml(s.title)}</text>

          <!-- Subtitle -->
          <text x="${WIDTH / 2}" y="225" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="500" text-anchor="middle">${escapeXml(s.subtitle)}</text>
        </g>

        <!-- Phone Frame Mockup -->
        <g transform="translate(65, 520)" filter="url(#shadow)">
          <!-- Outer Phone Body -->
          <rect x="0" y="0" width="1049" height="1950" rx="90" fill="#1e293b" stroke="#334155" stroke-width="6"/>
          <!-- Inner Screen -->
          <rect x="18" y="18" width="1013" height="1914" rx="76" fill="url(#phoneGrad)"/>

          <!-- Dynamic Island -->
          <rect x="366" y="38" width="280" height="65" rx="32" fill="#000000"/>
          <circle cx="600" cy="70" r="14" fill="#0f172a"/>

          <!-- App Brand Top Bar -->
          <g transform="translate(60, 150)">
            <rect width="100" height="100" rx="28" fill="${s.primaryColor}" fill-opacity="0.2"/>
            <text x="50" y="66" fill="${s.primaryColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900" text-anchor="middle">FP</text>
            <text x="130" y="55" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800">FideliPass</text>
            <text x="130" y="92" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600">SISTEMA OFICIAL PARA COMERCIOS</text>
          </g>

          <!-- Card Component -->
          <g transform="translate(45, 300)">
            <rect width="923" height="980" rx="48" fill="url(#cardGrad)" stroke="#334155" stroke-width="3"/>

            <!-- Store Header -->
            <rect x="50" y="50" width="120" height="120" rx="30" fill="${s.primaryColor}"/>
            <text x="110" y="128" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="900" text-anchor="middle">⭐</text>
            
            <text x="200" y="105" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800">${escapeXml(s.cardTitle)}</text>
            <text x="200" y="150" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500">${escapeXml(s.cardSub)}</text>

            <!-- Reward Highlight Box -->
            <rect x="50" y="210" width="823" height="160" rx="32" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
            <text x="90" y="270" fill="#f59e0b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="700">RECOMPENSA FINAL:</text>
            <text x="90" y="325" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="800">${escapeXml(s.cardReward)}</text>

            <!-- 2 Big Metrics -->
            <rect x="50" y="410" width="395" height="180" rx="32" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="90" y="495" fill="${s.primaryColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">${escapeXml(s.metric1)}</text>
            <text x="90" y="545" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="600">${escapeXml(s.metric1Label)}</text>

            <rect x="478" y="410" width="395" height="180" rx="32" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <text x="518" y="495" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900">${escapeXml(s.metric2)}</text>
            <text x="518" y="545" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="600">${escapeXml(s.metric2Label)}</text>

            <!-- QR Simulation or Action -->
            <g transform="translate(50, 630)">
              <rect width="823" height="300" rx="36" fill="url(#accentGrad)" opacity="0.15"/>
              <rect width="823" height="300" rx="36" fill="none" stroke="${s.primaryColor}" stroke-width="3" stroke-dasharray="16 10"/>
              
              <text x="411" y="730 - 630 + 50" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="800" text-anchor="middle">Escanear Tarjeta en Caja</text>
              <text x="411" y="790 - 630 + 50" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="500" text-anchor="middle">Lector QR Integrado para Cajeros y Administradores</text>

              <rect x="236" y="190" width="350" height="70" rx="35" fill="${s.primaryColor}"/>
              <text x="411" y="238" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" text-anchor="middle">ESCANEAR AHORA</text>
            </g>
          </g>

          <!-- Stamps Grid -->
          <g transform="translate(0, 50)">
            ${stampsSvg}
          </g>
        </g>
      </svg>
    `;

    const outPath = path.join(OUT_DIR, s.filename);
    await sharp(Buffer.from(svg))
      .png({ quality: 100 })
      .toFile(outPath);

    console.log(`✅ Creada: ${s.filename} (${WIDTH}x${HEIGHT}px)`);
  }

  console.log('🎉 Todas las capturas para App Store generadas en:', OUT_DIR);
}

generateScreenshots().catch(console.error);
