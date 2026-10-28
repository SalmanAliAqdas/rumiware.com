// Captures only public app overview states; never uploads or changes stored records.
const {chromium}=require('@playwright/test');const fs=require('node:fs');const path=require('node:path');
const ids=['stock-market','pdf-toolkit','weather','expense-tracker','qr-code-studio','movies'];
const selected=process.argv.length>2?process.argv.slice(2):ids;
if(selected.some(id=>!ids.includes(id)))throw Error('Unknown project');
(async()=>{const dir=path.resolve(__dirname,'../reference/project-captures/streamlit');fs.mkdirSync(dir,{recursive:true});const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const recordFile='verification/portfolio-screenshots/captures.json';const records=fs.existsSync(recordFile)?JSON.parse(fs.readFileSync(recordFile,'utf8')).filter(r=>!selected.includes(r.id)):[];
for(const id of selected){const project=require('../src/data/projects.json').find(p=>p.id===id);const page=await b.newPage({viewport:id==='stock-market'?{width:1280,height:800}:{width:1440,height:900},reducedMotion:'reduce'});let result={id,requestedUrl:project.url};try{await page.goto(project.url+'~/+/'+(id==='movies'?'?embed=true&embed_options=dark_theme':'' ),{waitUntil:'commit',timeout:45000});await page.locator('[data-testid="stAppViewContainer"]').waitFor({timeout:60000});await page.waitForTimeout(7000);
if(id==='movies'&&await page.getByRole('button',{name:'Expand sidebar',exact:true}).count()){await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();await page.waitForTimeout(500);}
if(id==='qr-code-studio'){const field=page.getByRole('textbox',{name:'Website URL',exact:true});await field.fill('https://rumiware.com/');await field.press('Enter');await page.waitForTimeout(2000);}
if(id==='stock-market')await page.getByText('Apple Inc.',{exact:true}).waitFor({timeout:60000});
await page.evaluate(()=>document.fonts.ready);await page.locator('[data-testid="stSpinner"]').waitFor({state:'hidden',timeout:45000});
const text=await page.locator('body').innerText();if(text.length<200||/This app has gone to sleep|Traceback|Connection error|Please wait/i.test(text))throw Error('Not a finished interface');
if(id==='expense-tracker'&&!text.includes('Fictional data'))throw Error('Expense workspace not explicitly fictional');
for(const image of await page.locator('img:visible').all()){await image.evaluate(i=>i.decode()).catch(()=>{});}
const unfinished=await page.locator('[data-testid=stSkeleton], [data-testid=stSpinner]').evaluateAll(es=>es.some(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0;}));if(unfinished)throw Error('Unfinished element in capture viewport');
await page.screenshot({path:path.join(dir,id+'.png')});result={...result,captureUrl:page.url(),title:await page.title(),viewport:page.viewportSize(),capturedAt:new Date().toISOString(),original:'reference/project-captures/streamlit/'+id+'.png',text};console.log('Captured '+id);
}catch(e){result.error=e.message.split('\n')[0];console.log('Unavailable '+id+': '+result.error);}await page.close();records.push(result);fs.writeFileSync('verification/portfolio-screenshots/captures.json',JSON.stringify(records,null,2));}
await b.close();})();
