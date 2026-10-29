const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const projects=require('../src/data/projects.json');
test.beforeEach(async({context})=>{await context.route(/formspree\.io|api\.web3forms\.com/,r=>r.abort());});

test('nine supplied records publish exact URLs, safe previews and owner status at both mounts',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 expect(projects).toHaveLength(9);
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount+'portfolio.html');await expect(page.locator('.proj')).toHaveCount(9);
  await expect(page.locator('main')).toContainText('development status supplied by the project owner');
  await expect(page.locator('main')).not.toContainText(/Mani Bakes|Rumi Dental Care|contribution|Sample project/);
  await expect(page.locator('main iframe')).toHaveCount(0);
  await expect(page.locator('#portfolio-demo h2')).toHaveText('Rumi Enquiry Assistant');
  await expect(page.locator('#portfolio-demo')).toContainText('fictional examples');
  await expect(page.locator('#portfolio-demo')).not.toContainText('Portfolio demo');
  for(const p of projects){
   const card=page.locator('#'+p.id);await expect(card.locator('h2')).toHaveText(p.name);
   await expect(card.locator('.tag')).toHaveText('Completed');await expect(card.locator('.project-category')).toContainText(p.category);
   const link=card.locator('a.more');await expect(link).toHaveAttribute('href',p.url);await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAccessibleName(/opens in a new tab/);
   const img=card.locator('img');await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);await expect(img).toHaveAttribute('alt',p.alt);
   if(p.image.endsWith('.svg'))await expect(card.locator('figcaption')).toHaveText('Branded project cover, not an application screenshot.');
  }
  await page.goto(mount+'contact.html');await expect(page.locator('main')).toContainText('Rumi Dental Care');
 }
 const archive=JSON.parse(fs.readFileSync('reference/portfolio-before-nine-projects.json','utf8'));expect(archive.map(p=>p.id)).toEqual(['mani-bakes','rumi-dental-care']);
 expect(errors).toEqual([]);
});

test('category filters work by keyboard in both themes and retain visible focus',async({page})=>{
 for(const theme of ['dark','light']){
  await page.goto('/portfolio.html');await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);await page.reload();
  const buttons=page.locator('.filters button');expect(await buttons.count()).toBe(1+new Set(projects.map(p=>p.categoryId)).size);
  for(const button of await buttons.all()){
   await button.focus();await button.press('Space');await expect(button).toBeFocused();await expect(button).toHaveAttribute('aria-pressed','true');
   const category=await button.getAttribute('data-filter');const expected=projects.filter(p=>category==='all'||p.categoryId===category);
   await expect(page.locator('.proj:visible')).toHaveCount(expected.length);await expect(page.locator('#project-count')).toHaveText(expected.length+(expected.length===1?' project shown':' projects shown'));
   expect(await button.evaluate(b=>getComputedStyle(b).outlineStyle)).not.toBe('none');
   expect(await button.evaluate(b=>getComputedStyle(b).textDecorationLine)).toContain('underline');
   for(const p of expected)await expect(page.locator('#'+p.id)).toBeVisible();
  }
 }
});

