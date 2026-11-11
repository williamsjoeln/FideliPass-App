async function main() {
  const res = await fetch('https://fideliacard.com/loyalty/club-vip/register');
  const html = await res.text();
  const match = html.match(/data-page="([^"]+)"/);
  if (match) {
    const raw = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const data = JSON.parse(raw);
    console.log('Business:', JSON.stringify(data.props.business, null, 2));
    console.log('Card:', JSON.stringify(data.props.card, null, 2));
    console.log('Fields:', JSON.stringify(data.props.fields, null, 2));
  }
}

main().catch(console.error);
