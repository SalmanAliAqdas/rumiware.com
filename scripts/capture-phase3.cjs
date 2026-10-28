const {chromium}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const stage=process.argv[2];if(!['before','after'].includes(stage))throw Error('Use before or after');
 const dir=path.resolve(__dirname,`../verification/phase3/${stage}`);fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.route(/formspree\.io|api\.web3forms\.com/,r=>r.abort());
 await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|www\.google\.com\/maps/,r=>r.fulfill({status:200,body:''}));
 const measurements=[];const base=process.env.PREVIEW_URL||(stage==='before'?'http://127.0.0.1:4173':'http://127.0.0.1:4174');
 for(const width of [375,1440])for(const theme of ['dark','light']){
  await page.setViewportSize({width,height:900});await page.goto(base+'/');await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);
  for(const name of ['index','portfolio','web-development','pricing','team']){
   await page.goto(`${base}/${name}.html`);await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=650){scrollTo(0,y);await new Promise(r=>setTimeout(r,15));}scrollTo(0,0);});
   await page.screenshot({path:path.join(dir,`${name}-${width}-${theme}.png`),fullPage:true});
   measurements.push(await page.evaluate(({name,width,theme})=>({name,width,theme,documentHeight:document.documentElement.scrollHeight,resourceBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.decodedBodySize,0),imageBytes:performance.getEntriesByType('resource').filter(r=>/\.(jpeg|png|webp)/.test(r.name)).reduce((n,r)=>n+r.decodedBodySize,0),domElements:document.querySelectorAll('*').length,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status}))}),{name,width,theme}));
  }
 }
 fs.writeFileSync(path.join(dir,'measurements.json'),JSON.stringify(measurements,null,2)+'\n');await browser.close();console.log(`Captured 20 ${stage} screenshots and local resource measurements.`);
})();
