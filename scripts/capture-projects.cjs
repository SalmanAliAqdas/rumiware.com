// Read-only capture of the two public URLs already present in the portfolio.
const {chromium}=require('@playwright/test');const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');const dir=path.join(root,'reference/project-captures');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const results=[];
 for(const [id,url] of [['mani-bakes','https://rumi-ware.github.io/Mani-Bakes/'],['rumi-dental-care','https://www.rumidentalcare.com/']]){
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await page.route(/formspree\.io|api\.web3forms\.com/,r=>r.abort());
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   if(!response||response.status()>=400)throw Error('HTTP '+response?.status());
   await page.waitForTimeout(2500);
   await page.screenshot({path:path.join(dir,id+'.png')});
   results.push({id,requestedUrl:url,url:page.url(),status:response.status(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,6000),capturedAt:new Date().toISOString(),viewport:{width:1440,height:1000}});
  }catch(error){results.push({id,requestedUrl:url,error:error.message.split('\n')[0]});}
  await page.close();
 }
 fs.writeFileSync(path.join(root,'verification/phase3/project-evidence.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results.map(({text,...r})=>r),null,2));await browser.close();
})();
