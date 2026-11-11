// functions/index.js
// Apple Wallet PassKit Web Service & APNs Push Server for FideliPass
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import http2 from "http2";
import crypto from "crypto";
import forge from "node-forge";
import JSZip from "jszip";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

admin.initializeApp();
const db = admin.firestore();

// Load Apple Developer Certificates
const certPem = fs.readFileSync(path.join(__dirname, 'certs/pass_cert.pem'), 'utf8');
const keyPem = fs.readFileSync(path.join(__dirname, 'certs/fidelipass_pass.key'), 'utf8');
const wwdrPem = fs.readFileSync(path.join(__dirname, 'certs/wwdr_g4.pem'), 'utf8');

const cert = forge.pki.certificateFromPem(certPem);
const privateKey = forge.pki.privateKeyFromPem(keyPem);
const wwdrCert = forge.pki.certificateFromPem(wwdrPem);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper: HexToRgb
function hexToRgb(hex, defaultRgb = 'rgb(27, 71, 74)') {
  if (!hex) return defaultRgb;
  if (typeof hex !== 'string') return defaultRgb;
  if (hex.startsWith('rgb')) return hex;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return defaultRgb;
}

// 1. PassKit Registration: Called by iOS when user adds pass to Wallet
const handleRegistration = async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
    const { pushToken } = req.body || {};
    const authHeader = req.headers.authorization;

    console.log(`📱 [Apple PassKit] Registering device: ${deviceLibraryIdentifier} for pass: ${serialNumber}`);

    if (!pushToken) {
      return res.status(400).send({ error: 'Missing pushToken' });
    }

    const regId = `${deviceLibraryIdentifier}_${serialNumber}`;
    const regRef = db.collection('pass_registrations').doc(regId);
    const doc = await regRef.get();

    const regData = {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      pushToken,
      authHeader: authHeader || '',
      updatedAt: Date.now()
    };

    if (doc.exists) {
      await regRef.update(regData);
      return res.status(200).send();
    } else {
      await regRef.set(regData);
      return res.status(201).send();
    }
  } catch (err) {
    console.error("Error in registration:", err);
    res.status(500).send({ error: err.message });
  }
};

// 2. PassKit Get Passes: Called by iOS to ask which passes changed
const handleGetPasses = async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier } = req.params;
    const passesUpdatedSince = req.query.passesUpdatedSince;

    const snapshot = await db.collection('pass_registrations')
      .where('deviceLibraryIdentifier', '==', deviceLibraryIdentifier)
      .where('passTypeIdentifier', '==', passTypeIdentifier)
      .get();

    console.log(`📱 [Apple PassKit] getPasses check: device=${deviceLibraryIdentifier}, passesUpdatedSince=${passesUpdatedSince || 'none'}`);

    if (snapshot.empty) {
      console.log(`[Apple PassKit] No registrations for device ${deviceLibraryIdentifier}`);
      return res.status(204).send();
    }

    const serialNumbers = [];
    let maxUpdated = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const docUpdated = Number(data.updatedAt) || 0;
      if (!passesUpdatedSince || docUpdated > Number(passesUpdatedSince)) {
        serialNumbers.push(data.serialNumber);
      }
      if (docUpdated > maxUpdated) maxUpdated = docUpdated;
    });

    if (serialNumbers.length === 0) {
      console.log(`[Apple PassKit] No new passes since ${passesUpdatedSince} for device ${deviceLibraryIdentifier}`);
      return res.status(204).send();
    }

    console.log(`📱 [Apple PassKit] Sending ${serialNumbers.length} updated passes to device:`, serialNumbers);
    res.status(200).json({
      serialNumbers,
      lastUpdated: String(maxUpdated || Date.now())
    });
  } catch (err) {
    console.error("Error in getPasses:", err);
    res.status(500).send({ error: err.message });
  }
};

