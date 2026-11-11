// scripts/testPayloads.js
async function test(name, payload) {
  try {
    const res = await fetch('https://fidelipassapp.com/api/sendApplePush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(`[${name}] Status: ${res.status}`, data);
  } catch (err) {
    console.error(`[${name}] Error:`, err);
  }
}

async function run() {
  await test("Broadcast ALL", { serialNumber: null, phone: null, message: "Mensaje a todos" });
  await test("By Phone only", { serialNumber: null, phone: "593992407645", message: "Mensaje por teléfono" });
  await test("By Serial with clean phone", { serialNumber: "mc-rolls_593992407645", phone: "+593 99 240 7645", message: "Mensaje por serial y teléfono" });
}

run();
