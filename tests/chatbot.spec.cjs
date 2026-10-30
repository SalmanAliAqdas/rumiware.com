const {test,expect}=require('@playwright/test');
const {createResolver,normalize,fallback}=require('../src/assets/chatbot-resolver.js');
const entries=require('../src/data/chatbot-faq.json');
const site=require('../src/data/site.json');
const validate=require('../scripts/validate-chatbot.cjs');
const AxeBuilder=require('@axe-core/playwright').default;

test('FAQ data validates and every prepared question/alternate resolves accurately',()=>{
 expect(validate(entries)).toEqual({entries:96,categories:14});
 const fs=require('node:fs'),path=require('node:path');
 const dist=path.resolve(__dirname,'../dist');
 for(const file of Object.keys(require('../src/data/pages.json')).filter(f=>f!=='404.html'))expect(fs.readFileSync(path.join(dist,require('../scripts/routes.cjs').outputFile(file)),'utf8'),file).toContain('id="rumi-chat"');
 expect(fs.existsSync(path.join(dist,'src/data/chatbot-faq.json'))).toBe(false);
 const resolve=createResolver(entries);
 for(const entry of entries)for(const question of [entry.question,...entry.alternates]) {
  const result=resolve(question);
  // Human requests always go directly to the team, including the real-person question.
  if(question==='Are you a real person')expect(result.type,question).toBe('fallback');
  else { expect(result.type,question).toBe('answer'); expect(result.entry.id,question).toBe(entry.id); }
 }
 expect(resolve('  WILL MY WEBISTE WORK ON MOBILE PHONES!!! ').entry.id).toBe('responsive');
 expect(resolve('What is your pricng?').entry.id).toBe('project-cost');
 expect(normalize(' EXTRA   spaces!? ')).toBe('extra spaces');
 for(const change of [
  [...entries,entries[0]],
  entries.map((e,i)=>i?e:{...e,answer:''}),
  entries.map((e,i)=>i?e:{...e,links:[{label:'Bad',url:'javascript:alert(1)'}]}),
  entries.map((e,i)=>i===1?{...e,alternates:[entries[0].question,'another phrase']}:e)
 ])expect(()=>validate(change)).toThrow();
});

test('weak, misleading, unknown and human requests use exact fallback; ambiguity offers choices',()=>{
 const resolve=createResolver(entries);
 for(const q of ['website','price','pricing','purple elephants','Do you guarantee my website will rank first?','Can you build my website for free?','Do you provide unlimited support?','Can I get a refund?','human','speak to a person','talk to an agent','I do not want a website','<img src=x onerror=alert(1)>']) {
  expect(resolve(q),q).toEqual({type:'fallback',answer:'For help with this question, please contact our team on WhatsApp.'});
 }
 expect(resolve('Android apps and website pricing').type).toBe('topics');
 expect(resolve('What is HTTPS? What is hosting?').type).toBe('topics');
 const ambiguous=createResolver([{id:'one',question:'business website redesign project',alternates:[]},{id:'two',question:'business website redesign options',alternates:[]}]);
 expect(ambiguous('business website redesign')).toMatchObject({type:'topics',ids:['one','two']});
});

async function open(page,path='/') {
 await page.goto(path);
 const privacy=page.locator('#cookie');
 if(await privacy.isVisible())await page.getByRole('button',{name:'Decline analytics',exact:true}).click();
 await page.getByRole('button',{name:'Ask RumiWare',exact:true}).click();
}
async function ask(page,text) {await page.locator('#chat-question').fill(text); await page.locator('#chat-question').press('Enter');}

test('open, close, Escape, focus return, quick replies and reset work without navigation',async({page})=>{
 await open(page);
 const url=page.url();
 await expect(page.locator('#chat-question')).toBeFocused();
 await expect(page.locator('#chat-launcher')).toHaveAttribute('aria-expanded','true');
 await page.getByRole('button',{name:'Our Services',exact:true}).click();
 await page.getByRole('button',{name:'What web development services do you offer?',exact:true}).click();
 await expect(page.locator('#chat-messages')).toContainText('Business websites');
 await page.getByRole('button',{name:'Request a Quote',exact:true}).click();
 await expect(page.locator('#chat-messages a').last()).toHaveAttribute('href',/\/get-quote\/$/);
 await ask(page,'Hello');
 await page.getByRole('button',{name:'New conversation',exact:true}).click();
 await expect(page.locator('#chat-messages .chat-message')).toHaveCount(1);
 await page.keyboard.press('Escape');
 await expect(page.locator('#rumi-chat')).toBeHidden();
 await expect(page.locator('#chat-launcher')).toBeFocused();
 await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Close Ask RumiWare',exact:true}).click();
 await expect(page.locator('#chat-launcher')).toBeFocused();
 expect(page.url()).toBe(url);
});

