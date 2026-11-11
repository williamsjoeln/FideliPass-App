/**
 * Google Wallet Pass Generator for FideliPass
 * Uses browser-native Web Crypto API to sign RS256 JWTs locally without any backend latency.
 */

export const WALLET_ISSUER_ID = '3388000000023223415';
export const WALLET_CLASS_ID = `${WALLET_ISSUER_ID}.fidelipass_loyalty_card`;
export const SERVICE_ACCOUNT_EMAIL = 'google-wallet-pass@fidelipass-ec.iam.gserviceaccount.com';

const RSA_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9+WoVaa6vXCcX
kzLGdmRf5VYv60UQo3XTT4zHMi6TuM0zSdOES6bb1ZslPgia4tqXHK5EKsnz/BY+
qwxKPhDVD8PEA24FISNhRogwaOXgHtg/DjEhZ6GMJx4weo/0z8FX/jjzrt0JY0T4
rIVU1O+zIR1jmcIYWKrH+KoJzaBSisO5LQenuwIpzJSe12SSMZPXUyANw2HyyX7h
hxmfioiYcMcz2mzIo1B/+w74Ekn+ZkqblOYOV3mf7BIAJCyxVfNFkuU8rqFs3zkG
CRIiKhZic1W3J+KtWH3lRWzaaOgY1Q+5PpozlI2KoR8G2FY3Ma7okpB9ep70ozTc
Rp4LBF1dAgMBAAECggEACjdyHZGv681catenOOYgEsouHuibr7/is8kI7KOFvrsH
ChWT0v8Qi60KqW+THeVKVSsdMhxM/RqXBarEP+/jjtnIsO9wSMVV9kLJSzUw+6Md
BRMZ0E6W8QcfiALnYAaWQsmwvWYvi/QzPt5kU0IaW/tRbcxUlGOcV6HHXzyYPSgS
i9tZotmau+KYkys1CL6hh2E9tl6pcby1nAOuPuDm8IlNDq0cBid7cTGx7jslhzhg
4OJLIIoYp7gJKMTnTt6cD21wGM8c4Lh0zaXOl0Xl3KIvKciMgW8vCUzRjX54EdZw
/oAh+c6zjWcTi9aiO4Bh74kSkCLmYroyFG6mWtI4AQKBgQDnrSJBnYtHCQzdScYg
7iUY6bL5TFgmqjX5G3uPG5gKzwI/UBZNSSZB6BAqv9m9LnJOLRP/1PkyRwphzDgY
UFbllhVKsL1M8rh05nGFUhHep2/rwev2r2SaFv3SLtDjQhVGfuqDkXCxcCeuNJIm
rRHIkf+O7K3BVYPrgGRItuakAQKBgQDR62/O/t/TtyabDusdzUG819obYVUqCkf1
JGmVcU5HNOB8xz63I7bnP8QF5BrJlKdiynI58oiS+RloYa1j92RPmTpzj3NCZz4B
5DSRffIlwE/y8uT1G91EMV0UDla3R4NnGlwwWayj/FuqEEErNT4xYCAEyF5HOQdU
yiBg6nbJXQKBgEZIpf3V96zjN/3iJbNTy/lU3LD40j1YoesixUdTDbsptfrTJxDn
Qi34Yv81GK9l6dOBpXGVgMwZ9TJaLCJkLRiVgXwZRjST5hXA22ugzD8J+NBDEnzS
FOkSVIpxHXn0UFQEqMylUNTju4YD+Nq24pBAipEniEcA1HabitDse+gBAoGAPBo4
rP90fl2WBBdFYgb+p17155j6lUrUR2/hexQx4VlWXON/JVhoadVr/nPM56JUOojU
I5s5VztS9vvgdRrD8bZhcezEh2Kf8lKwamexCPYC7gB1ZWhQ9dFcYP2p/lfPW5nE
g2NpdpoudIaq4gAgimqHQFdOBv5hBvnIQ3deA1ECgYEA5vx3De1ovybFYoeWCDce
5NnMwlCEe1X6tUvOopC6YvoKK9T0jinZkp/Kf16Bdry2gf7snqtpT5luQ91L22yU
tlL2B3nvmOzRWLv3U9g5l19Yb5t3z3Xuzqn6xZzVVNkXyhKieDfiwyET17c1FJl1
eaUYK85IJPt10WKuTGsTG4s=
-----END PRIVATE KEY-----`;

let cachedCryptoKey = null;

function pemToUint8Array(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufferToBase64Url(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getCryptoKey() {
  if (cachedCryptoKey) return cachedCryptoKey;
  const keyBytes = pemToUint8Array(RSA_PRIVATE_KEY_PEM);
  const subtle = window?.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API no disponible en este navegador.');
  }
  cachedCryptoKey = await subtle.importKey(
    'pkcs8',
    keyBytes,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    false,
    ['sign']
  );
  return cachedCryptoKey;
}

/**
 * Generates an official "Save to Google Wallet" URL for a customer pass.
 */
export async function generateGoogleWalletPassUrl({ business, customer, cardUrl }) {
  const cryptoKey = await getCryptoKey();

  const businessId = String(business?.id || 'fidelipass').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const customerRef = String(customer?.phone || customer?.id || 'demo').replace(/[^a-zA-Z0-9]/g, '');
  const stamps = Number(customer?.stamps || 0);
  const max = Number(business?.maxStamps || business?.totalStamps || 8);
  const remaining = Math.max(0, max - stamps);
  const objectId = `${WALLET_ISSUER_ID}.${businessId}_${customerRef}_s${stamps}`;

  // Pick emoji matching business type
  let filledEmoji = '🍨';
  if (business?.iconType === 'coffee') filledEmoji = '☕';
  else if (business?.iconType === 'pizza') filledEmoji = '🍕';
  else if (business?.iconType === 'burger') filledEmoji = '🍔';
  else if (business?.iconType === 'barber') filledEmoji = '✂️';
  else if (business?.iconType === 'car') filledEmoji = '🚗';
  else if (business?.iconType === 'star') filledEmoji = '⭐';
  else if (business?.iconType === 'gift') filledEmoji = '🎁';

  const emptyEmoji = '⚪';
  const stampBar = Array.from({ length: max }, (_, i) => (i < stamps ? filledEmoji : emptyEmoji)).join(' ');

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const storeNameLower = String(business?.name || '').toLowerCase();
  const isOneStopBarber = businessId.includes('barber') || businessId.includes('one-stop') || storeNameLower.includes('barber') || storeNameLower.includes('one stop');
  const isPureSoul = businessId.includes('pure') || storeNameLower.includes('pure soul');
  const isSimba = businessId.includes('simba') || storeNameLower.includes('simba');
  const isMcRolls = businessId.includes('mc_rolls') || businessId.includes('mcrolls') || storeNameLower.includes('mc rolls');

  let dynamicHeroUrl = `https://fidelipassapp.com/logos/strips/fidelipass-strip-${Math.min(8, Math.max(0, stamps))}.png`;
  if (isOneStopBarber) {
    dynamicHeroUrl = `https://fidelipassapp.com/logos/strips/onestopbarber-strip-${Math.min(6, Math.max(0, stamps))}.png`;
  } else if (isPureSoul) {
    dynamicHeroUrl = `https://fidelipassapp.com/logos/strips/puresoul-strip-${Math.min(6, Math.max(0, stamps))}.png`;
  } else if (isSimba) {
    dynamicHeroUrl = `https://fidelipassapp.com/logos/strips/simba-strip-${Math.min(8, Math.max(0, stamps))}.png`;
  } else if (isMcRolls) {
    dynamicHeroUrl = `https://fidelipassapp.com/logos/strips/mcrolls-strip-${Math.min(8, Math.max(0, stamps))}.png`;
  }

  const heroImageUrl = (business?.banner && business.banner.startsWith('http') && !business.banner.includes('mcrolls-banner') && !business.banner.includes('puresoul-banner') && !business.banner.includes('simba-banner'))
    ? business.banner
    : dynamicHeroUrl;

  const vipMemberCode = customerRef ? `VIP-${customerRef.slice(-4).toUpperCase()}` : 'VIP';

  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyObjects: [
        {
          id: objectId,
          classId: WALLET_CLASS_ID,
          state: 'ACTIVE',
          hexBackgroundColor: business?.cardBgColor || '#1B474A',
          heroImage: {
            sourceUri: {
              uri: heroImageUrl
            },
            contentDescription: {
              defaultValue: {
                language: 'es',
                value: `${business?.name || 'FideliPass'} - ${business?.rewardTitle || 'Tarjeta de Lealtad'}`
              }
            }
          },
          accountId: vipMemberCode,
          accountName: String(customer?.name || 'Cliente VIP'),
          barcode: {
            type: 'QR_CODE',
            value: cardUrl || `https://fidelipassapp.com/?store=${businessId}&c=${customerRef}`,
            alternateText: ' '
          },
          loyaltyPoints: {
            balance: {
              int: stamps
            },
            label: 'Sellos acumulados'
          },
          locations: [
            {
              kind: 'walletobjects#latLongPoint',
              latitude: Number(business?.latitude !== undefined ? business.latitude : -2.1911889),
              longitude: Number(business?.longitude !== undefined ? business.longitude : -79.9449926)
            }
          ],
          textModulesData: [
            {
              header: 'Progreso de Sellos',
              body: `${stampBar} (${stamps} de ${max})`
            },
            {
              header: 'Faltan para tu premio',
              body: remaining === 0 ? '🎉 ¡PREMIO DESBLOQUEADO!' : `Te faltan solo ${remaining} sellos`
            },
            {
              header: 'Premio al Completar',
              body: String(business?.rewardTitle || 'Premio de Fidelidad')
            },
            {
              header: 'Comercio',
              body: String(business?.name || 'FideliPass')
            }
          ]
        }
      ]
    }
  };

  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const subtle = window?.crypto?.subtle;
  const signatureBuffer = await subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    cryptoKey,
    encoder.encode(message)
  );

  const signatureBase64Url = bufferToBase64Url(signatureBuffer);
  const jwt = `${message}.${signatureBase64Url}`;

  return `https://pay.google.com/gp/v/save/${jwt}`;
}

