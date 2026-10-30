const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test.afterEach(async({context})=>{await context.unrouteAll({behavior:'wait'});});
const origin='https://rumiware.com';
const key='rw-analytics-v1';
const google=/googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com/;
// The default fixture exercises the actual queued tag contract without external traffic.
// GA4_TAG_FIXTURE additionally runs these tests with a downloaded official gtag.js.
const tag=process.env.GA4_TAG_FIXTURE?fs.readFileSync(process.env.GA4_TAG_FIXTURE,'utf8'):`
(function(){let settings={},id;const run=args=>{const a=Array.from(args);if(a[0]==='set')Object.assign(settings,a[1]);if(a[0]==='config'){id=a[1];Object.assign(settings,a[2]);}if(a[0]==='event'&&!window['ga-disable-'+id]){document.cookie='_ga=test;path=/;SameSite=Lax;Secure';const q=new URLSearchParams({tid:id,en:a[1],dl:settings.page_location,dr:settings.page_referrer,dt:settings.page_title});navigator.sendBeacon('https://www.google-analytics.com/g/collect?'+q);}};dataLayer.forEach(run);const push=dataLayer.push.bind(dataLayer);dataLayer.push=function(a){push(a);run(a);};})();`;
async function setup(context,request){
 const requests=[];
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(google.test(u.hostname)){
   requests.push({url:req.url(),body:req.postData()||'',referrer:req.headers().referer||''});
   if(u.hostname==='www.googletagmanager.com'&&u.pathname==='/gtag/js')await route.fulfill({contentType:'application/javascript',body:tag});
   else await route.fulfill({status:204,body:''});
  }else if(['rumiware.com','www.rumiware.com','preview.rumiware.com','salmanaliaqdas.github.io','localhost'].includes(u.hostname)){
   const local=await request.get('http://127.0.0.1:4173'+u.pathname+u.search);
   await route.fulfill({response:local});
  }else if(u.hostname==='127.0.0.1')await route.continue();
  else await route.abort();
 });
 return requests;
}
const collects=r=>r.filter(x=>/\/g\/collect/.test(x.url));
const views=r=>collects(r).filter(x=>new URL(x.url).searchParams.get('en')==='page_view'||/(?:^|\n|&)en=page_view(?:&|$)/.test(x.body));
async function choice(page,value){await page.locator('footer [data-privacy-open]').click();await page.getByRole('button',{name:value+' analytics',exact:true}).click();}
async function commands(page){const f=page.frames().find(f=>f.url().endsWith('/analytics-frame.htm'));return f?f.evaluate(()=>dataLayer.map(a=>Array.from(a))):[];}

test('fresh, declined and old preferences never contact Google; rejection persists',async({page,context,request})=>{
 const r=await setup(context,request);
 await page.goto(origin+'/?email=private@example.invalid#secret');
 await expect(page.locator('#cookie')).toBeVisible();await page.waitForTimeout(250);expect(r).toEqual([]);
 await choice(page,'Decline');await page.reload();await page.goto(origin+'/blog/future-of-ai/');expect(r).toEqual([]);
 await page.evaluate(k=>{localStorage.removeItem(k);localStorage.setItem('rw-cookie','yes');localStorage.setItem('rw-analytics-v0','yes');document.cookie='_ga=old;path=/';},key);
 await page.reload();await expect(page.locator('#cookie')).toBeVisible();expect(r).toEqual([]);
 expect((await context.cookies()).filter(c=>c.name.startsWith('_ga'))).toEqual([]);
});

