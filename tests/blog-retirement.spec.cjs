const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {retiredFor,apacheRules}=require('../scripts/routes.cjs');
const retirement=require('../config/mobile-article-retirement.json');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/blog-update');
const canonical='https://rumiware.com/blog/future-of-ai/';
const social='https://rumiware.com/images/blog/future-of-ai-social.png';

test('removed article has no source, metadata, build output, sitemap entry or live internal recommendation',async({request})=>{
 expect(fs.existsSync(path.join(root,'src/pages/blog-post.html'))).toBe(false);
 expect(require('../src/data/pages.json')['blog-post.html']).toBeUndefined();
 expect(require('../src/data/routes.json')['blog-post.html']).toBeUndefined();
 for(const p of ['blog-post.html','blog/fast-mobile-website/index.html'])expect(fs.existsSync(path.join(root,'dist',p))).toBe(false);
 for(const file of fs.readdirSync(path.join(root,'dist'),{recursive:true}).filter(p=>p.endsWith('.html')||p==='sitemap.xml')){
  const source=fs.readFileSync(path.join(root,'dist',file),'utf8');
  expect(source,file).not.toContain('blog/fast-mobile-website');expect(source,file).not.toContain('blog-post.html');
 }
 // Check real status, including legacy query strings; never redirect to the AI article.
 for(const mount of ['','/rumiware.com'])for(const p of retirement.paths){
  for(const suffix of ['','?q=two%20words%26more']){
   const response=await request.get(mount+p+suffix,{maxRedirects:0});expect(response.status(),p).toBe(410);expect(response.headers().location).toBeUndefined();
  }
 }
 const match=apacheRules().match(/RewriteRule \^(\(\?:.*?\))\$ - \[G,L,NC\]/);expect(match).not.toBeNull();
 const gone=new RegExp('^'+match[1]+'$','i');
 for(const p of retirement.paths){expect(retiredFor(p)).toBe(true);expect(gone.test(p.slice(1))).toBe(true)}
 for(const p of ['/blog/future-of-ai/','/blog/binance-hack-2026-security-lessons/','/blog/fast-mobile-website-other/','/images/social-preview.png']){
  expect(retiredFor(p)).toBe(false);expect(gone.test(p.slice(1))).toBe(false);
 }
 // All unrelated hosting rules are byte-identical to the inspected pre-retirement rules.
 const previous=fs.readFileSync(path.join(root,'tests/fixtures/pre-article-retirement.htaccess'),'utf8').replace(/\r\n/g,'\n');
 const withoutOld=previous.replace(/# External requests only: internal DirectoryIndex resolution must not redirect\.\nRewriteCond[^\n]*\nRewriteRule \^(?:blog-post\\\.html|blog\/fast-mobile-website\/index\\\.html)\$[^\n]*\n\n/g,'');
 const withoutGone=apacheRules().replace(/# Retired article:[^\n]*\nRewriteRule[^\n]*\n/,'');
 expect(withoutGone).toBe(withoutOld);
});

test('AI article wording and original publication metadata stay intact while social image changes consistently',async({page,request})=>{
 await page.route('https://**/*',r=>r.abort());await page.goto('/blog/future-of-ai/');
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',social);
 await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content',social);
 const schema=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).find(s=>s['@type']==='BlogPosting');
 expect(schema).toMatchObject({url:canonical,datePublished:'2026-10-30',dateModified:'2026-11-02',image:social,author:{name:'Salman Ali Aqdas'}});
 // The article text itself was not edited when inserting the poster before it.
 const body=fs.readFileSync(path.join(root,'src/pages/blog/future-of-ai/index.html'),'utf8').split('<article class="wrap prose"')[1];
 expect(crypto.createHash('sha256').update(body.replace(/\r\n/g,'\n')).digest('hex')).toBe('303fa81d8f9fd99f1837bfb7f4794451ed91fe806fed98a13f6c50dc4f1316da');
 const png=await (await request.get('/images/blog/future-of-ai-social.png')).body();expect(png.readUInt32BE(16)).toBe(1200);expect(png.readUInt32BE(20)).toBe(630);
});

for(const theme of ['dark','light'])for(const width of [375,1440])test(`AI poster and Blog card at ${width}px in ${theme}`,async({page})=>{
 fs.mkdirSync(out,{recursive:true});await page.route('https://**/*',r=>r.abort());
 await page.addInitScript(theme=>localStorage.setItem('rw-theme',theme),theme);await page.setViewportSize({width,height:1000});
 const failures=[];page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1')&&r.status()>=400)failures.push(r.url())});
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount+'blog/');const decline=page.getByRole('button',{name:'Decline analytics',exact:true});if(await decline.isVisible())await decline.click();
  await expect(page.locator('main article')).toHaveCount(3);
  const card=page.locator('main article').filter({has:page.locator('a.more[href$="blog/future-of-ai/"]')});await card.scrollIntoViewIfNeeded();
  const thumb=card.locator('img');await expect.poll(()=>thumb.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  if(mount==='/')await card.screenshot({path:path.join(out,`ai-card-${width}-${theme}.png`)});
  await card.locator('a.more').click();const cover=page.locator('.article-cover img');
  await expect.poll(()=>cover.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);expect(await cover.getAttribute('loading')).toBeNull();await expect(cover).toHaveAttribute('fetchpriority','high');
  await expect(cover).toHaveAttribute('width','1200');await expect(cover).toHaveAttribute('height','630');
  const box=await cover.boundingBox();expect(box.height/box.width).toBeCloseTo(630/1200,2);
  expect(await cover.evaluate(i=>getComputedStyle(i).objectFit)).not.toBe('cover');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const positions=await page.locator('.page-hero,.article-cover,main article').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom}}));expect(positions[1].top).toBeGreaterThanOrEqual(positions[0].bottom);expect(positions[2].top).toBeGreaterThanOrEqual(positions[1].bottom);
  await page.evaluate(()=>document.fonts.ready);
  if(mount==='/'){
   await page.screenshot({path:path.join(out,`ai-article-${width}-${theme}.png`)});
   expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  }
 }
 expect(failures).toEqual([]);
});
