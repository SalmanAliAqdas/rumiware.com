// Local lab observations, not a Lighthouse score or production field measurements.
const {chromium}=require('@playwright/test');const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const results=[];
 for(const width of [375,1440])for(let run=1;run<=3;run++){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();
  await page.addInitScript(()=>{
   window.lab={lcp:null,cls:null};
   if(PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint'))new PerformanceObserver(list=>{window.lab.lcp=list.getEntries().at(-1).startTime;}).observe({type:'largest-contentful-paint',buffered:true});
   if(PerformanceObserver.supportedEntryTypes.includes('layout-shift')){window.lab.cls=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.lab.cls+=e.value;}).observe({type:'layout-shift',buffered:true});}
  });
  await page.route(/formspree\.io|api\.web3forms\.com|www\.google\.com\/maps/,r=>r.abort());
  await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:4174')+'/');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(750);
  results.push(await page.evaluate(({width,run})=>{const n=performance.getEntriesByType('navigation')[0];return {width,run,domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd,lcpMs:window.lab.lcp,cls:window.lab.cls,decodedResourceBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.decodedBodySize,0),requests:performance.getEntriesByType('resource').length,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status}))};},{width,run}));await context.close();
 }
 const result={conditions:'Chrome, localhost, no CPU/network throttling, fresh context per run, 750ms post-font observation, reduced motion; layout-shift sum over that observation window',results};
 fs.writeFileSync(path.resolve(__dirname,'../verification/phase3/performance.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));await browser.close();
})();
