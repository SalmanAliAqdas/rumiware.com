const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const route='blog/binance-hack-2026-security-lessons/';
const url='https://rumiware.com/'+route;
const meta=require('../src/data/pages.json')[route+'index.html'];
const stem='images/blog/binance-hack-2026-security';
const output=path.resolve(__dirname,'../test-results/binance-publication');
test.beforeEach(async({context})=>{
 await context.route('https://**/*',r=>r.abort());
});

test('Binance article has complete SEO, dated attribution, original social artwork and stable hosting rules',async({page,request})=>{
 for(const mount of ['/','/rumiware.com/']){
  expect((await page.goto(mount+route)).status()).toBe(200);
  await expect(page).toHaveTitle('Binance’s $6.3B Hack: AI-Era Security Lessons | RumiWare');
  await expect(page.locator('h1')).toHaveText('Binance’s $6.3 Billion Hack: What We Know and Security Lessons for the AI Era');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',url);
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',meta.description);
  for(const [key,value] of Object.entries({'og:type':'article','og:url':url,'og:title':meta.title,'og:description':meta.description,'og:image':'https://rumiware.com/'+stem+'-social.png','og:image:alt':meta.socialImageAlt})){
   await expect(page.locator(`meta[property="${key}"]`)).toHaveAttribute('content',value);
  }
  for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':meta.title,'twitter:description':meta.description,'twitter:image':'https://rumiware.com/'+stem+'-social.png','twitter:image:alt':meta.socialImageAlt})){
   await expect(page.locator(`meta[name="${key}"]`)).toHaveAttribute('content',value);
  }
  const schema=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).find(s=>s['@type']==='BlogPosting');
  expect(schema).toMatchObject({headline:meta.article.headline,url,mainEntityOfPage:url,datePublished:'2026-11-02',dateModified:'2026-11-02',articleSection:'Cybersecurity',image:'https://rumiware.com/'+stem+'-social.png',author:{name:'Salman Ali Aqdas',jobTitle:'Founder & CEO, RumiWare'},publisher:{name:'RumiWare'}});
  await expect(page.locator('.page-hero .meta')).toContainText('Facts checked: 2 November 2026');
  await expect(page.locator('.page-hero .meta')).toContainText('Founder & CEO, RumiWare');
  await expect(page.locator('.page-hero time').first()).toHaveAttribute('datetime','2026-11-02');
  await expect(page.locator('article')).toContainText('The initial device compromise is a preliminary finding');
  await expect(page.locator('article')).toContainText('do not establish that AI was used');
  await expect(page.locator('article')).toContainText('not the same as recovering that percentage');
  await expect(page.locator('article')).toContainText('That schedule does not confirm');
  const headings=await page.locator('main h1,main h2,main h3').evaluateAll(nodes=>nodes.map(n=>+n.tagName.slice(1)));
  for(let i=1;i<headings.length;i++)expect(headings[i]-headings[i-1]).toBeLessThanOrEqual(1);
  const links=await page.locator('article a[href^="https://"]').evaluateAll(nodes=>nodes.map(a=>a.href));
  expect(new Set(links).size).toBe(6);
  expect(links).toContain('https://www.fbi.gov/investigate/cyber/alerts/2026/north-korea-responsible-for-6-billion-binance-attack');
  expect(links).toContain('https://www.ic3.gov/PSA/2024/PSA241203');
  for(const anchor of await page.getByRole('navigation',{name:'In this article'}).locator('a').all()){
   const target=(await anchor.getAttribute('href')).slice(1);
   await anchor.click();await expect(page.locator('#'+target)).toBeInViewport();
  }
  await page.getByRole('navigation',{name:'Article navigation'}).getByRole('link',{name:'Back to Blog'}).click();
  await expect(page.locator(`a.more[href$="${route}"]`)).toHaveCount(1);
 }
 const social=await request.get('/'+stem+'-social.png');expect(social.status()).toBe(200);
 const png=await social.body();expect(png.readUInt32BE(16)).toBe(1200);expect(png.readUInt32BE(20)).toBe(630);
 for(const suffix of ['-cover.svg','-cover.webp','-cover-640.webp'])expect((await request.get('/'+stem+suffix)).status()).toBe(200);
 const sitemap=await (await request.get('/sitemap.xml')).text();expect(sitemap.split(url).length-1).toBe(1);
 const rules=fs.readFileSync(path.resolve(__dirname,'../dist/.htaccess'));
 expect(crypto.createHash('sha256').update(rules).digest('hex')).toBe('3f341c8cc89e139026ed9e01db0126f79da6359cbb509085c093eae88fab5347');
});

for(const theme of ['dark','light'])for(const width of [375,1440])test(`Binance article and Blog cover at ${width}px in ${theme} theme`,async({page})=>{
 fs.mkdirSync(output,{recursive:true});
 await page.addInitScript(theme=>localStorage.setItem('rw-theme',theme),theme);
 await page.setViewportSize({width,height:1000});
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1')&&r.status()>=400)failed.push(r.url())});
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount+'blog/');
  const decline=page.getByRole('button',{name:'Decline analytics',exact:true});
  if(await decline.isVisible())await decline.click();
  const card=page.locator('main article').filter({has:page.locator(`a.more[href$="${route}"]`)});
  await expect(card).toHaveCount(1);await card.scrollIntoViewIfNeeded();
  const thumbnail=card.locator('img');await expect.poll(()=>thumbnail.evaluate(i=>i.complete&&i.naturalWidth===640)).toBe(true);
  const box=await thumbnail.boundingBox();expect(box.height/box.width).toBeCloseTo(630/1200,2);
  if(mount==='/')await card.screenshot({path:path.join(output,`card-${width}-${theme}.png`)});
  await card.locator('a.more').click();await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  // With width descriptors, naturalWidth is density-corrected to the display width.
  const cover=page.locator('.article-cover img');await expect.poll(()=>cover.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  expect(await cover.getAttribute('loading')).toBeNull();await expect(cover).toHaveAttribute('fetchpriority','high');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const coverBox=await cover.boundingBox();expect(coverBox.height/coverBox.width).toBeCloseTo(630/1200,2);
  await expect(page.locator('.article-cover figcaption')).toHaveText('Conceptual illustration; not an image of the actual incident.');
  await page.evaluate(()=>document.fonts.ready);
  if(mount==='/'){
   await page.screenshot({path:path.join(output,`article-${width}-${theme}.png`)});
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
   expect(audit.violations).toEqual([]);
  }
 }
 expect(errors).toEqual([]);expect(failed).toEqual([]);
});

test('Binance article, cover and contents navigation work without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});
 await context.route('https://**/*',r=>r.abort());
 try{
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173/'+route);
  await expect(page.locator('h1')).toBeVisible();
  await expect.poll(()=>page.locator('.article-cover img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  await page.getByRole('navigation',{name:'In this article'}).getByRole('link',{name:'Seven Security Improvements for Businesses'}).click();
  await expect(page.locator('#seven-security-improvements-for-businesses')).toBeInViewport();
 }finally{await context.close()}
});
