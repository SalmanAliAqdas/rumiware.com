const {test,expect}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const shots=path.join(root,process.env.RUMIWARE_PHASE2_SCREENSHOTS_DIR||'verification/phase2/screenshots');fs.mkdirSync(shots,{recursive:true});
const docs=fs.readdirSync(path.join(root,'dist')).filter(f=>f.endsWith('.html')&&fs.readFileSync(path.join(root,'dist',f),'utf8').startsWith('<!DOCTYPE'));
test.beforeEach(async({context})=>{
  await context.route(/formspree\.io|api\.web3forms\.com/,r=>r.abort());
  await context.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|www\.google\.com\/maps/,r=>r.fulfill({status:200,body:''}));
});
async function next(page){await page.locator('.qstep:visible [data-next]').click();}
async function brief(page){
  await page.locator('[name=service][value=Website]').check();await next(page);
  await page.locator('#description').fill('A locally tested website brief that must never reach a live provider.');await next(page);
  await page.locator('#budget').selectOption({label:'Not sure yet'});await page.locator('#timeline').selectOption({label:'Flexible'});await next(page);
  await page.locator('#name').fill('Local QA');await page.locator('#email').fill('qa@example.invalid');await page.locator('[name=consent]').check();
}
async function noOverflow(page,label){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label).toBe(true);
}
function luminance(color){
  const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(a,b){const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (values[0]+.05)/(values[1]+.05);}
async function colors(page,selector){return page.locator(selector).first().evaluate(el=>{
  // Resolve CSS Color 4 and alpha backgrounds using the browser's own color parser.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,1,1);
  const chain=[];for(let p=el;p;p=p.parentElement)chain.unshift(p);
  for(const p of chain){ctx.fillStyle=getComputedStyle(p).backgroundColor;ctx.fillRect(0,0,1,1);}
  const pixel=ctx.getImageData(0,0,1,1).data;
  return {color:getComputedStyle(el).color,bg:`rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`};
});}

for(const width of [320,375,768,960,1024,1440]) for(const theme of ['dark','light']){
  test(`${width}px ${theme}: all pages fit, breadcrumbs are independent and header controls do not overlap`,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});
    await page.goto('/');await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);
    for(const file of docs){
      await page.goto('/'+file);await noOverflow(page,file);
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      const header=await page.evaluate(()=>{
        const logo=document.querySelector('header .logo').getBoundingClientRect(),tools=document.querySelector('.tools').getBoundingClientRect();
        const nav=document.querySelector('#nav');const n=nav.getBoundingClientRect();
        return {logoTools:logo.right<=tools.left,navOverlap:getComputedStyle(nav).display!=='none'&&(n.left<logo.right||n.right>tools.left)};
      });
      expect(header.logoTools,file).toBe(true);expect(header.navOverlap,file).toBe(false);
      if(file!=='index.html'&&file!=='404.html'){
        await expect(page.locator('.crumbs')).toBeVisible();expect(await page.locator('.crumbs').evaluate(el=>getComputedStyle(el).position)).toBe('static');
      }
    }
    await page.goto('/services.html');await expect(page.getByRole('navigation',{name:'Jump to a service'})).toBeVisible();
    const menu=page.locator('#menuBtn');
    if(width<1100){
      await expect(menu).toBeVisible();await expect(page.locator('#nav')).toBeHidden();
      await menu.press('Enter');await expect(menu).toHaveAttribute('aria-label','Close menu');await expect(menu).toHaveAttribute('aria-expanded','true');
      await page.keyboard.press('Tab');await expect(page.locator('#nav a').first()).toBeFocused();
      await page.keyboard.press('Escape');await expect(menu).toBeFocused();await expect(menu).toHaveAttribute('aria-label','Open menu');await expect(page.locator('#nav')).toBeHidden();
    }else{await expect(menu).toBeHidden();await expect(page.locator('#nav')).toBeVisible();}
    expect(errors).toEqual([]);
  });
}

