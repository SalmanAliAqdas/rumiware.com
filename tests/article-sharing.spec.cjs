const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const pages=require('../src/data/pages.json');
const {routes,outputFile}=require('../scripts/routes.cjs');
const shareValues=require('../scripts/article-sharing.cjs');
const root=path.resolve(__dirname,'..');
const articles=Object.entries(pages).filter(([,p])=>p.type==='article');
const section=page=>page.locator('[data-article-sharing]');

test.beforeEach(async({context})=>{
 // No external platform, analytics or form requests during sharing tests.
 await context.route('https://**/*',r=>r.abort());
});

async function destinations(page,canonical,title){
 const share=section(page);await expect(share).toHaveCount(1);
 await expect(share.getByRole('heading',{name:'Share this article'})).toBeVisible();
 const expected=[['Facebook','https://www.facebook.com/sharer/sharer.php','u',canonical],['LinkedIn','https://www.linkedin.com/sharing/share-offsite/','url',canonical],['WhatsApp','https://wa.me/','text',title+'\n'+canonical]];
 for(const [platform,endpoint,key,value] of expected){
  const link=share.getByRole('link',{name:'Share on '+platform,exact:false});
  const url=new URL(await link.getAttribute('href'));
  expect(url.origin+url.pathname).toBe(endpoint);expect([...url.searchParams]).toEqual([[key,value]]);
  await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');
 }
 await expect(share.locator('input')).toHaveValue(canonical);
}

for(const [file,article] of articles)test(`canonical sharing and clipboard success: ${routes[file]}`,async({page})=>{
 const canonical='https://rumiware.com'+routes[file];
 const requested=[];page.on('request',r=>{if(/facebook|linkedin|wa\.me/.test(r.url()))requested.push(r.url())});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedArticle=value}}}));
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount+routes[file].slice(1)+'?utm_source=visitor&q=two%20words%26more#untrusted');
  await destinations(page,canonical,article.article.headline);
  await section(page).getByRole('button',{name:'Copy Link'}).click();
  await expect(section(page).getByRole('status')).toHaveText('Link copied.');
  expect(await page.evaluate(()=>window.copiedArticle)).toBe(canonical);
  await expect(section(page).locator('[data-share-manual]')).toBeHidden();
  // Shared UI follows the complete article, never replaces its content.
  expect(await page.evaluate(()=>Boolean(document.querySelector('article').compareDocumentPosition(document.querySelector('[data-article-sharing]'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 }
 expect(requested).toEqual([]);
});

for(const mode of ['denied','missing','retry-after-success'])test(`clipboard ${mode} gives a selected, usable manual link without false success`,async({page})=>{
 await page.addInitScript(mode=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='missing'?undefined:{writeText:async()=>{
  if(mode==='retry-after-success'&&!window.firstCopy){window.firstCopy=true;return}
  throw Error('Clipboard denied');
 }}}),mode);
 await page.goto(routes[articles[0][0]]);
 const share=section(page),button=share.getByRole('button',{name:'Copy Link'});
 if(mode==='retry-after-success'){await button.click();await expect(share.getByRole('status')).toHaveText('Link copied.');}
 await button.focus();await page.keyboard.press('Space');
 await expect(share.getByRole('status')).toHaveText('Clipboard unavailable. Select and copy the article link below.');
 const field=share.getByLabel('Article link — select and copy manually');
 await expect(field).toBeVisible();await expect(field).toBeFocused();await expect(field).toHaveAttribute('readonly','');
 expect(await field.evaluate(e=>e.selectionStart===0&&e.selectionEnd===e.value.length)).toBe(true);
 await expect(button).toBeEnabled();
});

test('pending clipboard does not announce success; keyboard links have visible focus',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>new Promise(resolve=>{window.finishCopy=resolve})}}));
 await page.goto(routes[articles[0][0]]);
 const share=section(page),links=share.getByRole('link');await links.first().focus();
 for(let i=0;i<3;i++){
  await expect(links.nth(i)).toBeFocused();
  expect(await links.nth(i).evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Tab');
 }
 await expect(share.getByRole('button',{name:'Copy Link'})).toBeFocused();await page.keyboard.press('Enter');
 await expect(share.getByRole('status')).toBeEmpty();await expect(share.getByRole('button')).toBeDisabled();
 await page.evaluate(()=>window.finishCopy());await expect(share.getByRole('status')).toHaveText('Link copied.');
});