// 3. PassKit Get Latest Pass: Called by iOS to fetch the updated .pkpass
const handleGetLatestPass = async (req, res) => {
  try {
    const { passTypeIdentifier, serialNumber } = req.params;
    const storeParam = req.query.store || (serialNumber ? serialNumber.split('_')[0] : 'mc-rolls');
    const customerIdParam = req.query.c;
    const phoneParam = req.query.phone || (serialNumber ? serialNumber.split('_')[1] : '593992407645');
    const nameParam = req.query.n || req.query.name || '';
    const cleanCustomerPart = customerIdParam || (phoneParam ? phoneParam.replace(/\D/g, '') : '001');
    const effectiveSerial = serialNumber || `${storeParam}_${cleanCustomerPart}`;
    const isMcRolls = !storeParam || storeParam === 'mcrolls' || storeParam === 'mc-rolls' || storeParam.toLowerCase().includes('mcrolls');

    console.log(`📦 [Apple PassKit] Generating pass for: ${effectiveSerial} (store: ${storeParam}, isMcRolls: ${isMcRolls})`);

    // Default configuration based on store
    let customerStamps = 1;
    let maxStamps = 6;
    let customerName = 'Williams Joel';
    let customerPhone = '+593 99 240 7645';
    const isOneStopBarberEarly = (storeParam && (storeParam.toLowerCase().includes('barber') || storeParam.toLowerCase().includes('one-stop')));
    let businessName = isMcRolls ? 'MC ROLLS' : (isOneStopBarberEarly ? 'One Stop Barber Studio' : 'El Cafecito de Simba');
    let businessCardBg = isMcRolls ? 'rgb(27, 71, 74)' : (isOneStopBarberEarly ? 'rgb(18, 18, 18)' : 'rgb(62, 39, 35)');
    let latestAnnouncement = `¡Bienvenido a ${businessName}!`;
    let storeGeofenceEnabled = true;
    let storeLatitude = -2.1911889;
    let storeLongitude = -79.9449926;
    let storeProximityMessage = '';
    let storeLogoData = null;
    let storeBannerData = null;
    let reward = isMcRolls ? 'Helado Rollo Gratis' : (isOneStopBarberEarly ? '50% OFF or Free Beard Trim' : '1 Café de Especialidad o Postre Gratis');
    let storeSnap = null;
    let storeLang = 'es';

    try {
      const effectiveStoreId = (storeParam === 'mcrolls' || storeParam === 'mc-rolls') ? 'mc-rolls' : storeParam;
      storeSnap = await db.collection('stores').doc(effectiveStoreId).get();
      if (!storeSnap.exists && storeParam !== effectiveStoreId) {
        storeSnap = await db.collection('stores').doc(storeParam).get();
      }
      if (!storeSnap.exists) {
        const querySnap = await db.collection('stores').where('slug', '==', storeParam).limit(1).get();
        if (!querySnap.empty) {
          storeSnap = querySnap.docs[0];
        } else {
          const allStores = await db.collection('stores').get();
          allStores.forEach(doc => {
            const data = doc.data();
            if (doc.id === storeParam || (data.name && data.name.toLowerCase().includes(storeParam.toLowerCase()))) {
              storeSnap = doc;
            }
          });
        }
      }

      if (storeSnap && storeSnap.exists) {
        const s = storeSnap.data();
        if (s.name) {
          businessName = s.name;
          latestAnnouncement = `¡Bienvenido a ${s.name}!`;
        }
        if (s.language) storeLang = s.language;
        if (s.maxStamps) maxStamps = Number(s.maxStamps) || maxStamps;
        if (s.cardBgColor) businessCardBg = hexToRgb(s.cardBgColor);
        if (s.enableGeofence !== undefined) storeGeofenceEnabled = Boolean(s.enableGeofence);
        if (s.latitude) storeLatitude = Number(s.latitude);
        if (s.longitude) storeLongitude = Number(s.longitude);
        if (s.proximityMessage) storeProximityMessage = s.proximityMessage;
        if (s.logo) storeLogoData = s.logo;
        if (s.banner) storeBannerData = s.banner;
        if (s.rewardTitle || s.reward) reward = s.rewardTitle || s.reward;
      }

      // Fallbacks if not provided in Firestore
      if (!storeLogoData && isMcRolls) {
        storeLogoData = path.join(__dirname, 'assets/mcrolls.png');
      }

      const isOneStopEarly = (storeParam && (storeParam.toLowerCase().includes('barber') || storeParam.toLowerCase().includes('one-stop'))) || businessName.toLowerCase().includes('barber') || businessName.toLowerCase().includes('one stop');
      if (!storeBannerData && isOneStopEarly) {
        const barberBannerPath = path.join(__dirname, 'assets/onestopbarber-banner.png');
        if (fs.existsSync(barberBannerPath)) {
          storeBannerData = barberBannerPath;
        }
      }

      if (!storeBannerData && (storeParam === 'store-1792951625504' || businessName.toLowerCase().includes('simba'))) {
        const simbaBannerPath = path.join(__dirname, 'assets/simba-banner.png');
        if (fs.existsSync(simbaBannerPath)) {
          storeBannerData = simbaBannerPath;
        }
      }

      if (!storeBannerData && isMcRolls) {
        const mcrollsBannerPath = path.join(__dirname, 'assets/mcrolls-banner.png');
        if (fs.existsSync(mcrollsBannerPath)) {
          storeBannerData = mcrollsBannerPath;
        }
      }

      if (storeParam?.includes('pure-soul') || businessName.toLowerCase().includes('pure soul')) {
        const psLogoPath = path.join(__dirname, 'assets/puresoul-logo.png');
        if (fs.existsSync(psLogoPath)) {
          storeLogoData = psLogoPath;
        }
      }
    } catch (e) {
      console.warn("Could not load store data from Firestore:", e);
    }

    let storeAnnUpdatedAt = 0;
    try {
      let effectiveAnnDoc = isMcRolls ? 'mc-rolls' : storeParam;
      let annSnap = await db.collection('store_announcements').doc(effectiveAnnDoc).get();
      if (!annSnap.exists && (storeParam.includes('simba') || storeParam === 'store-1792951625504')) {
        annSnap = await db.collection('store_announcements').doc('store-1792951625504').get();
      }
      if (annSnap.exists && annSnap.data().message) {
        latestAnnouncement = annSnap.data().message;
        storeAnnUpdatedAt = Number(annSnap.data().updatedAt) || 0;
      } else {
        const notifSnap = await db.collection('notifications').get();
        if (!notifSnap.empty) {
          const list = notifSnap.docs
            .map(d => d.data())
            .filter(d => isMcRolls ? (!d.businessId || d.businessId === 'mc-rolls') : (d.businessId === storeParam || (storeParam.includes('simba') && (d.businessId?.includes('simba') || d.businessId === 'store-1792951625504'))))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          if (list[0]?.message) {
            latestAnnouncement = list[0].message;
            storeAnnUpdatedAt = Number(list[0].createdAt) || 0;
          }
        }
      }

      // Check if this specific device registration was assigned a recent push notification
      if (effectiveSerial) {
        try {
          const regSnap = await db.collection('pass_registrations').where('serialNumber', '==', effectiveSerial).limit(1).get();
          if (!regSnap.empty) {
            const regData = regSnap.docs[0].data();
            if (regData.lastMessage) {
              latestAnnouncement = regData.lastMessage;
              storeAnnUpdatedAt = Number(regData.updatedAt) || Date.now();
            }
          }
        } catch (regErr) {
          console.warn("Could not check registration lastMessage:", regErr);
        }
      }
    } catch (e) {
      console.warn("Could not load latest announcement:", e);
    }

    try {
      let custSnap = null;
      if (customerIdParam) {
        custSnap = await db.collection('customers').doc(customerIdParam).get();
      }
      if ((!custSnap || !custSnap.exists) && serialNumber) {
        custSnap = await db.collection('customers').doc(serialNumber).get();
        if (!custSnap.exists && serialNumber.includes('_')) {
          const extractedCustId = serialNumber.split('_')[1];
          if (extractedCustId) {
            custSnap = await db.collection('customers').doc(extractedCustId).get();
          }
        }
      }

      // Robust multi-tenant search by normalized phone and store
      if (!custSnap || !custSnap.exists) {
        const cleanPhone = (phoneParam || '').replace(/\D/g, '');
        const pCore = cleanPhone.replace(/^(593|0)/, '');

        const allCustomersSnap = await db.collection('customers').get();
        for (const doc of allCustomersSnap.docs) {
          const d = doc.data();
          const docStore = d.businessId || 'mc-rolls';
          const matchesStore = isMcRolls ? (docStore === 'mc-rolls' || !d.businessId) : (docStore === storeParam);
          if (!matchesStore) continue;

          const docPhoneClean = (d.phone || '').replace(/\D/g, '');
          const docCore = docPhoneClean.replace(/^(593|0)/, '');

          if (cleanPhone && (docPhoneClean === cleanPhone || pCore === docCore || (pCore && docCore && (docCore.endsWith(pCore) || pCore.endsWith(docCore))))) {
            custSnap = doc;
            break;
          }
        }
      }

      // Default fallback for MC Rolls test customer if still not found
      if ((!custSnap || !custSnap.exists) && isMcRolls) {
        custSnap = await db.collection('customers').doc('cust-9023').get();
      }

      if (custSnap && custSnap.exists) {
        const c = custSnap.data();
        if (c.currentStamps !== undefined) customerStamps = Number(c.currentStamps);
        if (c.name) customerName = c.name;
        if (c.phone) customerPhone = c.phone;
        const custMsgUpdatedAt = Number(c.messageUpdatedAt) || 0;
        if (c.latestMessage && custMsgUpdatedAt > storeAnnUpdatedAt) {
          latestAnnouncement = c.latestMessage;
        }
        try {
          await custSnap.ref.update({
            device: 'Apple Wallet (iPhone)',
            deviceType: 'apple',
            lastVisit: 'Recién'
          });
        } catch {}
      } else {
        // Auto-enroll customer in Firestore so cashier terminal immediately sees them!
        const autoCustId = customerIdParam || (serialNumber && serialNumber.includes('_') ? serialNumber.split('_')[1] : serialNumber) || `cust-${Date.now()}`;
        customerName = nameParam || customerName || 'Williams Navarrete';
        customerPhone = phoneParam || customerPhone || '';
        customerStamps = 1;
        const targetStoreId = (storeSnap && storeSnap.id) ? storeSnap.id : (storeParam || 'mc-rolls');
        const newCust = {
          id: autoCustId,
          businessId: targetStoreId,
          name: customerName,
          phone: customerPhone,
          email: `${autoCustId}@fidelipass.com`,
          status: 'Activo',
          device: 'Apple Wallet (iPhone)',
          deviceType: 'apple',
          currentStamps: 1,
          totalSpent: 0,
          rewardsClaimed: 0,
          joinedDate: 'Hoy',
          lastVisit: 'Recién',
          createdAt: Date.now(),
          history: [
            { id: `h-${Date.now()}`, type: 'stamp', date: 'Hoy', note: '✨ Tarjeta añadida a Apple Wallet' }
          ]
        };
        try {
          await db.collection('customers').doc(autoCustId).set(newCust, { merge: true });
          console.log(`✅ [Pass API] Auto-enrolled customer ${autoCustId} (${customerName}) for store ${targetStoreId}`);
        } catch (saveErr) {
          console.warn("Could not auto-save customer in pass API:", saveErr);
        }
      }
    } catch (custErr) {
      console.warn("Could not load customer data:", custErr);
    }

    // Build Emoji Progress
    const isOneStopBarber = (storeParam && (storeParam.toLowerCase().includes('barber') || storeParam.toLowerCase().includes('one-stop'))) || businessName.toLowerCase().includes('barber') || businessName.toLowerCase().includes('one stop');
    const isPureSoul = (storeParam && storeParam.toLowerCase().includes('pure-soul')) || businessName.toLowerCase().includes('pure soul');
    const emojiSymbol = isOneStopBarber ? '💈' : (isMcRolls ? '🍨' : (businessName.toLowerCase().includes('caf') ? '☕' : (isPureSoul ? '✨' : '⭐')));
    const emojis = [];
    for (let i = 0; i < maxStamps; i++) {
      emojis.push(i < customerStamps ? emojiSymbol : '⚪');
    }
    const progressEmojis = emojis.join(' ');

    const isEn = storeLang === 'en';

    // Ensure Apple detects a value change on the front of the pass even if consecutive pushes have the same text
    const passAnnouncement = latestAnnouncement + ((storeAnnUpdatedAt % 2 === 0) ? '\u200B' : '');

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.fidelipassapp.loyalty',
      serialNumber: effectiveSerial,
      teamIdentifier: 'H79W4YK96D',
      webServiceURL: 'https://fidelipassapp.com/api',
      authenticationToken: 'fidelipass_token_2026',
      organizationName: businessName,
      description: isEn ? `${businessName} Loyalty Card` : `Tarjeta de Fidelidad ${businessName}`,
      logoText: businessName,
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: businessCardBg,
      labelColor: 'rgb(220, 240, 230)',
      storeCard: {
        headerFields: [
          {
            key: 'stamps',
            label: isEn ? 'STAMPS' : 'SELLOS',
            value: `${customerStamps} / ${maxStamps}`,
            changeMessage: isEn ? `Your stamps at ${businessName} were updated to %@!` : `¡Tus sellos en ${businessName} se actualizaron a %@!`
          }
        ],
        primaryFields: [],
        secondaryFields: [
          {
            key: 'client',
            label: isEn ? 'MEMBER' : 'CLIENTE',
            value: customerName.split(' ').slice(0, 2).join(' ').toUpperCase()
          },
          {
            key: 'reward',
            label: isEn ? 'REWARD' : 'PREMIO',
            value: reward
          }
        ],
        auxiliaryFields: [
          {
            key: 'progress',
            label: isEn ? 'YOUR PROGRESS' : 'TU PROGRESO',
            value: progressEmojis
          },
          {
            key: 'notice',
            label: isEn ? 'NEWS' : 'NOVEDAD',
            value: passAnnouncement,
            changeMessage: '%@'
          }
        ],
        backFields: [
          {
            key: 'announcement_detail',
            label: isEn ? 'Latest News' : 'Última Novedad',
            value: latestAnnouncement
          },
          {
            key: 'terms',
            label: isEn ? 'Terms & Conditions' : 'Términos',
            value: isEn ? `1 stamp per visit or session. Collect ${maxStamps} stamps to earn your ${reward}.` : `1 sello por compra. Al acumular ${maxStamps} sellos recibes tu ${reward}.`
          },
          {
            key: 'platform',
            label: isEn ? 'Powered by' : 'Emitido por',
            value: 'FideliPass • https://fidelipassapp.com'
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
      }
    };

    // Native Apple PassKit GPS Proximity Geofencing (Notificación hiperpersonalizada por cliente)
    if (storeGeofenceEnabled && !isNaN(storeLatitude) && !isNaN(storeLongitude)) {
      const stampsRemaining = Math.max(0, maxStamps - customerStamps);
      const firstName = (customerName || '').trim().split(' ')[0] || '';
      let proximityText = storeProximityMessage || '';

      if (proximityText && proximityText.includes('{faltan}')) {
        proximityText = proximityText
          .replace(/{faltan}/g, stampsRemaining)
          .replace(/{nombre}/g, firstName)
          .replace(/{sellos}/g, customerStamps);
      } else {
        if (stampsRemaining === 0) {
          proximityText = `🎁 ¡Estás cerca de ${businessName}${firstName ? ', ' + firstName : ''}! Ya tienes tu ${reward} listo para canjear en caja.`;
        } else if (stampsRemaining === 1) {
          proximityText = `🎉 ¡Estás cerca de ${businessName}${firstName ? ', ' + firstName : ''}! Te falta solo 1 sello para tu ${reward}.`;
        } else {
          proximityText = `${isMcRolls ? '🍦' : '☕'} ¡Estás cerca de ${businessName}${firstName ? ', ' + firstName : ''}! Te faltan ${stampsRemaining} sellos para tu ${reward}.`;
        }
      }

      passJson.locations = [
        {
          latitude: storeLatitude,
          longitude: storeLongitude,
          relevantText: proximityText
        }
      ];
    }

    const zip = new JSZip();
    const passJsonBuffer = Buffer.from(JSON.stringify(passJson, null, 2), 'utf8');
    zip.file('pass.json', passJsonBuffer);

    const filesToHash = { 'pass.json': passJsonBuffer };

    // Assets: icon.png is used by Apple for the lock-screen notification icon!
    // Using the store logo ensures the notification displays the store's own brand.
    const defaultLogoFile = path.join(__dirname, 'assets/fidelipass-logo.png');

    async function getImageBuffer(dataUri, fallbackPath) {
      if (dataUri && typeof dataUri === 'string') {
        if (dataUri.includes('base64,')) {
          try {
            const b64 = dataUri.split('base64,')[1];
            return Buffer.from(b64, 'base64');
          } catch (e) {
            console.warn("Error decoding base64 image:", e);
          }
        } else if (dataUri.startsWith('http://') || dataUri.startsWith('https://')) {
          try {
            const resp = await fetch(dataUri);
            if (resp.ok) {
              const arrayBuffer = await resp.arrayBuffer();
              return Buffer.from(arrayBuffer);
            }
          } catch (fetchErr) {
            console.warn("Error fetching image URL:", fetchErr);
          }
        } else if (fs.existsSync(dataUri)) {
          return fs.readFileSync(dataUri);
        } else {
          const relativeAsset = path.join(__dirname, 'assets', path.basename(dataUri));
          if (fs.existsSync(relativeAsset)) {
            return fs.readFileSync(relativeAsset);
          }
        }
      }
      if (fallbackPath && fs.existsSync(fallbackPath)) {
        return fs.readFileSync(fallbackPath);
      }
      return null;
    }

    const iconBuf = await getImageBuffer(storeLogoData, defaultLogoFile);
    if (iconBuf) {
      zip.file('icon.png', iconBuf);
      zip.file('icon@2x.png', iconBuf);
      filesToHash['icon.png'] = iconBuf;
      filesToHash['icon@2x.png'] = iconBuf;
    }

    const logoBuf = await getImageBuffer(storeLogoData, defaultLogoFile);
    if (logoBuf) {
      zip.file('logo.png', logoBuf);
      zip.file('logo@2x.png', logoBuf);
      filesToHash['logo.png'] = logoBuf;
      filesToHash['logo@2x.png'] = logoBuf;
    }

    // Strip image: prioritize custom uploaded banner, then dynamic stamp cartilla, then defaults
    let bannerBuf = null;
    const isSimba = storeParam === 'store-1792951625504' || businessName.toLowerCase().includes('simba');
    const safeStamps = Math.min(8, Math.max(0, customerStamps));

    const isCustomUploadedBanner = storeBannerData && (
      typeof storeBannerData === 'string' && (
        storeBannerData.startsWith('data:') ||
        storeBannerData.startsWith('http:') ||
        storeBannerData.startsWith('https:')
      )
    );

    // If the store uploaded a custom banner/photo, always use it!
    if (isCustomUploadedBanner) {
      bannerBuf = await getImageBuffer(storeBannerData, null);
    }

    // Dynamic pre-baked cartillas if no custom banner was uploaded
    if (!bannerBuf) {
      if (isOneStopBarber) {
        const barberStamps = Math.min(6, Math.max(0, customerStamps));
        const dynamicStripFile = path.join(__dirname, `assets/onestopbarber-strip-${barberStamps}.png`);
        if (fs.existsSync(dynamicStripFile)) {
          bannerBuf = fs.readFileSync(dynamicStripFile);
        }
      } else if (isPureSoul) {
        const pureSoulStamps = Math.min(6, Math.max(0, customerStamps));
        const dynamicStripFile = path.join(__dirname, `assets/puresoul-strip-${pureSoulStamps}.png`);
        if (fs.existsSync(dynamicStripFile)) {
          bannerBuf = fs.readFileSync(dynamicStripFile);
        }
      } else if (isMcRolls) {
        const dynamicStripFile = path.join(__dirname, `assets/mcrolls-strip-${safeStamps}.png`);
        if (fs.existsSync(dynamicStripFile)) {
          bannerBuf = fs.readFileSync(dynamicStripFile);
        }
      } else if (isSimba) {
        const dynamicStripFile = path.join(__dirname, `assets/simba-strip-${safeStamps}.png`);
        if (fs.existsSync(dynamicStripFile)) {
          bannerBuf = fs.readFileSync(dynamicStripFile);
        }
      }
    }

    // Prioritize store's custom horizontal panoramic banner or logo if still not loaded
    if (!bannerBuf && storeBannerData) {
      bannerBuf = await getImageBuffer(storeBannerData, null);
    }

    if (!bannerBuf && storeLogoData) {
      bannerBuf = await getImageBuffer(storeLogoData, null);
    }

    // Fallbacks: 100% White-Label Universal VIP strip (ZERO platform branding)
    if (!bannerBuf) {
      const universalStripFile = path.join(__dirname, `assets/fidelipass-strip-${safeStamps}.png`);
      if (fs.existsSync(universalStripFile)) {
        bannerBuf = fs.readFileSync(universalStripFile);
      }
    }

    if (bannerBuf) {
      zip.file('strip.png', bannerBuf);
      zip.file('strip@2x.png', bannerBuf);
      filesToHash['strip.png'] = bannerBuf;
      filesToHash['strip@2x.png'] = bannerBuf;
    }

    // Manifest
    const manifest = {};
    for (const [fn, buf] of Object.entries(filesToHash)) {
      manifest[fn] = crypto.createHash('sha1').update(buf).digest('hex');
    }
    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
    zip.file('manifest.json', manifestBuffer);

    // Cryptographic Sign
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
    const sigBytes = Buffer.from(forge.asn1.toDer(asn1).getBytes(), 'binary');
    zip.file('signature', sigBytes);

    const pkpassBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    res.set('Content-Type', 'application/vnd.apple.pkpass');
    res.set('Content-Disposition', `attachment; filename="${effectiveSerial}.pkpass"`);
    res.set('Last-Modified', new Date().toUTCString());
    res.status(200).send(pkpassBuffer);
  } catch (err) {
    console.error("Error in getLatestPass:", err);
    res.status(500).send({ error: err.message });
  }
};

// 4. PassKit Unregister
const handleUnregister = async (req, res) => {
  try {
    const { deviceLibraryIdentifier, serialNumber } = req.params;
    const regId = `${deviceLibraryIdentifier}_${serialNumber}`;
    await db.collection('pass_registrations').doc(regId).delete();
    res.status(200).send();
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

// 5. PassKit Log
const handleLog = (req, res) => {
  console.log("📝 [Apple PassKit Client Log]:", req.body);
  res.status(200).send();
};

// Register routes supporting both direct and /api prefixed routes
const registerPassKitRoutes = (prefix = '') => {
  app.post(`${prefix}/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber`, handleRegistration);
  app.get(`${prefix}/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier`, handleGetPasses);
  app.get(`${prefix}/v1/passes/:passTypeIdentifier/:serialNumber`, handleGetLatestPass);
  app.delete(`${prefix}/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber`, handleUnregister);
  app.post(`${prefix}/v1/log`, handleLog);
};

registerPassKitRoutes('');
registerPassKitRoutes('/api');
app.get(['/pass', '/api/pass', '/api/pass.pkpass'], handleGetLatestPass);

// 6. APNs Push Dispatcher: Triggered when cashier sends a push notification
app.post(['/sendApplePush', '/api/sendApplePush'], async (req, res) => {
  try {
    const { serialNumber, message, phone, storeId, customerId } = req.body || {};
    console.log(`🚀 [APNs Push] Dispatching Apple push for serial: ${serialNumber || 'ALL'}, phone: ${phone || ''}, storeId: ${storeId || ''}, customerId: ${customerId || ''}`);

    const rawStore = storeId || (serialNumber && serialNumber.includes('_') ? serialNumber.split('_')[0] : null);
    const rawCust = customerId || (serialNumber && serialNumber.includes('_') ? serialNumber.split('_')[1] : null);

    // Normalize store ID
    let effectiveStoreId = null;
    if (rawStore) {
      const s = rawStore.toLowerCase();
      if (s.includes('simba') || s === 'store-1792951625504') effectiveStoreId = 'store-1792951625504';
      else if (s.includes('mcrolls') || s.includes('mc-rolls')) effectiveStoreId = 'mc-rolls';
      else if (s.includes('pure')) effectiveStoreId = 'store-1793065927427';
      else if (s.includes('barber') || s.includes('one-stop')) effectiveStoreId = 'store-1793279923066';
      else effectiveStoreId = rawStore;
    }

    const snapshot = await db.collection('pass_registrations').get();

    if (snapshot.empty) {
      console.log("No registered Apple devices found in database.");
      return res.status(200).json({ success: true, count: 0, message: 'No Apple devices registered yet' });
    }

    const isBroadcast = !serialNumber || serialNumber === 'ALL' || (!rawCust && !phone);
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const tokens = [];
    const matchedDocs = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const docSerial = String(data.serialNumber || '');
      const docClean = docSerial.replace(/\D/g, '');

      // STRICT MULTI-TENANT STORE ISOLATION:
      // If a store is specified or detected, ONLY cards belonging to that store can match!
      if (effectiveStoreId) {
        const docSerialLower = docSerial.toLowerCase();
        let matchesStore = false;
        if (effectiveStoreId === 'store-1792951625504') {
          matchesStore = docSerialLower.includes('simba') || docSerialLower.includes('store-1792951625504');
        } else if (effectiveStoreId === 'mc-rolls') {
          matchesStore = docSerialLower.includes('mcrolls') || docSerialLower.includes('mc-rolls');
        } else if (effectiveStoreId === 'store-1793065927427') {
          matchesStore = docSerialLower.includes('store-1793065927427') || docSerialLower.includes('pure');
        } else if (effectiveStoreId === 'store-1793279923066') {
          matchesStore = docSerialLower.includes('store-1793279923066') || docSerialLower.includes('barber');
        } else {
          matchesStore = docSerialLower.startsWith(effectiveStoreId.toLowerCase());
        }

        if (!matchesStore) {
          // Never match passes belonging to other businesses!
          return;
        }
      }

      let matches = false;
      if (isBroadcast) {
        matches = true;
      } else if (serialNumber && (docSerial === serialNumber || docSerial.toLowerCase() === serialNumber.toLowerCase())) {
        matches = true;
      } else if (rawCust && docSerial.includes(rawCust)) {
        matches = true;
      } else if (cleanPhone && cleanPhone.length > 5 && docClean.includes(cleanPhone)) {
        matches = true;
      }

      if (matches) {
        matchedDocs.push(doc);
        if (data.pushToken && !tokens.includes(data.pushToken)) {
          tokens.push(data.pushToken);
        }
      }
    });

    console.log(`Sending APNs push to ${tokens.length} Apple devices (matched from ${snapshot.size} total, store: ${effectiveStoreId || 'all'})...`);

    if (tokens.length === 0) {
      console.log("ℹ️ No registered Apple devices found for this target/store. Skipping APNs push.");
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        message: 'No matching registered Apple devices found' 
      });
    }

    // Persist announcement for store and/or customer so iOS fetches the new message on pass update
    const nowTs = Date.now();
    try {
      if (message) {
        if (rawCust) {
          // Target customer only: never pollute other customers
          await db.collection('customers').doc(rawCust).set({
            latestMessage: message,
            messageUpdatedAt: nowTs
          }, { merge: true });
        } else if (effectiveStoreId) {
          // Broadcast ONLY to customers of this specific store
          try {
            const storeCusts = await db.collection('customers').get();
            const b = db.batch();
            storeCusts.forEach(cd => {
              const cData = cd.data();
              const cStore = (cData.businessId || 'mc-rolls').toLowerCase();
              let isMatch = false;
              if (effectiveStoreId === 'store-1792951625504') {
                isMatch = cStore.includes('simba') || cStore === 'store-1792951625504';
              } else if (effectiveStoreId === 'mc-rolls') {
                isMatch = cStore.includes('mcrolls') || cStore.includes('mc-rolls');
              } else {
                isMatch = cStore === effectiveStoreId.toLowerCase();
              }
              if (isMatch) {
                b.set(cd.ref, { latestMessage: message, messageUpdatedAt: nowTs }, { merge: true });
              }
            });
            await b.commit();
          } catch (bErr) {
            console.warn("Could not batch update store customers:", bErr);
          }
        }

        if (effectiveStoreId) {
          await db.collection('store_announcements').doc(effectiveStoreId).set({
            message: message,
            updatedAt: nowTs
          }, { merge: true });

          if (effectiveStoreId.includes('simba') || effectiveStoreId === 'store-1792951625504') {
            await db.collection('store_announcements').doc('store-1792951625504').set({
              message: message,
              updatedAt: nowTs
            }, { merge: true });
          }
        }
      }

      // ONLY update the matched registration documents that belong to this store/customer
      if (matchedDocs.length > 0) {
        const batch = db.batch();
        matchedDocs.forEach(d => {
          batch.update(d.ref, { updatedAt: nowTs, lastMessage: message || '' });
        });
        await batch.commit();
      }
    } catch (saveErr) {
      console.warn("Could not record announcement timestamp:", saveErr);
    }

    // Connect to Apple Push Gateway via HTTP/2
    const client = http2.connect('https://api.push.apple.com:443', {
      cert: certPem,
      key: keyPem
    });

    client.on('error', (err) => {
      console.error("HTTP2 client error:", err);
    });

    const sendPromises = tokens.map(token => {
      return new Promise((resolve) => {
        const req = client.request({
          ':method': 'POST',
          ':path': `/3/device/${token}`,
          'apns-topic': 'pass.com.fidelipassapp.loyalty',
          'apns-push-type': 'background',
          'apns-priority': '5',
          'apns-expiration': '0'
        });

        req.on('response', (headers) => {
          console.log(`APNs response for ${token.slice(0, 8)}... status:`, headers[':status']);
        });

        req.on('end', () => resolve(true));
        req.on('error', (e) => {
          console.error("APNs request error:", e);
          resolve(false);
        });

        // Apple PassKit push requires an empty JSON payload
        req.write('{}');
        req.end();
      });
    });

    await Promise.all(sendPromises);
    client.close();

    res.status(200).json({
      success: true,
      sentTo: tokens.length,
      message: 'Apple Push Notification dispatched successfully'
    });
  } catch (err) {
    console.error("Error dispatching APNs push:", err);
    res.status(500).json({ error: err.message });
  }
});

// Export Cloud Function as 'api'
export const api = onRequest({ cors: true, timeoutSeconds: 60, minInstances: 0 }, app);
