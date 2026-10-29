const {test,expect}=require('@playwright/test');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const config=JSON.parse(fs.readFileSync(path.join(root,'src/data/site.json'),'utf8'));
function fingerprint(){const hash=crypto.createHash('sha256');function walk(dir){for(const name of fs.readdirSync(dir).sort()){const file=path.join(dir,name);if(fs.statSync(file).isDirectory())walk(file);else hash.update(path.relative(out,file)).update(fs.readFileSync(file));}}walk(out);return hash.digest('hex');}
test.beforeEach(async({context})=>{
 await context.route(/formspree\.io|api\.web3forms\.com/,r=>r.abort());
 await context.route(/www\.google\.com\/maps/,r=>r.fulfill({status:200,body:''}));
});
test('release output contains complete public documents and excludes all development sources',async({request})=>{
 expect(fs.readdirSync(out).filter(f=>f.endsWith('.html'))).toHaveLength(20);
 expect(fs.readdirSync(out,{recursive:true}).filter(f=>f.endsWith('.html'))).toHaveLength(21);
 for(const file of ['head.html','header.html','footer.html','get-quote-preview.html','.vscode/sftp.json','reference/phase2/index.html','package.json']){
  expect(fs.existsSync(path.join(out,file))).toBe(false);
  // The legacy quote preview is a test-only compatibility route, not a release file.
  if(file!=='get-quote-preview.html')expect((await request.get('/'+file)).status()).toBe(404);
 }
 const home=await (await request.get('/index.html')).text();expect(home).toContain('<header>');expect(home).toContain('<footer>');expect(home).not.toContain('fetch("header');
});
test('shared configuration drives every header, contact endpoint and package summary',async({page})=>{
 for(const file of fs.readdirSync(out,{recursive:true}).filter(f=>f.endsWith('.html')).map(f=>f.replaceAll('\\','/'))){
  await page.goto('/'+file);await expect(page.locator('#nav li')).toHaveCount(config.navigation.filter(n=>n.main).length);
  await expect(page.locator('footer')).toContainText(config.hours);await expect(page.locator('footer')).toContainText(config.email);
  await expect(page.locator('header .hdr-cta')).toHaveText('Request a consultation');
 }
 await page.goto('/get-quote.html?plan=starter');await expect(page.locator('#selected-package')).toContainText('PKR 50,000');await expect(page.locator('#selected-package')).toContainText('1 month');
 await expect(page.locator('#quoteForm')).toHaveAttribute('action',config.forms.quote);
 await page.goto('/contact.html');await expect(page.locator('form')).toHaveAttribute('action',config.forms.contact);
 await page.goto('/pricing.html');await expect(page.locator('.price').nth(0)).toContainText('PKR 50,000');await expect(page.locator('.price').nth(1)).toContainText('PKR 150,000');
});
test('homepage prioritizes real project records and links to exact cases',async({page})=>{
 await page.goto('/');
 expect(await page.locator('main>section').nth(1).getAttribute('id')).toBe('work');
 await expect(page.locator('.home-work article')).toHaveCount(3);
 await page.locator('.home-work a[href="portfolio.html#schoolos"]').click();await expect(page.locator('#schoolos')).toBeVisible();
 await expect(page.locator('.case-study')).toHaveCount(11);await expect(page.locator('main')).not.toContainText('Sample project');
 await expect(page.locator('#schoolos figcaption')).toContainText('Public sign-in screen');
 await expect(page.locator('#mani-bakes, #rumi-dental-care')).toHaveCount(2);
});
test('local fonts load, portraits have dimensions, and no generic social profile links remain',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(r.url()));await page.goto('/team.html');await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>document.fonts.check('800 24px "Bricolage Grotesque"'))).toBe(true);
 expect(await page.evaluate(()=>document.fonts.check('400 16px "DM Sans"'))).toBe(true);
 expect(requests.some(u=>/fonts\.googleapis|fonts\.gstatic/.test(u))).toBe(false);
 for(const img of await page.locator('.avatar-photo img').all()){
  await img.scrollIntoViewIfNeeded();await expect(img).toHaveAttribute('src',/\.webp$/);expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0);expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0);await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
 }
 await expect(page.locator('a[href="https://github.com/"],a[href="https://www.linkedin.com/"]')).toHaveCount(0);
});
test('bounded mascot, focus visibility and form feedback avoid floating contact overlap',async({page})=>{
 for(const width of [320,375,768,960,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/');const box=await page.locator('.eye').boundingBox();expect(box.width).toBeLessThanOrEqual(240);expect(box.height).toBeLessThanOrEqual(264);
 }
 await page.goto('/contact.html');await page.locator('#cn').focus();await expect(page.locator('.wa')).toBeHidden();
});
test('all public images and font resources load at the repository mount',async({page})=>{
 const failed=[];page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1')&&r.status()>=400)failed.push(r.url());});
 for(const file of ['index.html','team.html','portfolio.html']){await page.goto('/rumiware.com/'+file);for(const img of await page.locator('img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);}}
 expect(failed).toEqual([]);
});
test('generated output is reproducible and no analytics or active placeholder destinations return',async({page})=>{
 const before=fingerprint();
 const inputs=JSON.parse(fs.readFileSync(path.join(root,'src/data/pages.json'),'utf8'));expect(Object.keys(inputs)).toHaveLength(21);
 const network=[];page.on('request',r=>{if(/googletagmanager|google-analytics|\/g\/collect/.test(r.url()))network.push(r.url());});await page.goto('/');await page.locator('footer [data-privacy-open]').click();await page.getByRole('button',{name:'Decline optional analytics'}).click();
 await page.goto('/contact.html');expect(network).toEqual([]);
 execFileSync(process.execPath,[path.join(root,'scripts/build.cjs')],{cwd:root});
 expect(before).toBe(fingerprint());
});