test('accept initializes once, sends one view per accepted load including nested articles',async({page,context,request})=>{
 const r=await setup(context,request);
 await page.goto(origin+'/');await choice(page,'Accept');
 await expect.poll(()=>views(r).length).toBe(1);
 await choice(page,'Accept');await page.waitForTimeout(150);
 expect(r.filter(x=>x.url.includes('/gtag/js'))).toHaveLength(1);expect(views(r)).toHaveLength(1);
 expect(new URL(views(r)[0].url).searchParams.get('tid')).toBe('G-DM1NSE0FJ0');
 const c=await commands(page);expect(c.filter(a=>a[0]==='config')).toHaveLength(1);expect(c.find(a=>a[0]==='config')[1]).toBe('G-DM1NSE0FJ0');expect(c.find(a=>a[0]==='config')[2].send_page_view).toBe(false);
 await page.goto(origin+'/blog/future-of-ai/?phone=secret#private');await expect.poll(()=>views(r).length).toBe(2);
 expect(new URL(views(r)[1].url).searchParams.get('dl')).toBe(origin+'/blog/future-of-ai/');
 await page.reload();await expect.poll(()=>views(r).length).toBe(3);expect(r.filter(x=>x.url.includes('/gtag/js'))).toHaveLength(3);
});

test('withdrawal removes the tag context, clears scoped cookies and persists; reaccept cannot duplicate a view',async({page,context,request})=>{
 const r=await setup(context,request);await page.goto(origin+'/blog/future-of-ai/');await choice(page,'Accept');await expect.poll(()=>views(r).length).toBe(1);
 await context.addCookies([{name:'_ga_nested',value:'test',domain:'.rumiware.com',path:'/blog/',secure:true},{name:'_ga',value:'test',domain:'.rumiware.com',path:'/',secure:true}]);
 await choice(page,'Decline');expect(await page.locator('iframe[title="Consented page analytics"]').count()).toBe(0);
 expect((await context.cookies()).filter(c=>c.name.startsWith('_ga'))).toEqual([]);
 const n=r.length;await page.waitForTimeout(1200);expect(r).toHaveLength(n);
 await choice(page,'Accept');expect(views(r)).toHaveLength(1);await choice(page,'Decline');
 await page.reload();await page.goto(origin+'/contact/');expect(r).toHaveLength(n);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('no');
});

test('withdrawal in another tab stops collection',async({page,context,request})=>{
 const r=await setup(context,request);await page.goto(origin+'/');await choice(page,'Accept');await expect.poll(()=>views(r).length).toBe(1);
 const second=await context.newPage();await second.goto(origin+'/about/');await expect.poll(()=>views(r).length).toBe(2);await choice(second,'Decline');
 await expect(page.locator('iframe[title="Consented page analytics"]')).toHaveCount(0);const n=r.length;await page.reload();expect(r).toHaveLength(n);
});

for(const host of ['http://127.0.0.1:4173','http://localhost:4173','https://preview.rumiware.com','https://salmanaliaqdas.github.io/rumiware.com','https://rumiware.com/rumiware.com'])test('preview excluded: '+host,async({page,context,request})=>{
 const r=await setup(context,request);await context.addInitScript(k=>localStorage.setItem(k,'yes'),key);await page.goto(host+'/');await page.waitForTimeout(150);expect(r).toEqual([]);await choice(page,'Accept');expect(r).toEqual([]);
});

test('payloads exclude raw URL, referrer, form and chat content',async({page,context,request})=>{
 const r=await setup(context,request);const secret='private-person-987';
 await page.goto(origin+'/contact/?utm_campaign='+secret+'&email='+secret+'#'+secret,{referer:'https://example.com/'+secret+'?q='+secret+'#'+secret});
 await page.locator('#cn').fill(secret);await page.locator('#ce').fill(secret+'@example.invalid');await page.locator('#cm').fill(secret);
 await choice(page,'Accept');await expect.poll(()=>views(r).length).toBe(1);await page.keyboard.press('Escape');
 await page.locator('#chat-launcher').click();await page.locator('#chat-question').fill(secret);await page.locator('#chat-send').click();
 await page.locator('#cn').focus();await page.locator('#cn').blur();await page.evaluate(s=>history.pushState({},'', '?q='+s+'#'+s),secret);await page.waitForTimeout(600);
 const payload=r.map(x=>decodeURIComponent(x.url+' '+x.body+' '+x.referrer)).join('\n');expect(payload).not.toContain(secret);expect(payload).not.toContain('form_start');expect(payload).not.toContain('form_submit');expect(views(r)).toHaveLength(1);
 const v=new URL(views(r)[0].url);expect(v.searchParams.get('dl')).toBe(origin+'/contact/');expect(v.searchParams.get('dr')).toBe('https://example.com/');
 const f=page.frames().find(f=>f.url().endsWith('/analytics-frame.htm'));expect(await f.locator('form,input,textarea,a').count()).toBe(0);
});