test('fallback and human action are safe; conversation stays in memory without network requests',async({page})=>{
 await open(page);
 const requests=[];
 page.on('request',r=>requests.push({url:r.url(),body:r.postData()}));
 await page.evaluate(()=>{window.chatXss=false;});
 const malicious='<img src=x onerror="window.chatXss=true">';
 await ask(page,malicious);
 await expect(page.locator('#chat-messages')).toContainText(malicious);
 await expect(page.locator('#chat-messages img')).toHaveCount(0);
 await expect(page.locator('#chat-messages .chat-message').last().locator('p')).toHaveText(fallback);
 await expect(page.locator('#chat-messages a').last()).toHaveAttribute('href',site.whatsapp);
 await expect(page.locator('#chat-messages a').last()).toHaveText('Chat on WhatsApp');
 await ask(page,'speak to a human');
 await expect(page.locator('#chat-messages .chat-message').last().locator('p')).toHaveText(fallback);
 await expect(page.locator('#chat-messages a').last()).toHaveAttribute('href',site.whatsapp);
 await expect(page.locator('#chat-question')).toHaveAttribute('maxlength','400');
 expect(await page.evaluate(()=>window.chatXss)).toBe(false);
 expect(requests).toEqual([]);
 expect(await page.evaluate(()=>Object.keys(localStorage).some(k=>/chat|transcript/i.test(k)))).toBe(false);
 expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
 await page.reload();
 await page.locator('#chat-launcher').click();
 await expect(page.locator('#chat-messages .chat-message')).toHaveCount(1);
});

for(const theme of ['dark','light'])for(const width of [320,390,1280])test(`${theme} theme, ${width}px: nested paths, layout, controls and accessibility`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.addInitScript(t=>localStorage.setItem('rw-theme',t),theme);
 for(const path of ['/','/blog/future-of-ai/','/rumiware.com/blog/future-of-ai/']) {
  await open(page,path);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await ask(page,'Where can I read your blog?');
  const href=await page.locator('#chat-messages a').last().getAttribute('href');
  expect(new URL(href).pathname).toBe(path.startsWith('/rumiware.com/')?'/rumiware.com/blog/':'/blog/');
  const boxes=await page.evaluate(()=>{
   const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
   return {panel:box('#rumi-chat'),wa:box('.wa'),launcher:box('#chat-launcher'),input:box('#chat-question'),scroll:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  expect(boxes.scroll).toBeLessThanOrEqual(boxes.viewport);
  expect(boxes.panel.left).toBeGreaterThanOrEqual(0);
  expect(boxes.panel.right).toBeLessThanOrEqual(width);
  expect(boxes.panel.bottom).toBeLessThanOrEqual(boxes.launcher.top);
  expect(boxes.input.bottom).toBeLessThanOrEqual(boxes.panel.bottom);
  expect(boxes.wa.top-boxes.launcher.bottom).toBeGreaterThanOrEqual(12);
  expect(boxes.wa.top-boxes.launcher.bottom).toBeLessThanOrEqual(20);
  const a11y=await new AxeBuilder({page}).include('#rumi-chat').analyze();
  expect(a11y.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await expect(page.locator('#top')).toBeVisible();
  const top=await page.locator('#top').boundingBox(),launch=await page.locator('#chat-launcher').boundingBox();
  expect(top.y+top.height).toBeLessThanOrEqual(launch.y-8);
 }
});

test('privacy notice and short keyboard viewport do not cover chat controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await open(page);
 // Model a mobile keyboard that changes only VisualViewport, not CSS viewport units.
 await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:280});visualViewport.dispatchEvent(new Event('resize'));});
 await expect(page.locator('#rumi-chat')).toHaveClass(/chat-compact/);
 expect((await page.locator('#chat-question').boundingBox()).y+(await page.locator('#chat-question').boundingBox()).height).toBeLessThanOrEqual(280);
 await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
 await page.setViewportSize({width:390,height:380});
 await expect(page.locator('#chat-question')).toBeInViewport({ratio:1});
 await expect(page.locator('#chat-send')).toBeInViewport({ratio:1});
 await expect(page.locator('#rumi-chat .chat-tools a')).toBeVisible();
 await ask(page,'Hello');
 await page.setViewportSize({width:320,height:280});
 await expect(page.locator('#chat-question')).toBeInViewport({ratio:1});
 await expect(page.locator('#chat-send')).toBeInViewport({ratio:1});
 await expect(page.getByRole('button',{name:'New conversation',exact:true})).toBeInViewport({ratio:1});
 await expect(page.locator('#rumi-chat .chat-tools a')).toBeInViewport({ratio:1});
 await page.setViewportSize({width:390,height:844});
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Privacy settings',exact:true}).click();
 await expect(page.locator('#cookie')).toBeVisible();
 await expect(page.locator('#chat-launcher')).toBeHidden();
 await expect(page.locator('.wa')).toBeHidden();
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await expect(page.locator('#chat-launcher')).toBeVisible();
 await page.goto('/contact/');
 await page.locator('#cn').focus();
 await expect(page.locator('#chat-launcher')).toBeHidden();
});
