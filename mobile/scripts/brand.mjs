// Deterministic vector artwork, rasterized with a Chromium browser.
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1024,height:1024},deviceScaleFactor:1});
const mark='<path d="M412 398c0-105 164-105 164 0 0 43-64 48-64 97l211 115c23 13 14 46-12 46H313c-26 0-35-33-12-46l211-115" fill="none" stroke="#D9EF9F" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><circle cx="698" cy="345" r="20" fill="#D9EF9F"/>';
const svg=(background)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${background?'<rect width="1024" height="1024" fill="#214F40"/>':''}${mark}</svg>`;
fs.mkdirSync('assets',{recursive:true});
for(const [file,bg] of [['icon',true],['adaptive-icon',false]]) {
  const source=svg(bg); fs.writeFileSync(`assets/${file}.svg`,source);
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${source}`);
  await page.screenshot({path:`assets/${file}.png`,omitBackground:!bg});
}
await page.setViewportSize({width:64,height:64});
await page.setContent(`<style>html,body{margin:0}svg{width:64px;height:64px}</style>${svg(true)}`);
await page.screenshot({path:'assets/favicon.png'});
await browser.close();
console.log('Created Threadly Pocket icons.');
