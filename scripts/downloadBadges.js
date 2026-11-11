import fs from 'fs';

async function getWikiSvg(fileName, dest) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
  const res = await fetch(apiUrl, { headers: { 'User-Agent': 'FideliPassApp/1.0' } });
  const data = await res.json();
  const pages = data?.query?.pages;
  const page = Object.values(pages)[0];
  const url = page?.imageinfo?.[0]?.url;
  if (!url) {
    console.error(`No URL found for ${fileName}`);
    return;
  }
  console.log(`Downloading ${fileName} from ${url}`);
  const svgRes = await fetch(url, { headers: { 'User-Agent': 'FideliPassApp/1.0' } });
  const text = await svgRes.text();
  fs.writeFileSync(dest, text, 'utf8');
  console.log(`Saved ${dest} (${text.length} bytes)`);
}

async function main() {
  await getWikiSvg('Add_to_Apple_Wallet_badge.svg', 'public/logos/add-to-apple-wallet.svg');
  await getWikiSvg('Add_to_Google_Wallet_badge.svg', 'public/logos/add-to-google-wallet.svg');
}

main();
