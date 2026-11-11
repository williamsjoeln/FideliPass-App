import fs from 'fs';
import crypto from 'crypto';

const keyJson = JSON.parse(fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/google-wallet-key.json', 'utf8'));

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: keyJson.client_email,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const unsignedToken = `${b64Header}.${b64Payload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(keyJson.private_key, 'base64url');
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const data = await res.json();
  return data.access_token;
}

async function sendGoogleWalletMessage() {
  const token = await getAccessToken();
  const classId = '3388000000023223415.fidelipass_loyalty_card';
  const url = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}/addMessage`;

  const body = {
    message: {
      header: 'MC ROLLS',
      body: '¡Hoy 2x1 en Helados Rollos hasta las 5 PM!',
      messageType: 'TEXT_AND_NOTIFY',
      id: `msg_${Date.now()}`
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await res.json();
  console.log('Google Wallet addMessage result:', res.status, result);
}

sendGoogleWalletMessage().catch(console.error);