for(const width of [390,1440])for(const theme of ['light','dark'])test(`keyboard privacy controls ${width} ${theme}`,async({page,context,request})=>{
 const r=await setup(context,request);await page.setViewportSize({width,height:844});await context.addInitScript(t=>localStorage.setItem('rw-theme',t),theme);await page.goto(origin+'/');
 const decline=page.getByRole('button',{name:'Decline analytics',exact:true}),accept=page.getByRole('button',{name:'Accept analytics',exact:true});
 await decline.focus();await expect(decline).toBeInViewport();await page.keyboard.press('Tab');await expect(accept).toBeFocused();await expect(accept).toBeInViewport();
 expect(await decline.evaluate(e=>e.className)).toBe(await accept.evaluate(e=>e.className));await page.keyboard.press('Enter');await expect.poll(()=>views(r).length).toBe(1);
 await page.keyboard.press('Escape');await page.locator('footer [data-privacy-open]').focus();await page.keyboard.press('Enter');await expect(decline).toBeFocused();await page.keyboard.press('Enter');
 await page.keyboard.press('Escape');await expect(page.locator('footer [data-privacy-open]')).toBeFocused();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('no');
});

for(const consent of ['Accept','Decline'])test('contact form stays usable after '+consent,async({page,context,request})=>{
 const r=await setup(context,request);let submitted=0;
 await context.route('https://formspree.io/**',async route=>{submitted++;await route.fulfill({contentType:'application/json',body:'{"ok":true}'});});
 await page.goto(origin+'/contact/');await choice(page,consent);await page.keyboard.press('Escape');
 if(consent==='Accept')await expect.poll(()=>views(r).length).toBe(1);
 await page.locator('#cn').fill('Consent QA private');await page.locator('#ce').fill('consent-private@example.invalid');await page.locator('#cm').fill('Private enquiry, intercepted by the automated browser test.');
 await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.locator('.fmsg')).toContainText('accepted by our form provider');expect(submitted).toBe(1);
 await page.waitForTimeout(300);expect(views(r)).toHaveLength(consent==='Accept'?1:0);expect(r.map(x=>decodeURIComponent(x.url+' '+x.body+' '+x.referrer)).join(' ')).not.toContain('consent-private');expect(collects(r).some(x=>/form_start|form_submit/.test(x.url+x.body))).toBe(false);
});

test('standalone analytics document cannot activate tracking',async({page,context,request})=>{
 const r=await setup(context,request);await page.goto(origin+'/analytics-frame.htm');await page.evaluate(()=>postMessage({type:'rw-page-analytics',measurementId:'G-DM1NSE0FJ0',config:{}},location.origin));await page.waitForTimeout(250);expect(r).toEqual([]);
});

test('blocked storage keeps the choice explicit and site usable',async({page,context,request})=>{
 const r=await setup(context,request);await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}});});
 await page.goto(origin+'/');await choice(page,'Accept');await expect.poll(()=>views(r).length).toBe(1);await expect(page.locator('#privacy-status')).toContainText('this page only');await choice(page,'Decline');
 await expect(page.locator('iframe[title="Consented page analytics"]')).toHaveCount(0);const n=r.length;await page.reload();await expect(page.getByRole('button',{name:'Accept analytics',exact:true})).toBeVisible();expect(r).toHaveLength(n);
});
