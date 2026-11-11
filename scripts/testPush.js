// scripts/testPush.js
async function run() {
  try {
    const res = await fetch('https://fidelipassapp.com/api/sendApplePush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '593992407645',
        message: '¡Prueba de notificación Apple Wallet!'
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