/**
 * Sends a native lock-screen / shade push notification to Android devices with the pass
 */
export async function sendGoogleWalletPushNotification({
  businessName = 'MC ROLLS',
  message = '¡Promoción especial!',
  customerId = null
}) {
  try {
    const cryptoKey = await importPrivateKey();
    const now = Math.floor(Date.now() / 1000);

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    };

    const encodedHeader = stringToBase64Url(JSON.stringify(header));
    const encodedPayload = stringToBase64Url(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const signatureBuffer = await window.crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      cryptoKey,
      encoder.encode(unsignedToken)
    );

    const jwt = `${unsignedToken}.${bufferToBase64Url(signatureBuffer)}`;

    // Exchange assertion for Google OAuth2 access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.warn("Could not get Google OAuth token for push:", err);
      return false;
    }

    const { access_token } = await tokenRes.json();

    // Call Google Wallet API addMessage with TEXT_AND_NOTIFY
    const url = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${WALLET_CLASS_ID}/addMessage`;
    const messageBody = {
      message: {
        header: businessName,
        body: message,
        messageType: 'TEXT_AND_NOTIFY',
        id: `msg_${Date.now()}`
      }
    };

    const pushRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });

    if (pushRes.ok) {
      console.log("✅ Google Wallet Push Notification sent successfully via Google Cloud!");
      return true;
    } else {
      const errJson = await pushRes.json();
      console.warn("Google Wallet addMessage returned non-200:", errJson);
      return false;
    }
  } catch (err) {
    console.error("Error sending Google Wallet push:", err);
    return false;
  }
}