test('native browser clipboard contains the canonical article link',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 for(const [file] of articles){
  await page.goto(routes[file]+'?visitor=value#fragment');
  await section(page).getByRole('button',{name:'Copy Link'}).click();
  await expect(section(page).getByRole('status')).toHaveText('Link copied.');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('https://rumiware.com'+routes[file]);
 }
});

test('no JavaScript: all article links and a manual copy field work; ordinary pages have no sharing',async({browser,request})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 await context.route('https://**/*',r=>r.abort());const page=await context.newPage();
 for(const [file,article] of articles){
  await page.goto('http://127.0.0.1:4173'+routes[file]);
  await destinations(page,'https://rumiware.com'+routes[file],article.article.headline);
  await expect(section(page).locator('input')).toBeVisible();await expect(section(page).getByRole('button')).toBeHidden();
 }
 await context.close();
 for(const [file,metadata] of Object.entries(pages))if(metadata.type!=='article'){
  const html=await (await request.get('/'+outputFile(file))).text();expect(html,file).not.toContain('data-article-sharing');
 }
});

for(const theme of ['dark','light'])test(`all articles: desktop/mobile layout and accessibility in ${theme}`,async({page},testInfo)=>{
 await page.addInitScript(theme=>localStorage.setItem('rw-theme',theme),theme);
 for(const [file] of articles)for(const width of [320,375,1440]){
  await page.setViewportSize({width,height:900});await page.goto(routes[file]);
  const decline=page.getByRole('button',{name:'Decline analytics',exact:true});if(await decline.isVisible())await decline.click();
  const share=section(page);await share.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const control of await share.locator('a,button').all()){
   await expect(control).toBeVisible();const box=await control.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  expect((await new AxeBuilder({page}).include('[data-article-sharing]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  await share.screenshot({path:testInfo.outputPath(file.split('/')[1]+'-'+theme+'-'+width+'.png')});
 }
});

test('a future article receives sharing from the actual build, with Unicode and ampersands encoded once',async({page},testInfo)=>{
 // Isolated fixture: no modifications to production metadata, routes or output.
 const fixture=testInfo.outputPath('future-article');fs.mkdirSync(fixture,{recursive:true});
 for(const dir of ['src','scripts','config','images'])fs.cpSync(path.join(root,dir),path.join(fixture,dir),{recursive:true});
 const file='blog/sharing-fixture/index.html',route='/blog/sharing-fixture/';
 const title='مستقبل AI & کاروبار: العربية، Urdu — “learning”? #100%';
 const fixturePages=structuredClone(pages);fixturePages[file]={...structuredClone(articles[0][1]),legacyRedirect:false,article:{...articles[0][1].article,headline:title}};
 fs.writeFileSync(path.join(fixture,'src/data/pages.json'),JSON.stringify(fixturePages));
 fs.writeFileSync(path.join(fixture,'src/data/routes.json'),JSON.stringify({...routes,[file]:route}));
 fs.mkdirSync(path.join(fixture,'src/pages/blog/sharing-fixture'),{recursive:true});
 fs.writeFileSync(path.join(fixture,'src/pages',file),'<article><h1>{{ARTICLE_HEADING}}</h1><p>Future article fixture.</p></article>');
 execFileSync(process.execPath,[path.join(fixture,'scripts/build.cjs')],{cwd:fixture,stdio:'pipe'});
 const html=fs.readFileSync(path.join(fixture,'dist/blog/sharing-fixture/index.html'),'utf8');
 await page.route('http://127.0.0.1:4173/blog/sharing-fixture/',r=>r.fulfill({contentType:'text/html',body:html}));
 await page.goto(route);await destinations(page,'https://rumiware.com'+route,title);
 await expect(page.locator('h1')).toHaveText(title);
 expect(fs.existsSync(path.join(root,'dist/blog/sharing-fixture'))).toBe(false);
 expect(fs.readFileSync(path.join(root,'dist/sitemap.xml'),'utf8')).not.toContain(route);
 for(const bad of ['http://rumiware.com/blog/example/','https://preview.invalid/blog/example/','https://rumiware.com/blog/example/?q=bad','https://rumiware.com/blog/example/#bad'])expect(()=>shareValues(bad,title)).toThrow();
});