test('menu closes on selection, focus departure and resize; breadcrumbs never become a menu',async({page})=>{
  await page.setViewportSize({width:375,height:800});await page.goto('/contact.html');const menu=page.locator('#menuBtn');
  await menu.click();
  // Observe closure before navigation without changing the link's behavior in application code.
  await page.locator('#nav a').first().evaluate(a=>a.addEventListener('click',e=>e.preventDefault()));
  await page.locator('#nav a').first().click();await expect(menu).toHaveAttribute('aria-expanded','false');
  await menu.click();await page.locator('#cn').focus();await expect(menu).toHaveAttribute('aria-expanded','false');
  await menu.click();await page.setViewportSize({width:1440,height:900});await expect(menu).toHaveAttribute('aria-expanded','false');
  await page.locator('#nav a').first().focus();await page.setViewportSize({width:960,height:900});await expect(menu).toBeFocused();
  await expect(page.locator('.crumbs')).toBeVisible();
});

test('collapsing navigation preserves focus outside the menu',async({page})=>{
  await page.setViewportSize({width:1440,height:900});await page.goto('/contact.html');
  await page.locator('#nav a').first().focus();
  await page.locator('#cn').focus();
  await page.setViewportSize({width:960,height:900});
  await expect(page.locator('#cn')).toBeFocused();
  await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#nav')).toBeHidden();
});

test('skip link reaches main and selected controls have non-color indicators',async({page})=>{
  await page.goto('/');await page.keyboard.press('Tab');await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
  await page.goto('/get-quote.html');await page.locator('[name=service][value=Website]').check();
  expect(await page.locator('[name=service][value=Website]+span').evaluate(el=>getComputedStyle(el,'::after').content)).toContain('✓');
  await page.goto('/portfolio.html');
  // Only website projects remain, so the redundant category filter was removed.
  expect(await page.locator('#nav a[aria-current=page]').evaluate(el=>getComputedStyle(el).textDecorationLine)).toContain('underline');
});

test('quote focus, packages, required semantics, stale errors, review and full-brief revalidation',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));let sends=0;await page.route('https://formspree.io/**',r=>{sends++;return r.fulfill({status:422,body:'{}'});});
  for(const plan of ['starter','business','enterprise','unverified','__proto__','<script>alert(1)</script>']){
    await page.goto('/get-quote.html?plan='+encodeURIComponent(plan));
    expect(await page.evaluate(()=>document.activeElement.tagName)).toBe('BODY');
    const allowed=['starter','business','enterprise'].includes(plan);
    await expect(page.locator('[name=package]')).toHaveValue(allowed?plan:'');
    await expect(page.locator('#selected-package')).toContainText(allowed?'Selected package:':'No pricing package');
  }
  await page.goto('/get-quote.html?plan=business');await next(page);
  await expect(page.locator('[name=service]').first()).toBeFocused();
  await expect(page.locator('[name=service]').first()).toHaveAttribute('aria-invalid','true');
  await page.locator('[name=service][value=Website]').check();await expect(page.locator('[aria-invalid]')).toHaveCount(0);await next(page);
  await expect(page.locator('.qstep:visible legend')).toBeFocused();await next(page);
  await expect(page.locator('#description')).toBeFocused();await page.locator('#description').fill('A fully described project with enough characters.');
  await expect(page.locator('#description')).not.toHaveAttribute('aria-invalid');
  await expect(page.locator('#description')).toHaveAttribute('aria-describedby',/qerror-1/);
  await expect(page.locator('#description')).toHaveAttribute('required','');await next(page);await next(page);
  await expect(page.locator('#budget')).toBeFocused();await page.locator('#budget').selectOption({label:'Not sure yet'});
  await expect(page.locator('#budget')).not.toHaveAttribute('aria-invalid');
  await expect(page.locator('#timeline')).toHaveAttribute('aria-invalid','true');
  await page.locator('#timeline').selectOption({label:'Flexible'});await next(page);
  await expect(page.locator('#quote-review')).toContainText('Business');await expect(page.locator('#quote-review')).toContainText('A fully described project');
  await page.locator('#name').fill('Local QA');await page.locator('#email').fill('qa@example.invalid');await page.locator('[name=consent]').check();
  // Simulate a previous step becoming invalid after navigation; the whole brief must be checked.
  await page.locator('#description').evaluate(el=>el.value='short');await page.getByRole('button',{name:'Send my request',exact:true}).click();
  await expect(page.locator('#description')).toBeFocused();expect(sends).toBe(0);
  await page.locator('#description').fill('A corrected brief that is longer than twenty characters.');await next(page);await next(page);
  await page.locator('#email').fill('bad');await page.getByRole('button',{name:'Send my request',exact:true}).click();await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email').fill('qa@example.invalid');await expect(page.locator('#email')).not.toHaveAttribute('aria-invalid');
  await page.getByRole('button',{name:'Send my request',exact:true}).click();await expect(page.locator('#qstatus')).toContainText('could not confirm');
  await expect(page.locator('#qstatus')).toBeFocused();await expect(page.locator('#name')).toHaveValue('Local QA');expect(sends).toBe(1);expect(errors).toEqual([]);
});

