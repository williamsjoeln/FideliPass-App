import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const WIDTH = 2048;
const HEIGHT = 2732;
const OUT_DIR = path.join(process.env.USERPROFILE, 'Downloads', 'AppStore_Screenshots');

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b132b" />
      <stop offset="50%" stop-color="#1c2541" />
      <stop offset="100%" stop-color="#0a0f1d" />
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <text x="${WIDTH/2}" y="240" fill="#38bdf8" font-family="sans-serif" font-size="42" font-weight="800" letter-spacing="3" text-anchor="middle">FIDELIPASS PARA COMERCIOS</text>
  <text x="${WIDTH/2}" y="360" fill="#ffffff" font-family="sans-serif" font-size="84" font-weight="900" text-anchor="middle">Panel de Control y Sellado Digital</text>
  <text x="${WIDTH/2}" y="440" fill="#94a3b8" font-family="sans-serif" font-size="44" font-weight="500" text-anchor="middle">Gestiona tarjetas, otorga sellos y supervisa clientes en tiempo real</text>

  <!-- iPad Tablet Frame -->
  <g transform="translate(124, 580)">
    <rect width="1800" height="1950" rx="60" fill="#1e293b" stroke="#334155" stroke-width="8"/>
    <rect x="30" y="30" width="1740" height="1890" rx="40" fill="#0f172a"/>

    <!-- Header inside tablet -->
    <rect x="80" y="80" width="1580" height="140" rx="28" fill="#1e293b"/>
    <text x="130" y="168" fill="#38bdf8" font-family="sans-serif" font-size="56" font-weight="900">FP</text>
    <text x="240" y="165" fill="#ffffff" font-family="sans-serif" font-size="48" font-weight="800">FideliPass Business</text>
    <text x="1550" y="165" fill="#10b981" font-family="sans-serif" font-size="36" font-weight="700" text-anchor="end">● Conectado en Tiempo Real</text>

    <!-- 3 Metrics Cards -->
    <rect x="80" y="270" width="500" height="220" rx="28" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="120" y="370" fill="#38bdf8" font-family="sans-serif" font-size="64" font-weight="900">1,420</text>
    <text x="120" y="435" fill="#94a3b8" font-family="sans-serif" font-size="32" font-weight="600">Sellos Otorgados</text>

    <rect x="620" y="270" width="500" height="220" rx="28" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="660" y="370" fill="#10b981" font-family="sans-serif" font-size="64" font-weight="900">89</text>
    <text x="660" y="435" fill="#94a3b8" font-family="sans-serif" font-size="32" font-weight="600">Premios Canjeados</text>

    <rect x="1160" y="270" width="500" height="220" rx="28" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <text x="1200" y="370" fill="#f59e0b" font-family="sans-serif" font-size="64" font-weight="900">148</text>
    <text x="1200" y="435" fill="#94a3b8" font-family="sans-serif" font-size="32" font-weight="600">Clientes Registrados</text>

    <!-- Main Card in Tablet -->
    <rect x="80" y="540" width="1580" height="1280" rx="36" fill="url(#card)" stroke="#334155" stroke-width="3"/>
    <text x="140" y="640" fill="#ffffff" font-family="sans-serif" font-size="48" font-weight="800">MC Rolls Heladeria - Punto de Venta</text>
    <text x="140" y="700" fill="#94a3b8" font-family="sans-serif" font-size="32">Escaneo de tarjetas y asignacion instantanea de sellos</text>

    <!-- Reward Banner -->
    <rect x="140" y="760" width="1460" height="160" rx="24" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <text x="190" y="830" fill="#f59e0b" font-family="sans-serif" font-size="30" font-weight="700">PREMIO POR FIDELIDAD:</text>
    <text x="190" y="880" fill="#ffffff" font-family="sans-serif" font-size="40" font-weight="800">1 Helado Artesanal Gratis al acumular 8 sellos</text>

    <!-- Stamps simulation in tablet -->
    <g transform="translate(140, 970)">
      <rect width="340" height="240" rx="24" fill="#0284c7"/>
      <text x="170" y="145" fill="#ffffff" font-family="sans-serif" font-size="70" font-weight="900" text-anchor="middle">✓</text>
      <text x="170" y="205" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="700" text-anchor="middle">SELLO 1</text>
    </g>
    <g transform="translate(510, 970)">
      <rect width="340" height="240" rx="24" fill="#0284c7"/>
      <text x="170" y="145" fill="#ffffff" font-family="sans-serif" font-size="70" font-weight="900" text-anchor="middle">✓</text>
      <text x="170" y="205" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="700" text-anchor="middle">SELLO 2</text>
    </g>
    <g transform="translate(880, 970)">
      <rect width="340" height="240" rx="24" fill="#0284c7"/>
      <text x="170" y="145" fill="#ffffff" font-family="sans-serif" font-size="70" font-weight="900" text-anchor="middle">✓</text>
      <text x="170" y="205" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="700" text-anchor="middle">SELLO 3</text>
    </g>
    <g transform="translate(1250, 970)">
      <rect width="340" height="240" rx="24" fill="#1e293b" stroke="#475569" stroke-width="3" stroke-dasharray="10 6"/>
      <text x="170" y="145" fill="#64748b" font-family="sans-serif" font-size="60" font-weight="700" text-anchor="middle">4</text>
      <text x="170" y="205" fill="#64748b" font-family="sans-serif" font-size="26" font-weight="600" text-anchor="middle">PENDIENTE</text>
    </g>

    <g transform="translate(140, 1250)">
      <rect width="1460" height="120" rx="24" fill="#0ea5e9"/>
      <text x="730" y="75" fill="#ffffff" font-family="sans-serif" font-size="36" font-weight="800" text-anchor="middle">ESCANEAR TARJETA DEL CLIENTE CON CAMARA</text>
    </g>
  </g>
</svg>
`;

async function run() {
  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(path.join(OUT_DIR, 'ipad_13_pulgadas.png'));
  console.log('✅ Creada captura de iPad 13 pulgadas (2048x2732px)');
}

run().catch(console.error);
