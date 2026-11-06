const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');
const path=require('node:path');
const route='blog/hormuz-internet-cables-gulf-impact/';
const canonical='https://rumiware.com/'+route;
const meta=require('../src/data/pages.json')[route+'index.html'];

for(const theme of ['dark','light'])for(const width of [375,1440])test(`Hormuz article and Blog at ${width}px in ${theme}`,async({page,request})=>{
 await page.route('https://**/*',r=>r.abort());
 await page.addInitScript(theme=>localStorage.setItem('rw-theme',theme),theme);
 await page.setViewportSize({width,height:1000});
 const output=path.resolve(__dirname,'../test-results/hormuz-publication');fs.mkdirSync(output,{recursive:true});
 for(const mount of ['/','/rumiware.com/']){
  expect((await page.goto(mount+'blog/')).status()).toBe(200);
  const decline=page.getByRole('button',{name:'Decline analytics',exact:true});if(await decline.isVisible())await decline.click();
  await expect(page.locator('main article')).toHaveCount(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(mount==='/'){
   await page.screenshot({path:path.join(output,`blog-${width}-${theme}.png`),fullPage:true});
   await page.screenshot({path:path.join(output,`blog-viewport-${width}-${theme}.png`)});
  }
  await page.locator(`a.more[href$="${route}"]`).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await expect(page).toHaveTitle(meta.title);await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(meta.article.headline);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',canonical);
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',meta.description);
  await expect(page.locator('meta[name=keywords]')).toHaveCount(0);
  for(const [key,value] of Object.entries({'og:type':'article','og:title':meta.socialTitle,'og:description':meta.socialDescription,'og:image':'https://rumiware.com/images/social-preview.png','og:url':canonical}))await expect(page.locator(`meta[property="${key}"]`)).toHaveAttribute('content',value);
  for(const [key,value] of Object.entries({'twitter:title':meta.socialTitle,'twitter:description':meta.socialDescription,'twitter:image':'https://rumiware.com/images/social-preview.png'}))await expect(page.locator(`meta[name="${key}"]`)).toHaveAttribute('content',value);
  const schema=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).find(s=>s['@type']==='BlogPosting');
  expect(schema).toMatchObject({headline:meta.article.headline,url:canonical,datePublished:'2026-11-06',dateModified:'2026-11-06',image:'https://rumiware.com/images/social-preview.png',articleSection:meta.article.category,author:{name:'Salman Ali Aqdas',jobTitle:'Founder & CEO, RumiWare'}});
  await expect(page.locator('.page-hero')).toContainText('Hypothetical analysis');
  await expect(page.locator('article')).toContainText('It does not claim that such an attack has occurred');
  await expect(page.locator('article a[href$="ai-solutions/"]')).toHaveCount(1);
  const headings=await page.locator('main h1,main h2,main h3').evaluateAll(ns=>ns.map(n=>+n.tagName.slice(1)));
  for(let i=1;i<headings.length;i++)expect(headings[i]-headings[i-1]).toBeLessThanOrEqual(1);
  const sources=page.locator('article ol li[id^="source-"] a');await expect(sources).toHaveCount(4);
  for(const link of await page.locator('article a[href^="#source-"]').all()){
   const id=(await link.getAttribute('href')).slice(1);await expect(page.locator('#'+id)).toHaveCount(1);
  }
  await expect(page.locator('[data-article-sharing]')).toHaveCount(1);
  const sharing=page.locator('[data-article-sharing]');
  for(const network of ['Facebook','LinkedIn','WhatsApp']){
   const link=new URL(await sharing.getByRole('link',{name:new RegExp('Share on '+network)}).getAttribute('href'));
   expect([...link.searchParams.values()].join(' ')).toContain(canonical);
  }
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await sharing.getByRole('button',{name:'Copy Link',exact:true}).click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(canonical);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(mount==='/'){
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(output,`article-${width}-${theme}.png`),fullPage:true});
   await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,`article-viewport-${width}-${theme}.png`)});
   expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  }
 }
 expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>'+canonical+'</loc>');
});

test('Hormuz article remains readable and shareable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/'+route);await expect(page.locator('h1')).toHaveText(meta.article.headline);
 await expect(page.locator('#source-4 a')).toBeVisible();await expect(page.locator('#article-share-url')).toHaveValue(canonical);
 await context.close();
});
