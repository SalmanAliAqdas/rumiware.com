const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const url='https://rumiware.com/blog/future-of-ai/';
const route='blog/future-of-ai/';
const headline='The Future of AI: What It Means for Businesses, Jobs, and Everyday Life';
const title='The Future of AI: Business, Jobs & Skills | RumiWare';
const description='Explore the future of AI, its impact on business and jobs, and the practical skills small businesses and professionals need to prepare.';
const refs=[
 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure',
 'https://www.nist.gov/itl/ai-risk-management-framework',
 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf'
];

test('new article uses the clean URL, exact SEO metadata, real author and consistent publication date',async({page,request})=>{
 expect(fs.existsSync(path.join(__dirname,'../dist/blog/future-of-ai/index.html'))).toBe(true);
 expect(fs.existsSync(path.join(__dirname,'../dist/future-of-ai.html'))).toBe(false);
 for(const mount of ['/','/rumiware.com/']){
  const response=await page.goto(mount+route);expect(response.status()).toBe(200);
  expect((await page.reload()).status()).toBe(200);
  await expect(page).toHaveTitle(title);await expect(page.locator('h1')).toHaveText(headline);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',url);
  for(const [property,value] of Object.entries({'og:type':'article','og:title':title,'og:description':description,'og:url':url,'og:image':'https://rumiware.com/images/social-preview.png','article:published_time':'2026-10-30','article:modified_time':'2026-10-30'}))await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute('content',value);
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',description);
  await expect(page.locator('meta[name=author]')).toHaveAttribute('content','Salman Ali Aqdas');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content','summary_large_image');
  await expect(page.locator('meta[name=keywords]')).toHaveCount(0);
  const article=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).find(s=>s['@type']==='BlogPosting');
  expect(article).toMatchObject({headline,description,url,mainEntityOfPage:url,datePublished:'2026-10-30',dateModified:'2026-10-30',articleSection:'Artificial Intelligence',author:{'@type':'Person',name:'Salman Ali Aqdas',jobTitle:'Founder & CEO, RumiWare'},publisher:{'@type':'Organization',name:'RumiWare'},image:'https://rumiware.com/images/social-preview.png'});
  await expect(page.locator('time')).toHaveAttribute('datetime',article.datePublished);await expect(page.locator('time')).toHaveText('30 October 2026');
  await expect(page.locator('.page-hero .meta')).toContainText('Salman Ali Aqdas');await expect(page.locator('.page-hero .meta')).toContainText('Founder & CEO, RumiWare');
  expect(await page.locator('article a').evaluateAll(links=>links.map(a=>a.href))).toEqual(['https://rumiware.com/contact/',...refs]);
  await expect(page.locator('article')).not.toContainText('IMPLEMENTATION INSTRUCTIONS');await expect(page.locator('article')).not.toContainText('SEO METADATA');
  const headings=await page.locator('main h1,main h2,main h3').evaluateAll(nodes=>nodes.map(n=>Number(n.tagName.slice(1))));
  expect(headings.filter(n=>n===1)).toHaveLength(1);for(let i=1;i<headings.length;i++)expect(headings[i]-headings[i-1]).toBeLessThanOrEqual(1);
  expect((await request.get(mount+'future-of-ai.html')).status()).toBe(404);
  const directory=await request.get(mount+'blog/future-of-ai',{maxRedirects:0});expect(directory.status()).toBe(301);expect(directory.headers().location).toBe(mount+route);
 }
 const sitemap=await (await request.get('/sitemap.xml')).text();expect(sitemap.match(new RegExp(url,'g'))).toHaveLength(1);expect(sitemap).not.toContain('future-of-ai.html');expect(sitemap).not.toContain('/blog/future-of-ai/index.html');
});

for(const theme of ['dark','light'])test(`article and Blog listing work at both mounts on desktop/mobile in ${theme} theme`,async({page})=>{
 await page.addInitScript(theme=>localStorage.setItem('rw-theme',theme),theme);
 await page.route('https://**/*',r=>r.abort());const errors=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1')&&r.status()>=400)failures.push(r.url())});
 for(const mount of ['/','/rumiware.com/'])for(const width of [375,1440]){
  await page.setViewportSize({width,height:900});await page.goto(mount+'blog/');
  await expect(page.locator('main article')).toHaveCount(2);await expect(page.locator('a.more[href$="blog/fast-mobile-website/"]')).toHaveCount(1);
  await page.locator(`a.more[href$="${route}"]`).click();await expect(page).toHaveURL(new RegExp(mount+route+'$'));
  await page.locator('html.menu-ready.theme-ready').waitFor();await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await expect(page.locator('h1')).toHaveText(headline);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await page.evaluate(()=>document.fonts.check('800 24px "Bricolage Grotesque"')&&document.fonts.check('400 16px "DM Sans"'))).toBe(true);
  await expect(page.locator('body')).toHaveCSS('background-color',theme==='dark'?'rgb(11, 30, 45)':'rgb(251, 247, 236)');
  const menu=page.locator('#menuBtn');if(width<1100){await expect(page.locator('#nav')).toBeHidden();await menu.click();}
  await expect(page.locator('#nav [aria-current=page]')).toHaveText('Blog');
  expect(await page.locator('#nav [aria-current=page]').evaluate(a=>getComputedStyle(a).textDecorationLine)).toContain('underline');
  await page.locator('#nav a').filter({hasText:/^Home$/}).click();await expect(page).toHaveURL(new RegExp(mount+'$'));
  await page.goto(mount+route);await page.locator('.crumbs a[href$="../../blog/"]').click();await expect(page).toHaveURL(new RegExp(mount+'blog/$'));
  await page.locator(`a.more[href$="${route}"]`).click();await page.getByRole('navigation',{name:'Article navigation'}).getByRole('link',{name:'Back to Blog'}).click();await expect(page).toHaveURL(new RegExp(mount+'blog/$'));
 }
 expect(errors).toEqual([]);expect(failures).toEqual([]);
});

test('article and nested navigation remain available without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});await context.route('https://**/*',r=>r.abort());
 const page=await context.newPage();try{
  for(const mount of ['/','/rumiware.com/']){
   expect((await page.goto('http://127.0.0.1:4173'+mount+route)).status()).toBe(200);
   await expect(page.locator('h1')).toHaveText(headline);await expect(page.locator('#nav a[href$="../../blog/"]')).toBeVisible();
   await page.locator('#nav a[href$="../../blog/"]').click();await expect(page.locator(`a.more[href$="${route}"]`)).toBeVisible();
  }
 }finally{await context.close()}
});
