// scripts/testOldPayload.js
async function test() {
  const res = await fetch('https://fidelipassapp.com/api/sendApplePush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serialNumber: 'mc-rolls_9023',
      phone: null,
      message: 'Prueba desde payload antiguo'
    })
  });
  const data = await res.json();
  console.log("Result:", data);
}
test();