test('early theme before shared script and storage denied do not break essential features',async({page})=>{
  await page.goto('/');await page.evaluate(()=>localStorage.setItem('rw-theme','light'));
  await page.route('**/script.js',r=>r.abort());await page.goto('/contact.html');
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  expect(await page.locator('html').evaluate(el=>getComputedStyle(el).colorScheme)).toBe('light');
  await expect(page.locator('.rv').first()).toHaveCSS('opacity','1');
  await page.unroute('**/script.js');
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError');}});});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/get-quote.html');
  await page.locator('#themeBtn').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('#email')).toHaveCSS('color-scheme','light');
  await brief(page);await expect(page.locator('#quote-review')).toContainText('Website');expect(errors).toEqual([]);
});

test('missing optional feature nodes and failed observer cannot disable unrelated features',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.route('**/script.js',async r=>{
    const response=await r.fetch();const source=await response.text();
    await r.fulfill({response,body:"['nav','privacy-status','qprog'].forEach(id=>document.getElementById(id)?.remove()); window.IntersectionObserver=function(){throw Error('Observer unavailable');};\n"+source});
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/get-quote.html');await expect(page.locator('#quote-alternative')).toBeVisible();await expect(page.locator('#quoteForm')).toBeHidden();
  await page.locator('#themeBtn').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.keyboard.press('Escape');await page.locator('footer [data-privacy-open]').click();
  await page.goto('/index.html');await expect(page.locator('.rv').first()).toHaveCSS('opacity','1');expect(errors).toEqual([]);
});

test('JavaScript disabled: content, navigation and contact alternatives work with normal motion',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,reducedMotion:'no-preference',viewport:{width:320,height:800}});
  await context.route('https://**/*',r=>r.abort());const page=await context.newPage();
  for(const file of docs.filter(f=>f!=='404.html')){
    await page.goto('http://127.0.0.1:4173/'+file);await noOverflow(page,file);
    await expect(page.locator('#nav')).toBeVisible();
    for(const el of await page.locator('.rv').all())await expect(el).toHaveCSS('opacity','1');
    if(file.startsWith('get-quote')){await expect(page.locator('#quote-alternative')).toBeVisible();await expect(page.locator('#quoteForm')).toBeHidden();await expect(page.locator('#quote-alternative a').first()).toHaveAttribute('href','mailto:info@rumiware.com');}
  }
  await page.screenshot({path:path.join(shots,'no-javascript-320.png'),fullPage:true});await context.close();
});

test('reveal initialization succeeds safely and reduced motion disables animation',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/reveal-ready/);
  const reveal=page.locator('.rv').first();await reveal.scrollIntoViewIfNeeded();await expect(reveal).toHaveCSS('opacity','1');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.rv').last()).toHaveCSS('opacity','1');
  await page.reload();
  expect(await page.locator('html').evaluate(el=>el.classList.contains('reveal-ready'))).toBe(false);
  await expect(reveal).toHaveCSS('opacity','1');expect(await reveal.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
  expect(await page.locator('html').evaluate(el=>getComputedStyle(el).scrollBehavior)).toBe('auto');
});

