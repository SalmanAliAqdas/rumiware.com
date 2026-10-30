const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const published = path.join(root,'dist');
const pages = fs.readdirSync(published,{recursive:true}).filter(p => p.endsWith('.html')).map(p=>p.replaceAll('\\','/'));
const documents = pages.filter(p => fs.readFileSync(path.join(published, p), 'utf8').startsWith('<!DOCTYPE'));
const shotDir = path.join(root, process.env.RUMIWARE_SCREENSHOTS_DIR || 'verification/screenshots');
fs.mkdirSync(shotDir, {recursive:true});

test.beforeEach(async ({context}) => {
  // Never send messages or subscriptions to live accounts, including by mistake.
  await context.route(/formspree\.io|api\.web3forms\.com/, route => route.abort());
  // Keep browser checks deterministic and prevent third-party embeds/font traffic.
  await context.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|www\.google\.com\/maps/, route => route.fulfill({status:200,body:''}));
});

test('every HTML page serves; internal URLs, anchors, resources and form actions resolve at both mounts', async ({page, request}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let linksChecked = 0, anchorsChecked = 0, resourcesChecked = 0, formsChecked = 0;
  for (const mount of ['/', '/rumiware.com/']) {
    for (const file of pages) {
      const response = await page.goto(mount + file);
      expect(response.status(), file).toBe(200);
      const refs = await page.evaluate(() => ({
        urls: [...document.querySelectorAll('a[href],link[href],script[src],img[src],iframe[src]')].map(el => ({tag:el.tagName, raw:el.getAttribute('href') || el.getAttribute('src'), url:el.href || el.src, rel:el.rel})),
        forms: [...document.forms].map(f => ({action:f.action, method:f.method, html:f.outerHTML})),
        ids: [...document.querySelectorAll('[id]')].map(el => el.id)
      }));
      expect(new Set(refs.ids).size, `duplicate IDs: ${file}`).toBe(refs.ids.length);
      for (const f of refs.forms) {
        expect(f.action).toMatch(/^https:\/\/formspree\.io\/f\/(mvkzkdbv|mkjojozj)$/);
        expect(f.method).toBe('post'); expect(f.html).not.toMatch(/YOUR_|access_key/); formsChecked++;
      }
      for (const ref of refs.urls) {
        const target = new URL(ref.url, page.url());
        if (target.origin !== new URL(page.url()).origin || !['http:', 'https:'].includes(target.protocol)) continue;
        // In the preview, no internal navigation or resource may escape its mount.
        if (mount !== '/') expect(target.pathname, `${file}: ${ref.raw}`).toMatch(/^\/rumiware\.com\//);
        const result = await request.get(target.href.split('#')[0]);
        expect(result.status(), `${file}: ${ref.raw}`).toBe(200);
        if (ref.tag === 'A') linksChecked++; else resourcesChecked++;
        if (target.hash) {
          const content = await result.text();
          expect(content, `${file}: ${ref.raw}`).toMatch(new RegExp(`(?:id|name)=["']${target.hash.slice(1)}["']`)); anchorsChecked++;
        }
      }
    }
  }
  expect(errors).toEqual([]);
  console.log(JSON.stringify({htmlPages:pages.length,fullDocuments:documents.length,linksChecked,anchorsChecked,resourcesChecked,formsChecked}));
});

test('truthful homepage, careers, blog and article metadata', async ({page, request}) => {
  await page.goto('/index.html');
  await expect(page.locator('main')).not.toContainText('Client Name');
  await expect(page.locator('[data-count]')).toHaveCount(0);
  await expect(page.locator('.avatar-photo')).toHaveCount(4);
  await page.goto('/careers/'); await expect(page.locator('main')).toContainText('No current openings');
  await expect(page.locator('form')).toHaveCount(0);
  await page.goto('/blog/'); await expect(page.locator('main article')).toHaveCount(2);
  await page.locator('a.more[href$="blog/fast-mobile-website/"]').click();
  await expect(page.locator('h1')).toHaveText('Why Your Business Needs a Fast Mobile Website');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content','article');
  const data = await page.locator('script[type="application/ld+json"]').allTextContents();
  const article = data.map(JSON.parse).find(d => d['@type'] === 'BlogPosting');
  expect(article.datePublished).toBeUndefined(); expect(article.url).toBe('https://rumiware.com/blog/fast-mobile-website/');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('https://rumiware.com/blog/fast-mobile-website/');
});

test('social metadata references a real 1200 by 630 asset and production canonicals', async ({page,request})=>{
  const png=await (await request.get('/images/social-preview.png')).body();
  expect(png.readUInt32BE(16)).toBe(1200); expect(png.readUInt32BE(20)).toBe(630);
  expect(png.length).toBeLessThan(100000);
  for(const file of documents) {
    await page.goto('/'+file);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content','https://rumiware.com/images/social-preview.png');
    const description=await page.locator('meta[name=description]').getAttribute('content');
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content',description);
    expect(await page.locator('link[rel=icon]').evaluate(el=>el.href)).toBe(new URL('/images/favicon.png',page.url()).href);
    if(file!=='404.html') expect(await page.locator('link[rel=canonical]').getAttribute('href')).toMatch(/^https:\/\/rumiware\.com\//);
  }
});

test('404 without JavaScript uses production recovery links and readable fallback', async ({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await context.route('https://**/*',route=>route.abort());
  for(const url of ['/nested/missing','/rumiware.com/nested/missing']) {
    expect((await page.goto('http://127.0.0.1:4173'+url)).status()).toBe(404);
    await expect(page.locator('noscript a').first()).toHaveAttribute('href','https://rumiware.com/');
    expect(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(11, 30, 45)');
    await expect(page.getByRole('heading',{name:'This page could not be found'})).toBeVisible();
  }
  await context.close();
});

async function fillContact(page) {
  await page.goto('/contact/');
  await page.locator('#cn').fill('Local QA'); await page.locator('#ce').fill('qa@example.invalid');
  await page.locator('#cm').fill('This is a mocked local verification message.');
}
async function fillQuote(page, file='get-quote/') {
  await page.goto('/'+file);
  await page.locator('[name=service][value=Website]').check();
  await page.locator('.qstep:visible [data-next]').click();
  await page.locator('#description').fill('A website for testing the local quote request workflow.');
  await page.locator('.qstep:visible [data-next]').click();
  await page.locator('#budget').selectOption({label:'Not sure yet'});
  await page.locator('#timeline').selectOption({label:'Flexible'});
  await page.locator('.qstep:visible [data-next]').click();
  await page.locator('#name').fill('Local QA'); await page.locator('#email').fill('qa@example.invalid');
  await page.locator('[name=consent]').check();
}

test('contact and quote validation reject invalid input without a provider request', async ({page}) => {
  let requests=0; await page.route('https://formspree.io/**', r => { requests++; return r.abort(); });
  await page.goto('/contact/'); await page.getByRole('button',{name:'Send message',exact:true}).click();
  expect(await page.locator('#cn').evaluate(el=>el.validity.valueMissing)).toBe(true);
  await page.locator('#cn').fill('QA'); await page.locator('#ce').fill('bad');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  expect(await page.locator('#ce').evaluate(el=>el.validity.typeMismatch)).toBe(true);
  await page.goto('/get-quote/');
  await page.locator('.qstep:visible [data-next]').click();
  await expect(page.locator('.qstep:visible .err')).toContainText('choose a service');
  await page.locator('[name=service][value=Website]').check();
  await page.locator('.qstep:visible [data-next]').click();
  await page.locator('.qstep:visible [data-next]').click();
  await expect(page.locator('.qstep:visible .err')).toContainText('20 characters');
  await fillQuote(page); await page.locator('#email').fill('bad');
  await page.getByRole('button',{name:'Send my request',exact:true}).click();
  await expect(page.locator('.qstep:visible .err')).toContainText('valid email');
  await page.locator('#email').fill('qa@example.invalid'); await page.locator('[name=consent]').uncheck();
  await page.getByRole('button',{name:'Send my request',exact:true}).click();
  await expect(page.locator('.qstep:visible .err')).toContainText('tick the box'); expect(requests).toBe(0);
});

for (const kind of ['contact','quote','quote-preview']) {
  for (const outcome of ['success','rejection','network','timeout']) {
    test(`${kind}: pending, duplicate guard, ${outcome}, retained entries and accessible feedback`, async ({page}) => {
      let route, resolveRequest;
      const arrived = new Promise(resolve => resolveRequest=resolve);
      await page.route('https://formspree.io/**', r => { route=r; resolveRequest(); });
      if (kind==='contact') await fillContact(page); else await fillQuote(page,kind==='quote-preview'?'get-quote-preview.html':'get-quote/');
      const form = page.locator(kind==='contact'?'form.ajax':'#quoteForm');
      const status = page.locator(kind==='contact'?'.fmsg':'#qstatus');
      if(outcome==='timeout') await page.clock.install();
      let sends=0; page.on('request', r=>{if(r.url().includes('formspree.io'))sends++;});
      await form.locator('[type=submit]').click(); await arrived;
      await expect(form).toHaveAttribute('aria-busy','true');
      await expect(form.locator('[type=submit]')).toBeDisabled();
      await expect(status).toHaveAttribute('role','status'); await expect(status).toHaveText('Sending your request…');
      await form.evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
      expect(sends).toBe(1);
      if(outcome==='success') await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
      if(outcome==='rejection') await route.fulfill({status:422,contentType:'application/json',body:'{"errors":[{"message":"Mock rejection"}]}'});
      if(outcome==='network') await route.abort('failed');
      if(outcome==='timeout') await page.clock.fastForward(15001);
      await expect(form).not.toHaveAttribute('aria-busy','true');
      if(outcome==='success') {
        if(kind==='contact') { await expect(status).toContainText('accepted'); await expect(page.locator('#cm')).toHaveValue(''); }
        else { await expect(page.locator('#qdone')).toBeVisible(); await expect(page.locator('#qdone')).toBeFocused(); }
      } else {
        await expect(status).toContainText(outcome==='timeout'?'timed out':'could not confirm');
        await expect(page.locator(kind==='contact'?'#cn':'#name')).toHaveValue('Local QA');
        await expect(page.locator(kind==='contact'?'#cm':'#description')).not.toHaveValue('');
        await expect(form.locator('[type=submit]')).toBeEnabled();
      }
      if(kind!=='quote-preview' && ['success','rejection'].includes(outcome)) {
        await page.screenshot({path:path.join(shotDir,`${kind}-${outcome}-desktop.png`),fullPage:true});
      }
    });
  }
}

test('analytics stay absent before choice, with legacy Accept, after Decline and after withdrawal across pages', async ({page,context}) => {
  const analytics=[];
  page.on('request',r=>{if(/google-analytics|googletagmanager|\/g\/collect/.test(r.url()))analytics.push(r.url());});
  await page.goto('/');
  await page.evaluate(()=>{localStorage.setItem('rw-cookie','yes'); document.cookie='_ga=legacy; path=/'; document.cookie='_ga_DM1NSE0FJ0=legacy; path=/';});
  await page.reload();
  expect((await context.cookies()).filter(c=>c.name.startsWith('_ga'))).toEqual([]);
  await page.locator('footer [data-privacy-open]').click();
  await expect(page.locator('#cookie')).toBeVisible();
  await page.getByRole('button',{name:'Decline analytics'}).press('Enter');
  await expect(page.locator('#privacy-status')).toContainText('declined');
  expect(await page.evaluate(()=>localStorage.getItem('rw-analytics-v1'))).toBe('no');
  await page.keyboard.press('Escape'); await expect(page.locator('footer [data-privacy-open]')).toBeFocused();
  for(const file of documents) { await page.goto('/'+file); expect(await page.evaluate(()=>localStorage.getItem('rw-analytics-v1'))).toBe('no'); }
  await page.goto('/privacy/'); await page.locator('main [data-privacy-open]').click();
  await expect(page.locator('#privacy-status')).toContainText('saved preference is Decline');
  await expect(page.locator('[data-cookie="no"]')).toBeFocused();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await expect(page.locator('main [data-privacy-open]')).toBeFocused();
  expect(analytics).toEqual([]);
});

test('nested missing URLs have actual 404 status, theme styling, assets and working recovery at both mounts', async ({page,request})=>{
  for(const mount of ['/','/rumiware.com/']) {
    for(const missing of ['not-a-page','nested/deeper/missing.html']) {
      const response=await page.goto(mount+missing); expect(response.status()).toBe(404);
      await expect(page.getByRole('heading',{name:'This page could not be found'})).toBeVisible();
      expect(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(11, 30, 45)');
      for(const selector of ['link[rel=stylesheet][href="style.css"]','script[src]','link[rel=icon]']) {
        const url=await page.locator(selector).evaluate(el=>el.href||el.src);
        expect(new URL(url).pathname).toBe(mount+(selector.includes('stylesheet')?'style.css':selector.includes('script')?'script.js':'images/favicon.png'));
        expect((await request.get(url)).status()).toBe(200);
      }
      const home=page.getByRole('link',{name:'Go to Home',exact:true});
      expect(await home.evaluate(el=>new URL(el.href).pathname)).toBe(mount);
      await home.click(); await expect(page.locator('h1')).toContainText('grows your business');
    }
  }
});

test('desktop/mobile and both themes: changed pages, overflow, keyboard menu and screenshots', async ({page})=>{
  test.setTimeout(120000); // This batch captures 28 pages plus keyboard/privacy states.
  for(const width of [1440,390]) for(const theme of ['dark','light']) {
    await page.setViewportSize({width,height:900});
    await page.goto('/'); await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);
    for(const file of ['index.html','careers/','blog/','contact/','get-quote/','privacy/','nested/missing']) {
      await page.goto('/'+file);
      expect(await page.locator('html').getAttribute('data-theme')).toBe(theme);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      // Traverse the page so reveal content is visible in the full-page capture.
      await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,12));}scrollTo(0,0);});
      await page.screenshot({path:path.join(shotDir,`${file.replaceAll('/','-').replace('.html','')}-${width}-${theme}.png`),fullPage:true});
    }
    await page.goto('/contact/'); await page.locator('#cn').focus(); await page.keyboard.press('Tab'); await expect(page.locator('#ce')).toBeFocused();
    if(width===390) { await page.locator('#menuBtn').focus(); await page.keyboard.press('Enter'); await expect(page.locator('#nav')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded','false'); }
    await page.locator('footer [data-privacy-open]').click();
    await page.screenshot({path:path.join(shotDir,`privacy-settings-${width}-${theme}.png`)});
  }
});
