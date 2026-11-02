// Optional artwork export. Ordinary builds use the checked-in optimized images.
// Requires the existing Playwright/Chrome setup and Pillow (as other image tools do).
const {chromium}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
(async()=>{
 const root=path.resolve(__dirname,'..');const stem=path.join(root,'images/blog/binance-hack-2026-security');
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent('<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}</style>'+fs.readFileSync(stem+'-cover.svg','utf8'));
  await page.screenshot({path:stem+'-social.png'});
 }finally{await browser.close()}
 execFileSync(process.platform==='win32'?'python':'python3',['-c',
  'from PIL import Image; import sys; p=sys.argv[1]; im=Image.open(p+"-social.png").convert("RGB"); im.save(p+"-cover.webp", quality=87, method=6); im.resize((640,336),Image.Resampling.LANCZOS).save(p+"-cover-640.webp",quality=88,method=6); im.save(p+"-social.png", optimize=True)',stem],{stdio:'inherit'});
 console.log('Exported original 1200×630 cover/social image and 640×336 thumbnail.');
})().catch(e=>{console.error(e);process.exitCode=1});
