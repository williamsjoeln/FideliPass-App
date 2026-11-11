import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import forge from 'node-forge';
import JSZip from 'jszip';

// Load Certificates
const certPem = fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/pass_cert.pem', 'utf8');
const keyPem = fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/fidelipass_pass.key', 'utf8');
const wwdrPem = fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/wwdr_g4.pem', 'utf8');

const cert = forge.pki.certificateFromPem(certPem);
const privateKey = forge.pki.privateKeyFromPem(keyPem);
const wwdrCert = forge.pki.certificateFromPem(wwdrPem);

export async function createApplePass({
  businessId = 'mcrolls',
  businessName = 'MC ROLLS',
  customerName = 'Williams Joel Navarrete Merino',
  customerPhone = '+593 99 240 7645',
  stamps = 6,
  maxStamps = 8,
  reward = 'Helado Rollo Gratis',
  primaryColor = 'rgb(29, 78, 62)',
  logoText = 'MC ROLLS'
} = {}) {
  const zip = new JSZip();

  // Create Emoji progress
  const emojis = [];
  for (let i = 0; i < maxStamps; i++) {
    emojis.push(i < stamps ? '🍨' : '⚪');
  }
  const progressEmojis = emojis.join(' ');

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.fidelipassapp.loyalty',
    serialNumber: `${businessId}_${customerPhone.replace(/\D/g, '') || '001'}`,
    teamIdentifier: 'H79W4YK96D',
    webServiceURL: 'https://fidelipassapp.com/api',
    authenticationToken: 'fidelipass_token_2026',
    organizationName: businessName,
    description: `Tarjeta de Fidelidad ${businessName}`,
    logoText: logoText,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(27, 71, 74)',
    labelColor: 'rgb(220, 240, 230)',
    storeCard: {
      headerFields: [
        {
          key: 'stamps',
          label: 'SELLOS',
          value: `${stamps} / ${maxStamps}`,
          changeMessage: '¡Tus sellos se actualizaron a %@!'
        }
      ],
      primaryFields: [],
      secondaryFields: [
        {
          key: 'client',
          label: 'CLIENTE',
          value: customerName.split(' ').slice(0, 2).join(' ').toUpperCase()
        },
        {
          key: 'reward',
          label: 'PREMIO',
          value: reward
        }
      ],
      auxiliaryFields: [
        {
          key: 'progress',
          label: 'TU PROGRESO',
          value: progressEmojis
        },
        {
          key: 'announcement',
          label: 'NOVEDAD',
          value: '¡Bienvenido a MC Rolls!',
          changeMessage: '%@'
        }
      ],
      backFields: [
        {
          key: 'howItWorks',
          label: '¿Cómo funciona?',
          value: `Acumula ${maxStamps} sellos mostrando este código en caja al comprar y reclama: ${reward}.`
        },
        {
          key: 'terms',
          label: 'Términos y Condiciones',
          value: 'Válido en locales participantes de MC Rolls. 1 sello por cada compra.'
        },
        {
          key: 'poweredBy',
          label: 'Plataforma',
          value: 'FideliPass • https://fidelipassapp.com'
        },
        {
          key: 'support',
          label: 'Soporte y Contacto',
          value: '+593 99 240 7645'
        }
      ]
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: customerPhone,
        messageEncoding: 'iso-8859-1',
        altText: ''
      }
    ],
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: customerPhone,
      messageEncoding: 'iso-8859-1',
      altText: ''
    },
    locations: [
      {
        latitude: -2.1911889,
        longitude: -79.9449926,
        relevantText: `🍦 ¡Estás cerca de MC Rolls, Williams! Te faltan ${Math.max(0, maxStamps - stamps)} sellos para tu helado gratis.`
      }
    ]
  };

  const passJsonBuffer = Buffer.from(JSON.stringify(passJson, null, 2), 'utf8');
  zip.file('pass.json', passJsonBuffer);

  // Add Images if available
  const logoPath = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/mcrolls.png';
  const dynamicStripPath = `D:/MisProyectos/TarjetaDeFidelidad/public/logos/strips/mcrolls-strip-${Math.min(8, Math.max(0, stamps))}.png`;
  const bannerPath = fs.existsSync(dynamicStripPath)
    ? dynamicStripPath
    : 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/mcrolls-banner.png';
  const iconPath = 'D:/MisProyectos/TarjetaDeFidelidad/public/logos/mcrolls.png';

  const filesToHash = {
    'pass.json': passJsonBuffer
  };

  if (fs.existsSync(iconPath)) {
    const iconBuf = fs.readFileSync(iconPath);
    zip.file('icon.png', iconBuf);
    zip.file('icon@2x.png', iconBuf);
    filesToHash['icon.png'] = iconBuf;
    filesToHash['icon@2x.png'] = iconBuf;
  }

  if (fs.existsSync(logoPath)) {
    const logoBuf = fs.readFileSync(logoPath);
    zip.file('logo.png', logoBuf);
    zip.file('logo@2x.png', logoBuf);
    filesToHash['logo.png'] = logoBuf;
    filesToHash['logo@2x.png'] = logoBuf;
  }

  if (fs.existsSync(bannerPath)) {
    const bannerBuf = fs.readFileSync(bannerPath);
    zip.file('strip.png', bannerBuf);
    zip.file('strip@2x.png', bannerBuf);
    filesToHash['strip.png'] = bannerBuf;
    filesToHash['strip@2x.png'] = bannerBuf;
  }

  // Create manifest.json (SHA1 hashes)
  const manifest = {};
  for (const [filename, buffer] of Object.entries(filesToHash)) {
    manifest[filename] = crypto.createHash('sha1').update(buffer).digest('hex');
  }

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  zip.file('manifest.json', manifestBuffer);

  // Sign manifest.json using PKCS#7 detached signature with SHA1
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestBuffer.toString('utf8'), 'utf8');
  p7.addCertificate(cert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha1,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() }
    ]
  });

  p7.sign({ detached: true });
  const asn1 = p7.toAsn1();
  const derBytes = forge.asn1.toDer(asn1).getBytes();
  const signatureBuffer = Buffer.from(derBytes, 'binary');

  zip.file('signature', signatureBuffer);

  // Generate .pkpass zip file
  const pkpassBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return pkpassBuffer;
}

// Generate demo pass
async function main() {
  const pkpass = await createApplePass();
  const outPath = 'D:/MisProyectos/TarjetaDeFidelidad/public/mcrolls.pkpass';
  fs.writeFileSync(outPath, pkpass);
  console.log(`✅ Apple Wallet .pkpass generated successfully at: ${outPath} (${pkpass.length} bytes)`);
}

main().catch(console.error);