for(const theme of ['dark','light']){
  test(`${theme}: measured text, emphasis, errors, chip hover and focus contrast meet AA`,async({page})=>{
    await page.goto('/');await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);await page.reload();
    const rows=[];
    for(const selector of ['.eyebrow','h1 em','.tech span','.logo span']){
      const c=await colors(page,selector);rows.push({selector,...c,ratio:contrast(c.color,c.bg)});
    }
    await page.locator('.tech span').first().hover();const hover=await colors(page,'.tech span');rows.push({selector:'chip hover',...hover,ratio:contrast(hover.color,hover.bg)});
    await page.goto('/get-quote.html');await next(page);const error=await colors(page,'.qstep:visible .err');rows.push({selector:'error',...error,ratio:contrast(error.color,error.bg)});
    for(const row of rows)expect(row.ratio,JSON.stringify(row)).toBeGreaterThanOrEqual(4.5);
    await page.locator('#themeBtn').focus();const ring=await page.locator('#themeBtn').evaluate(el=>({outline:getComputedStyle(el).outlineColor,width:getComputedStyle(el).outlineWidth,background:getComputedStyle(document.body).backgroundColor}));
    expect(ring.width).toBe('3px');expect(contrast(ring.outline,ring.background)).toBeGreaterThanOrEqual(3);
    const control=await page.locator('.opt span').first().evaluate(el=>({border:getComputedStyle(el).borderColor,bg:getComputedStyle(el).backgroundColor}));
    expect(contrast(control.border,control.bg)).toBeGreaterThanOrEqual(3);
    fs.writeFileSync(path.join(root,`verification/phase2/contrast-${theme}.json`),JSON.stringify(rows,null,2)+'\n');
  });
  test(`${theme}: automated WCAG A/AA scans across public pages and active quote controls`,async({page})=>{
    test.setTimeout(180000);await page.goto('/');await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);
    const findings=[];
    for(const file of docs){
      await page.goto('/'+file);
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
      findings.push({file,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
    }
    await page.goto('/get-quote.html');await brief(page);
    let result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();findings.push({file:'quote-final-step',violations:result.violations});
    await page.locator('footer [data-privacy-open]').click();result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();findings.push({file:'privacy-settings',violations:result.violations});
    fs.writeFileSync(path.join(root,`verification/phase2/axe-${theme}.json`),JSON.stringify(findings,null,2)+'\n');
    expect(findings.filter(f=>f.violations.length)).toEqual([]);
  });
}

test('200 percent zoom reflow and text resizing, both themes, with screenshots',async({browser,page})=>{
  test.setTimeout(90000);
  for(const theme of ['dark','light']){
    // A 1440px physical viewport at 200% zoom has 720 CSS pixels. DPR alone is not zoom.
    const context=await browser.newContext({viewport:{width:720,height:450},deviceScaleFactor:2,reducedMotion:'reduce'});
    await context.route('https://**/*',r=>r.abort());const zoom=await context.newPage();await zoom.goto('http://127.0.0.1:4173/');await zoom.evaluate(t=>localStorage.setItem('rw-theme',t),theme);
    for(const file of ['index.html','contact.html','get-quote.html','services.html']){await zoom.goto('http://127.0.0.1:4173/'+file);await noOverflow(zoom,file);await expect(zoom.locator('#menuBtn')).toBeVisible();}
    await zoom.goto('http://127.0.0.1:4173/get-quote.html');await brief(zoom);await zoom.screenshot({path:path.join(shots,`quote-200percent-reflow-${theme}.png`),fullPage:true});await context.close();
    for(const width of [320,375,768,960,1024,1440]){
      await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);
      for(const file of ['index.html','contact.html','get-quote.html','services.html']){
        await page.goto('/'+file);await page.addStyleTag({content:'html{font-size:200%!important}'});await noOverflow(page,`${width} ${theme} text resize ${file}`);
      }
    }
  }
});

test('capture desktop/mobile header, quote review, error recovery and contact screenshots',async({page})=>{
  test.setTimeout(120000); // Eight viewport/theme combinations include several captures each.
  for(const width of [320,375,960,1440])for(const theme of ['dark','light']){
    await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(t=>localStorage.setItem('rw-theme',t),theme);
    await page.goto('/contact.html');await page.screenshot({path:path.join(shots,`contact-${width}-${theme}.png`),fullPage:true});
    if(width<1100){await page.locator('#menuBtn').click();await page.screenshot({path:path.join(shots,`menu-${width}-${theme}.png`)});}
    await page.goto('/get-quote.html?plan=starter');await brief(page);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(shots,`quote-review-${width}-${theme}.png`),fullPage:true});
    await page.locator('#email').fill('bad');await page.getByRole('button',{name:'Send my request',exact:true}).click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(shots,`quote-error-${width}-${theme}.png`),fullPage:true});
  }
});
