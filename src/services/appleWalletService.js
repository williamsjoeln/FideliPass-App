// src/services/appleWalletService.js
// Client-side native Apple Wallet (.pkpass) PassKit Generator & Cryptographic Signer for FideliPass
import forge from 'node-forge';
import JSZip from 'jszip';

// Apple Pass Type Certificate & Keys
const PASS_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIGQDCCBSigAwIBAgIQLRrKrZv6PAeg7DelfH7EwTANBgkqhkiG9w0BAQsFADB1
MUQwQgYDVQQDDDtBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9ucyBD
ZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTELMAkGA1UECwwCRzQxEzARBgNVBAoMCkFw
cGxlIEluYy4xCzAJBgNVBAYTAlVTMB4XDTI2MTAyNDE1NTA0NVoXDTI3MTEyMzE1
NTA0NFowgbIxLjAsBgoJkiaJk/IsZAEBDB5wYXNzLmNvbS5maWRlbGlwYXNzYXBw
LmxveWFsdHkxNTAzBgNVBAMMLFBhc3MgVHlwZSBJRDogcGFzcy5jb20uZmlkZWxp
cGFzc2FwcC5sb3lhbHR5MRMwEQYDVQQLDApINzlXNFlLOTZEMScwJQYDVQQKDB53
aWxsaWFtcyBqb2VsIG5hdmFycmV0ZSBtZXJpbm8xCzAJBgNVBAYTAlVTMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7DgWpuEWUFCHW000JndKasvvNTA5
341cIrAx47PZHMiM3vUb/0YdwNR+AXkod9Zp3NiQkMOwm3qH0izbvslRPh09eW+L
q8hTY5uFhylVws+Ob+z1l+6MLlDQeDaJ24r3x9ut0UZWn9aYwHyLCMDJWeqpalzV
aVl6Iuair0SdZWYYKulErZr5trZk3MD6ki/aqhMsJaphfCCL6w734mZdTvhQ4HNC
eU6gzIbIW3cRk2O2pEHkiaAgVl6CBigRxKyBEWK9BgSLgy71t9La6MfQlWKzt484
PST98z+ye9ldwlPTYcbms2OiIho0ljUK4Xle11b721rwrqMpIjR6leLhpQIDAQAB
o4ICjDCCAogwDAYDVR0TAQH/BAIwADAfBgNVHSMEGDAWgBRb2fod55oaC6OZdiJQ
hj6RyFt3qDBwBggrBgEFBQcBAQRkMGIwLQYIKwYBBQUHMAKGIWh0dHA6Ly9jZXJ0
cy5hcHBsZS5jb20vd3dkcmc0LmRlcjAxBggrBgEFBQcwAYYlaHR0cDovL29jc3Au
YXBwbGUuY29tL29jc3AwMy13d2RyZzQwNDCCAR4GA1UdIASCARUwggERMIIBDQYJ
KoZIhvdjZAUBMIH/MIHDBggrBgEFBQcCAjCBtgyBs1JlbGlhbmNlIG9uIHRoaXMg
Y2VydGlmaWNhdGUgYnkgYW55IHBhcnR5IGFzc3VtZXMgYWNjZXB0YW5jZSBvZiB0
aGUgdGhlbiBhcHBsaWNhYmxlIHN0YW5kYXJkIHRlcm1zIGFuZCBjb25kaXRpb25z
IG9mIHVzZSwgY2VydGlmaWNhdGUgcG9saWN5IGFuZCBjZXJ0aWZpY2F0aW9uIHBy
YWN0aWNlIHN0YXRlbWVudHMuMDcGCCsGAQUFBwIBFitodHRwczovL3d3dy5hcHBs
ZS5jb20vY2VydGlmaWNhdGVhdXRob3JpdHkvMB4GA1UdJQQXMBUGCCsGAQUFBwMC
BgkqhkiG92NkBA4wMgYDVR0fBCswKTAnoCWgI4YhaHR0cDovL2NybC5hcHBsZS5j
b20vd3dkcmc0LTMuY3JsMB0GA1UdDgQWBBRb35hE9UvUgKk//PmN2KiJpXNqQDAO
BgNVHQ8BAf8EBAMCB4AwLgYKKoZIhvdjZAYBEAQgDB5wYXNzLmNvbS5maWRlbGlw
YXNzYXBwLmxveWFsdHkwEAYKKoZIhvdjZAYDAgQCBQAwDQYJKoZIhvcNAQELBQAD
ggEBAJ2EFyOHeDM2VbGbt8i00fpj9iVnbdrM1O+WGSooilo9Z8vW/w3iviPH4Nl7
Vh2GyopsRUR3lP8lbk6P6w14HjY2Kb2YFjy5RrMGB/qGOaex095Pd6cS+adI42L1
00nKtUOyOAlJAD6NXt6A2fH0FooLOB7U4MTvVpgJtkiQmHoda7JjLZGSRiHW5Syb
2rh+i6J8nPJxiYdd/CM3t02+bGFpPs0+MZuUjeDGjlkc1epKAa8OM0jJUtKYZfrG
9DWu6K3ZO8H7mDOaTJ3OC4IzmnUOqL2BknrcxdZhZRAiCC/mNEISrjHGbEKFU4/X
bCShJjr/xfYjTHaWKKpTQxEVbrc=
-----END CERTIFICATE-----`;

const WWDR_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIEVTCCAz2gAwIBAgIUE9x3lVJx5T3GMujM/+Uh88zFztIwDQYJKoZIhvcNAQEL
BQAwYjELMAkGA1UEBhMCVVMxEzARBgNVBAoTCkFwcGxlIEluYy4xJjAkBgNVBAsT
HUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRYwFAYDVQQDEw1BcHBsZSBS
b290IENBMB4XDTIwMTIxNjE5MzYwNFoXDTMwMTIxMDAwMDAwMFowdTFEMEIGA1UE
Aww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNh
dGlvbiBBdXRob3JpdHkxCzAJBgNVBAsMAkc0MRMwEQYDVQQKDApBcHBsZSBJbmMu
MQswCQYDVQQGEwJVUzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANAf
eKp6JzKwRl/nF3bYoJ0OKY6tPTKlxGs3yeRBkWq3eXFdDDQEYHX3rkOPR8SGHgjo
v9Y5Ui8eZ/xx8YJtPH4GUnadLLzVQ+mxtLxAOnhRXVGhJeG+bJGdayFZGEHVD41t
QSo5SiHgkJ9OE0/QjJoyuNdqkh4laqQyziIZhQVg3AJK8lrrd3kCfcCXVGySjnYB
5kaP5eYq+6KwrRitbTOFOCOL6oqW7Z+uZk+jDEAnbZXQYojZQykn/e2kv1MukBVl
PNkuYmQzHWxq3Y4hqqRfFcYw7V/mjDaSlLfcOQIA+2SM1AyB8j/VNJeHdSbCb64D
YyEMe9QbsWLFApy9/a8CAwEAAaOB7zCB7DASBgNVHRMBAf8ECDAGAQH/AgEAMB8G
A1UdIwQYMBaAFCvQaUeUdgn+9GuNLkCm90dNfwheMEQGCCsGAQUFBwEBBDgwNjA0
BggrBgEFBQcwAYYoaHR0cDovL29jc3AuYXBwbGUuY29tL29jc3AwMy1hcHBsZXJv
b3RjYTAuBgNVHR8EJzAlMCOgIaAfhh1odHRwOi8vY3JsLmFwcGxlLmNvbS9yb290
LmNybDAdBgNVHQ4EFgQUW9n6HeeaGgujmXYiUIY+kchbd6gwDgYDVR0PAQH/BAQD
AgEGMBAGCiqGSIb3Y2QGAgEEAgUAMA0GCSqGSIb3DQEBCwUAA4IBAQA/Vj2e5bbD
eeZFIGi9v3OLLBKeAuOugCKMBB7DUshwgKj7zqew1UJEggOCTwb8O0kU+9h0UoWv
p50h5wESA5/NQFjQAde/MoMrU1goPO6cn1R2PWQnxn6NHThNLa6B5rmluJyJlPef
x4elUWY0GzlxOSTjh2fvpbFoe4zuPfeutnvi0v/fYcZqdUmVIkSoBPyUuAsuORFJ
EtHlgepZAE9bPFo22noicwkJac3AfOriJP6YRLj477JxPxpd1F1+M02cHSS+APCQ
A1iZQT0xWmJArzmoUUOSqwSonMJNsUvSq3xKX+udO7xPiEAGE/+QF4oIRynoYpgp
pU8RBWk6z/Kf
-----END CERTIFICATE-----`;

