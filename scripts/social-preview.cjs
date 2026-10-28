// Reuse the homepage's vector mascot, brand colors and truthful service text.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const home = fs.readFileSync(path.join(root, 'src/assets/robot.svg'), 'utf8');
  const robot = home.match(/<svg class="eye"[\s\S]*?<\/svg>/)[0].replace(/^<svg[^>]*>/, '<svg x="885" y="155" width="245" height="300" viewBox="0 0 200 220">');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0B1E2D"/><rect x="44" y="44" width="1112" height="542" rx="28" fill="#102A43" stroke="#234560" stroke-width="2"/>
  <rect x="88" y="108" width="72" height="6" rx="3" fill="#D9B65C"/>
  <g font-family="Arial,sans-serif"><text x="88" y="223" font-weight="700" font-size="78" fill="#F4EEDD">Rumi<tspan fill="#16A6A3">ware</tspan></text>
  <text x="88" y="318" font-size="42" font-weight="700" fill="#F4EEDD">Websites. Mobile apps.</text><text x="88" y="375" font-size="42" font-weight="700" fill="#3FD0CB">AI solutions.</text>
  <text x="88" y="470" font-size="25" fill="#B4C2CE">Lahore, Pakistan</text><text x="88" y="517" font-size="25" fill="#D9B65C">rumiware.com</text></g>${robot}</svg>`;
  fs.writeFileSync(path.join(root, 'images/social-preview.svg'), svg);
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page = await browser.newPage({ viewport: {width:1200,height:630}, deviceScaleFactor:1 });
  await page.setContent(`<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}</style>${svg}`);
  await page.screenshot({path:path.join(root,'images/social-preview.png')});
  await browser.close();
})();