test('homepage enquiry replacement preserves card order, other featured links and the portfolio PDF entry',async({page})=>{
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount);const featured=projects.filter(p=>p.featured);expect(featured.map(p=>p.id)).toEqual(['schoolos','pdf-toolkit','expense-tracker']);
  await expect(page.locator('.home-work h3')).toHaveText(['Rumiware SchoolOS','Rumi Enquiry Assistant','Rumiware Expense Tracker']);
  for(const p of featured.filter(p=>p.id!=='pdf-toolkit'))await expect(page.locator('.home-work a[href="portfolio.html#'+p.id+'"]').locator('..')).toContainText(p.summary);
  const enquiry=page.locator('.home-work article').nth(1);
  await expect(enquiry.locator('.project-category')).toHaveText('Business Applications / Customer Enquiries');
  await expect(enquiry).toContainText('A customer enquiry application with enquiry submission, an admin dashboard, and AI-assisted reply drafting.');
  await expect(enquiry.locator('a.more')).toHaveAttribute('href','https://rumi-portfolio-demo.vercel.app/');
  await expect(enquiry.locator('a.more')).toHaveAttribute('rel','noopener noreferrer');
  await expect(enquiry.locator('a.more')).toHaveAttribute('target','_blank');
  await expect(enquiry.locator('figcaption')).toContainText('fictional enquiries; no replies are sent automatically');
  await expect(enquiry.locator('img')).toHaveAttribute('alt',/public Explore screen.*fictional/);
  await expect(page.locator('.home-work')).not.toContainText('PDF Toolkit');
  await page.goto(mount+'portfolio.html#pdf-toolkit');await expect(page.locator('#pdf-toolkit')).toBeVisible();
  await expect(page.locator('#pdf-toolkit a.more')).toHaveAttribute('href','https://rumiware-pdf-toolkit.streamlit.app/');
  await page.locator('[data-filter=games]').click();await expect(page.locator('#schoolos')).toBeHidden();
  await page.evaluate(()=>location.hash='schoolos');await expect(page.locator('#schoolos')).toBeVisible();await expect(page.locator('[data-filter=all]')).toHaveAttribute('aria-pressed','true');
 }
});

for(const mode of ['disabled','failed'])test('portfolio remains readable with JavaScript '+mode,async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:mode!=='disabled'});if(mode==='failed')await context.route('**/script.js',r=>r.abort());
 const page=await context.newPage();await page.goto('http://127.0.0.1:4173/rumiware.com/portfolio.html#expense-tracker');
 await expect(page.locator('.proj:visible')).toHaveCount(9);await expect(page.locator('.filters')).toBeHidden();await expect(page.locator('#expense-tracker a.more')).toHaveAttribute('href','https://rumiware-expense-tracker.streamlit.app/');await context.close();
});

test('project collection reflows with enlarged text at all requested widths',async({page})=>{
 for(const width of [320,375,768,960,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/portfolio.html');await page.addStyleTag({content:'html{font-size:200%}'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),String(width)).toBe(true);
  for(const b of await page.locator('.filters button').all())expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
 }
});

test('six authentic responsive previews load at both mounts and open larger images by keyboard',async({page,context})=>{
 test.setTimeout(90000);
 const previews=projects.filter(p=>p.url.includes('.streamlit.app/'));expect(previews).toHaveLength(6);
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount+'portfolio.html');
  for(const p of previews){
   const card=page.locator('#'+p.id),img=card.locator('img');
   await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());
   // Width-descriptor srcsets can round density-adjusted natural dimensions to integers.
   expect(await img.evaluate(i=>Math.abs(i.naturalWidth/i.naturalHeight-1.6))).toBeLessThan(.02);
   const box=await img.boundingBox();expect(Math.abs(box.width/box.height-1.6)).toBeLessThan(.02);
   await expect(img).toHaveAttribute('srcset',new RegExp(p.id+'-640\\.webp 640w'));
   await expect(card.locator('figcaption')).not.toContainText('Branded project cover');
   const link=card.locator('.preview-link');await link.focus();await expect(link).toBeFocused();
   expect(await link.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
   await expect(link).toHaveAccessibleName('View larger screenshot of '+p.name+' (opens in a new tab)');
   const opened=context.waitForEvent('page');await link.press('Enter');const popup=await opened;await popup.waitForLoadState();
   expect(new URL(popup.url()).pathname).toBe(mount+'images/projects/'+p.id+'.webp');
   await expect.poll(()=>popup.locator('img').evaluate(i=>i.complete&&i.naturalWidth===1280)).toBe(true);await popup.close();
  }
 }
});

test('mobile and desktop homepage select small screenshots for the shared featured records',async({browser})=>{
 for(const width of [375,1440]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  for(const id of ['enquiry-assistant','expense-tracker']){
   const img=page.locator('.home-work img[src="images/projects/'+id+'.webp"]');await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());
   expect(await img.evaluate(i=>new URL(i.currentSrc).pathname)).toBe('/images/projects/'+id+'-640.webp');
   await expect(img).toHaveAttribute('loading','lazy');
  }
  await context.close();
 }
});