const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDsOBam4RZQUIdb
TTQmd0pqy+81MDnfjVwisDHjs9kcyIze9Rv/Rh3A1H4BeSh31mnc2JCQw7CbeofS
LNu+yVE+HT15b4uryFNjm4WHKVXCz45v7PWX7owuUNB4NonbivfH263RRlaf1pjA
fIsIwMlZ6qlqXNVpWXoi5qKvRJ1lZhgq6UStmvm2tmTcwPqSL9qqEywlqmF8IIvr
DvfiZl1O+FDgc0J5TqDMhshbdxGTY7akQeSJoCBWXoIGKBHErIERYr0GBIuDLvW3
0trox9CVYrO3jzg9JP3zP7J72V3CU9NhxuazY6IiGjSWNQrheV7XVvvbWvCuoyki
NHqV4uGlAgMBAAECggEAYuhFS9C5mB1v36He8TBHv5nuahXsVZeJ+ZhO+2nFwdCT
c5OsCmIgeSpALHu/nxXvM6KWPZdCrodKsY1I4YTH+Lsjj2JOWDpD+FQZP/PlzfE8
Uc8lMl2W4pnCAGPNq1hv0YZBLHxILxsa0JYVXS/j3ztrfnaqgTcO9egePEb9pIOi
J5BkLmtZ+3+fGbr4fcrR/zNswVxQdgGcUUDlul3IygbeR7GRiTt2OBuE7X4wmsQX
LP0GHOZeefGjYtWkzSykHILuUI9Tgtoi+YEoViog4uftPx4xkAfGCJuRNvN0nOCg
BLF9nV8unq3sHQcAMvWHNFBTz88jj4eORuhIwhQi7QKBgQD60719ZiRWQutbBqXl
2LyYZdYjR9IZDfSNooAclcfmm3hFN9RpONxSaBzl9PlMEFvBMLFuEcMCpZvwZlQc
3gkS7w6VgSpqUtZJtv/7Xj9JVcWdnlCgPGfdkv7Oh+1okJs1BO0iVusm6MPnSB68
sdQ1uVcC30oAeFjDVvmJmslZxwKBgQDxFzlmu+eEVPIJrw2xDfDnvJk+chVtdGAC
ZhnvZEg7uW1nMy/nntQ/kB93PJ8FAZLs+tgEHNz2lHa6vhwmDsShPM3pAAJKcMRj
Kjc6VpzMy/GbSjMVqfJsTVGxnhGrjBJDUSWvNqI4R5Pd3owaF78c13Bb8k7yCMqe
YUF0x3IJMwKBgBIrAh+yJVGmOTv3qE6Uu1xii/c0PZCZBSy5J4RqiPc4Lab920Hf
332MkwNJEkGjMbI1n7R0TubDLh9kmhUZNBkN/cVwfK0E4Qan3bTMZ9MdBlpbXEWu
+mr/Obul9tlLGCLn/3EsUI4Z8A6xl6BdVRyrFxVbLRYJoYxMoXiJIKqDAoGBAIsJ
TLY9mVfMsUT6alf4ZT0PnATSQB8+ZPwdK8nOOIYQ+tHwSCk4hMkfcbYPBNobPUNj
ql480wV1Oz+Y0Zz1GVqvOUStF6UcgXV67By9xHGrD+vxj6JnvwHMWVeohCI9hm7C
BoyUYls4lEL4zC1kEngsmoS8KeEVRtyt09ToDJDXAoGAA0P+aTGYIKIJ7MRfI583
W6pbBZ5k+l/rb0E3xr9nCVlBGkFA4cr1ZYaO+6wbJFr37/LWGrjt7aELq+eak7sW
Krnsql+5GK4spt39hqNiexusaNfVO7uBlGevUaKwXsbF8dp0c7Mgl6EKd6MoHkGm
O1y2cxtNP/1ZV6r5JJDVnoQ=
-----END PRIVATE KEY-----`;

// Helper: Convert HEX color to RGB string required by Apple Wallet
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

// Helper: Compute SHA-1 hex hash using WebCrypto
async function sha1Hex(arrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-1', arrayBuffer);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert any dataUrl (PNG, JPG, WebP) to a pure PNG ArrayBuffer via Image + Canvas
async function dataUrlToPngBuffer(dataUrl) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof document === 'undefined') {
        // Fallback for non-DOM context
        const base64 = dataUrl.split(',')[1];
        const binStr = atob(base64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        return resolve(bytes.buffer);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Canvas toBlob failed'));
            blob.arrayBuffer().then(resolve).catch(reject);
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(new Error('Error decoding image data: ' + e));
      img.src = dataUrl;
    } catch (err) {
      reject(err);
    }
  });
}

// Helper: Fetch image from URL or dataUrl as pure PNG ArrayBuffer
async function fetchImageBuffer(url, fallbackUrl = '/logos/fidelipass-logo.png') {
  if (!url) {
    if (fallbackUrl) return fetchImageBuffer(fallbackUrl, null);
    return null;
  }

  // Handle data URLs safely (never call fetch on data: URLs in mobile Safari)
  if (url.startsWith('data:')) {
    try {
      return await dataUrlToPngBuffer(url);
    } catch (err) {
      console.warn('Could not decode dataUrl for Apple Wallet pass, using fallback:', err);
      if (fallbackUrl) return fetchImageBuffer(fallbackUrl, null);
      return null;
    }
  }

  // Handle regular HTTP/local URLs
  try {
    const targetUrl = (typeof window !== 'undefined' && url.startsWith('/'))
      ? `${window.location.origin}${url}`
      : url;
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.arrayBuffer();
  } catch (err) {
    console.warn(`Could not load image ${url} for Apple Wallet:`, err);
    if (fallbackUrl && fallbackUrl !== url) {
      return fetchImageBuffer(fallbackUrl, null);
    }
    return null;
  }
}

/**
 * Generate a dynamic Apple Wallet .pkpass file signed with official Apple Developer credentials
 */
export async function generateAppleWalletPass({ business, customer }) {
  const zip = new JSZip();

  const businessName = business?.name || 'MC ROLLS';
  const businessId = business?.id || 'mc-rolls';
  const maxStamps = Number(business?.maxStamps) || 8;
  const stamps = Math.min(Math.max(Number(customer?.stamps) || 0, 0), maxStamps);
  const reward = business?.reward || 'Helado Rollo Gratis';
  const customerName = customer?.name || 'Williams Joel';
  const customerPhone = customer?.phone || customer?.id || '+593 99 240 7645';

  // Build emoji progress bar
  const isCafeteria = business?.category?.toLowerCase()?.includes('caf') || business?.name?.toLowerCase()?.includes('caf');
  const stampActiveEmoji = isCafeteria ? '☕' : (business?.emoji || '⭐');
  const emojis = [];
  for (let i = 0; i < maxStamps; i++) {
    emojis.push(i < stamps ? stampActiveEmoji : '⚪');
  }
  const progressEmojis = emojis.join(' ');

  // Standard Apple StoreCard Pass JSON
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.fidelipassapp.loyalty',
    serialNumber: `${businessId}_${customerPhone.replace(/\D/g, '') || '001'}`,
    teamIdentifier: 'H79W4YK96D',
    webServiceURL: 'https://fidelipassapp.com/api',
    authenticationToken: 'fidelipass_token_2026',
    organizationName: businessName,
    description: `Tarjeta de Fidelidad ${businessName}`,
    logoText: businessName,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: hexToRgb(business?.cardBgColor || business?.accentColor),
    labelColor: 'rgb(220, 240, 230)',
    storeCard: {
      headerFields: [
        {
          key: 'stamps',
          label: 'SELLOS',
          value: `${stamps} / ${maxStamps}`,
          changeMessage: `¡Tus sellos en ${businessName} se actualizaron a %@!`
        }
      ],
      primaryFields: [], // Dejar vacío para que la foto del banner se aprecie 100% nítida sin emojis montados
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
        }
      ],
      backFields: [
        {
          key: 'announcement',
          label: 'Última Novedad',
          value: `¡Bienvenido a ${businessName}!`,
          changeMessage: '%@'
        },
        {
          key: 'howItWorks',
          label: '¿Cómo funciona?',
          value: `Acumula ${maxStamps} sellos mostrando este código en caja al comprar y reclama: ${reward}.`
        },
        {
          key: 'terms',
          label: 'Términos y Condiciones',
          value: '1 sello por cada compra. Válido en locales participantes.'
        },
        {
          key: 'poweredBy',
          label: 'Plataforma',
          value: 'FideliPass • https://fidelipassapp.com'
        },
        {
          key: 'support',
          label: 'Soporte y Contacto',
          value: customerPhone
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

  // Native Apple PassKit GPS Proximity Geofencing (Notificación hiperpersonalizada al pasar cerca)
  const geofenceEnabled = business?.enableGeofence !== false;
  const storeLat = Number(business?.latitude !== undefined ? business.latitude : -2.1911889);
  const storeLng = Number(business?.longitude !== undefined ? business.longitude : -79.9449926);
  if (geofenceEnabled && !isNaN(storeLat) && !isNaN(storeLng)) {
    const stampsRemaining = Math.max(0, maxStamps - stamps);
    const firstName = (customer?.name || '').trim().split(' ')[0] || '';
    let proximityText = business?.proximityMessage || '';

    if (proximityText && proximityText.includes('{faltan}')) {
      proximityText = proximityText
        .replace(/{faltan}/g, stampsRemaining)
        .replace(/{nombre}/g, firstName)
        .replace(/{sellos}/g, stamps);
    } else {
      if (stampsRemaining === 0) {
        proximityText = `🎁 ¡Estás cerca de ${businessName}${firstName ? ', ' + firstName : ''}! Ya tienes tu ${reward} listo para canjear en caja.`;
      } else if (stampsRemaining === 1) {
        proximityText = `🎉 ¡Estás cerca de ${businessName}${firstName ? ', ' + firstName : ''}! Te falta solo 1 sello para tu ${reward}.`;
      } else {
        proximityText = `✨ ¡Estás cerca de ${businessName}${firstName ? ', ' + firstName : ''}! Te faltan ${stampsRemaining} sellos para tu ${reward}.`;
      }
    }

    passJson.locations = [
      {
        latitude: storeLat,
        longitude: storeLng,
        relevantText: proximityText
      }
    ];
  }

  const passJsonStr = JSON.stringify(passJson, null, 2);
  const passJsonBuffer = new TextEncoder().encode(passJsonStr).buffer;
  zip.file('pass.json', passJsonBuffer);

  const filesToHash = {
    'pass.json': passJsonBuffer
  };

  // Load pass images (icon for notifications, logo for header, strip for banner)
  const storeLogoUrl = business?.logo || '/logos/fidelipass-logo.png';
  const isMcRolls = !business?.id || business?.id === 'mc-rolls' || business?.name?.toLowerCase()?.includes('mc rolls');
  const isSimba = business?.id === 'store-1792951625504' || business?.name?.toLowerCase()?.includes('simba');
  const isOneStopBarber = business?.slug?.includes('one-stop') || business?.id?.includes('barber') || business?.name?.toLowerCase()?.includes('one stop') || business?.name?.toLowerCase()?.includes('barber');
  const isPureSoul = business?.slug?.includes('pure-soul') || business?.name?.toLowerCase()?.includes('pure soul');
  const safeStamps = Math.min(business?.maxStamps || 6, Math.max(0, stamps));

  let storeBannerUrl = null;
  if (isOneStopBarber) {
    storeBannerUrl = `/logos/strips/onestopbarber-strip-${safeStamps}.png`;
  } else if (isPureSoul) {
    storeBannerUrl = `/logos/strips/puresoul-strip-${safeStamps}.png`;
  } else if (isMcRolls) {
    storeBannerUrl = `/logos/strips/mcrolls-strip-${safeStamps}.png`;
  } else if (isSimba) {
    storeBannerUrl = `/logos/strips/simba-strip-${safeStamps}.png`;
  } else if (business?.banner && (business.banner.startsWith('data:') || business.banner.startsWith('http') || business.banner.startsWith('/'))) {
    storeBannerUrl = business.banner;
  } else {
    storeBannerUrl = `/logos/strips/fidelipass-strip-${safeStamps}.png`;
  }

  const [iconBuf, logoBuf, stripBuf] = await Promise.all([
    fetchImageBuffer(storeLogoUrl, '/logos/fidelipass-logo.png'), // Store logo used as lock-screen notification icon
    fetchImageBuffer(storeLogoUrl, '/logos/fidelipass-logo.png'), // Store logo used in pass header
    storeBannerUrl ? fetchImageBuffer(storeBannerUrl, null) : Promise.resolve(null)
  ]);

  if (iconBuf) {
    zip.file('icon.png', iconBuf);
    zip.file('icon@2x.png', iconBuf);
    filesToHash['icon.png'] = iconBuf;
    filesToHash['icon@2x.png'] = iconBuf;
  }

  if (logoBuf) {
    zip.file('logo.png', logoBuf);
    zip.file('logo@2x.png', logoBuf);
    filesToHash['logo.png'] = logoBuf;
    filesToHash['logo@2x.png'] = logoBuf;
  }

  if (stripBuf) {
    zip.file('strip.png', stripBuf);
    zip.file('strip@2x.png', stripBuf);
    filesToHash['strip.png'] = stripBuf;
    filesToHash['strip@2x.png'] = stripBuf;
  }

  // Generate manifest.json (SHA-1 checksums)
  const manifest = {};
  for (const [filename, buffer] of Object.entries(filesToHash)) {
    manifest[filename] = await sha1Hex(buffer);
  }

  const manifestStr = JSON.stringify(manifest, null, 2);
  const manifestBuffer = new TextEncoder().encode(manifestStr).buffer;
  zip.file('manifest.json', manifestBuffer);

  // Cryptographically sign manifest.json with official Apple Certificates using node-forge
  const cert = forge.pki.certificateFromPem(PASS_CERT_PEM);
  const privateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM);
  const wwdrCert = forge.pki.certificateFromPem(WWDR_CERT_PEM);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestStr, 'utf8');
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

  // Convert binary string to Uint8Array
  const sigLen = derBytes.length;
  const signatureBytes = new Uint8Array(sigLen);
  for (let i = 0; i < sigLen; i++) {
    signatureBytes[i] = derBytes.charCodeAt(i);
  }

  zip.file('signature', signatureBytes.buffer);

  // Package into .pkpass blob
  const pkpassBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.apple.pkpass',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return pkpassBlob;
}

/**
 * Triggers native Apple Wallet sheet in iOS Safari, or downloads on other devices
 */
export async function downloadAppleWalletPass({ business, customer }) {
  const blob = await generateAppleWalletPass({ business, customer });
  const blobUrl = URL.createObjectURL(blob);

  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  if (isIOS) {
    // In iOS Safari, direct navigation to pkpass blob URL immediately triggers the native Add to Wallet modal sheet
    window.location.href = blobUrl;
  } else {
    const filename = `${business?.id || 'fidelipass'}_wallet.pkpass`;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.setAttribute('type', 'application/vnd.apple.pkpass');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try { document.body.removeChild(link); } catch {}
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  }

  return true;
}

/**
 * Triggers background APNs push notification to wake up iPhones and update Apple Wallet
 */
export async function sendAppleWalletPushNotification({ serialNumber, phone, message, storeId, customerId }) {
  try {
    const res = await fetch('https://fidelipassapp.com/api/sendApplePush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serialNumber, phone, message, storeId, customerId })
    });
    const data = await res.json();
    console.log("🍏 Apple Wallet Push response:", data);
    return data;
  } catch (err) {
    console.warn("Could not dispatch Apple Wallet push:", err);
    return null;
  }
}
