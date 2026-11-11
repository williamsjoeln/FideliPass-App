const fs = require('fs');
const logoBuf = fs.readFileSync('public/logos/fidelipass-logo.png');
const base64 = logoBuf.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image width="512" height="512" href="data:image/png;base64,${base64}"/>
</svg>`;
fs.writeFileSync('public/favicon.svg', svg);
console.log('Updated public/favicon.svg with official logo');
