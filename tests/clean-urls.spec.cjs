const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const {routes,outputFile,cleanLink,apacheRules}=require('../scripts/routes.cjs');
const pages=require('../src/data/pages.json');
const site=require('../src/data/site.json');
const root=path.resolve(__dirname,'..');

test('central route inventory drives output, canonical metadata, structured data and sitemap',()=>{
 const canonical=Object.entries(routes).filter(([file])=>file!=='404.html');
 expect(canonical).toHaveLength(20);
 for(const [file,route] of canonical){
  const html=fs.readFileSync(path.join(root,'dist',outputFile(file)),'utf8');
  expect(html).toContain(`<link rel="canonical" href="${site.url+route}">`);
  expect(html).toContain(`<meta property="og:url" content="${site.url+route}">`);
  expect(html).toMatch(/src="(?:..\/)*script\.js\?v=[a-f0-9]{12}"/);
  expect(html).toMatch(/href="(?:..\/)*style\.css\?v=[a-f0-9]{12}"/);
  expect(html).toContain(`<title>${pages[file].title.replaceAll('&','&amp;')}</title>`);
  for(const match of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g))expect(match[1]).not.toMatch(/https:\/\/rumiware\.com\/[^"\s]*\.html/);
  if(!file.includes('/')&&file!=='index.html')expect(fs.existsSync(path.join(root,'dist',file))).toBe(false);
 }
 const sitemap=fs.readFileSync(path.join(root,'dist/sitemap.xml'),'utf8');
 expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]).sort()).toEqual(canonical.map(([,route])=>site.url+route).sort());
 expect(sitemap).not.toContain('.html');
 expect(fs.readFileSync(path.join(root,'dist/.htaccess'),'utf8')).toBe(apacheRules());
 expect(cleanLink('get-quote.html?plan=business#review')).toBe('get-quote/?plan=business#review');
 expect(cleanLink('images/projects/example.png')).toBe('images/projects/example.png');
 expect(cleanLink('https://example.com/about.html')).toBe('https://example.com/about.html');
});

test('every canonical route refreshes at both mounts and shared navigation reaches clean URLs',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const mount of ['/','/rumiware.com/']){
  for(const [file,route] of Object.entries(routes).filter(([file])=>file!=='404.html')){
   const url=mount+route.slice(1);
   expect((await page.goto(url)).status(),url).toBe(200);
   expect(new URL(page.url()).pathname).toBe(url);
   expect((await page.reload()).status(),url).toBe(200);
   await expect(page.locator('h1'),file).toBeVisible();
   expect(await page.locator('link[rel=stylesheet]').first().evaluate(el=>new URL(el.href).pathname)).toBe(mount+'style.css');
  }
  await page.setViewportSize({width:1440,height:900});
  for(const item of site.navigation.filter(n=>n.main)){
   await page.locator('#nav').getByRole('link',{name:item.label,exact:true}).click();
   expect(new URL(page.url()).pathname).toBe(mount+routes[item.file].slice(1));
  }
 }
 expect(errors).toEqual([]);
});

test('local redirect model preserves queries and fragments, is single-hop and leaves unknown pages at 404',async({request,page})=>{
 for(const mount of ['/','/rumiware.com/'])for(const [file,route] of Object.entries(routes).filter(([file])=>file!=='404.html')){
  const query='?plan=business&utm_source=legacy%20link&x=%26%3D';
  for(const old of new Set([file,route.slice(1)+'index.html'])){
   const response=await request.get(mount+old+query,{maxRedirects:0});
   expect(response.status(),old).toBe(301);
   expect(response.headers().location).toBe(mount+route.slice(1)+query);
   const target=await request.get(response.headers().location,{maxRedirects:0});
   expect(target.status()).toBe(200);
  }
 }
 for(const url of ['/nonexistent.html','/no-such-page/','/about/nonexistent.html','/rumiware.com/nonexistent.html'])expect((await request.get(url,{maxRedirects:0})).status(),url).toBe(404);
 await page.goto('/portfolio.html?source=old#pdf-toolkit');
 await expect(page).toHaveURL(/\/portfolio\/\?source=old#pdf-toolkit$/);
 await expect(page.locator('#pdf-toolkit')).toBeInViewport();
 await page.goto('/get-quote.html?plan=business');
 await expect(page.locator('#selected-package')).toContainText('Business');
});

test('Apache rule fixture is constrained and THE_REQUEST prevents DirectoryIndex loops (not a server test)',()=>{
 const block=fs.readFileSync(path.join(root,'config/clean-url-redirects.conf'),'utf8').replace(/\r\n/g,'\n');
 expect(block).toBe(apacheRules());
 const rules=[...block.matchAll(/RewriteCond %\{THE_REQUEST\} "([^"]+)" \[NC\]\nRewriteRule (\S+) (\S+) \[R=301,L,NE\]/g)].map(m=>({condition:new RegExp(m[1],'i'),pattern:new RegExp(m[2]),target:m[3]}));
 expect(rules.length).toBeGreaterThan(30);
 function match(uri,original=uri){return rules.filter(r=>r.pattern.test(uri.slice(1))&&r.condition.test('GET '+original+' HTTP/1.1'));}
 for(const [file,route] of Object.entries(routes).filter(([file])=>file!=='404.html')){
  expect(match('/'+file).map(r=>r.target)).toEqual([route]);
  expect(match(route+'index.html',route)).toEqual([]);
 }
 expect(match('/nonexistent.html')).toEqual([]);
 expect(match('/404.html')).toEqual([]);
});
