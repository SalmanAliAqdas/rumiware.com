const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');const out=path.join(root,'dist');
const config=JSON.parse(fs.readFileSync(path.join(root,'src/data/site.json'),'utf8'));
const files=fs.readdirSync(out,{recursive:true}).filter(f=>f.endsWith('.html')).map(f=>f.replaceAll('\\','/'));const pages=new Map(files.map(f=>[f,fs.readFileSync(path.join(out,f),'utf8')]));
const errors=[];let links=0,assets=0,forms=0;
function fail(message){errors.push(message);}
for(const [file,source] of pages){
 const ids=[...source.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);if(ids.length!==new Set(ids).size)fail(file+': duplicate IDs');
 for(const key of ['description','og:title','og:description','og:url','og:image'])if(!new RegExp(`<meta (?:name|property)="${key}" content="[^"]+"`).test(source))fail(file+': missing '+key);
 if(file!=='404.html'&&!source.includes(`<link rel="canonical" href="${config.url}`))fail(file+': missing production canonical');
 for(const m of source.matchAll(/<(?:a|link|script|img|iframe)\b[^>]*\b(?:href|src)=["']([^"']+)["'][^>]*>/g)){
  const raw=m[1].replaceAll('&amp;','&');if(/^(?:https?:|mailto:|tel:|data:)/.test(raw))continue;
  const url=new URL(raw,'https://local.invalid/'+file);let target=decodeURIComponent(url.pathname).slice(1)||'index.html';
  if(target.endsWith('/'))target+='index.html';
  if(!fs.existsSync(path.join(out,target))||!fs.statSync(path.join(out,target)).isFile()){fail(`${file}: missing ${raw}`);continue;}
  if(m[0].startsWith('<a'))links++;else assets++;
  if(url.hash){const html=pages.get(target)||'';if(!new RegExp(`(?:id|name)=["']${url.hash.slice(1)}["']`).test(html))fail(`${file}: missing anchor ${raw}`);}
 }
 for(const m of source.matchAll(/<form\b[^>]*>/g)){forms++;const action=m[0].match(/action="([^"]+)"/)?.[1];if(!Object.values(config.forms).includes(action))fail(file+': unexpected form action');if(/YOUR_|placeholder|access_key/i.test(m[0]))fail(file+': placeholder form');}
 for(const img of source.matchAll(/<img\b[^>]*>/g))if(!/\bwidth="\d+"/.test(img[0])||!/\bheight="\d+"/.test(img[0])||!/\balt="[^"]+"/.test(img[0]))fail(file+': image needs intrinsic dimensions and alt');
 if(/googletagmanager\.com|google-analytics\.com/.test(source))fail(file+': Google tag must be isolated behind consent');
 if((source.match(/id="analytics-config"/g)||[]).length!==1)fail(file+': missing or duplicate analytics configuration');
 if(/www\.linkedin\.com\/["']|github\.com\/["']/.test(source))fail(file+': generic profile link');
}
if(!/^G-[A-Z0-9]+$/.test(config.analytics.measurementId))fail('Invalid public measurement ID');
const frame=fs.readFileSync(path.join(out,'analytics-frame.htm'),'utf8');
if(!frame.includes('event.source !== parent')||!frame.includes('ga-disable-')||!frame.includes(config.analytics.measurementId))fail('Missing isolated analytics consent guard');
try{execFileSync(process.execPath,['--check',path.join(root,'src/assets/analytics-frame.js')],{stdio:'pipe'});}catch{fail('Invalid analytics frame script');}
const css=fs.readFileSync(path.join(out,'style.css'),'utf8');for(const m of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g))if(!fs.existsSync(path.join(out,m[1])))fail('Missing CSS asset '+m[1]);
for(const dev of ['head.html','header.html','footer.html','get-quote-preview.html','src','reference','.vscode','node_modules','verification'])if(fs.existsSync(path.join(out,dev)))fail('Private/development path published: '+dev);
if(!fs.existsSync(path.join(out,'images/social-preview.png')))fail('Missing sharing asset');
try{execFileSync(process.execPath,['--check',path.join(out,'script.js')],{stdio:'pipe'});execFileSync(process.execPath,[path.join(root,'scripts/validate-html.cjs')],{stdio:'inherit'});}catch{fail('Syntax or HTML validation failed');}
for(const file of fs.readdirSync(path.join(root,'scripts')).filter(f=>/\.(cjs|mjs)$/.test(f)))try{execFileSync(process.execPath,['--check',path.join(root,'scripts',file)],{stdio:'pipe'});}catch{fail('Invalid maintenance script: '+file);}
console.log(JSON.stringify({pages:files.length,internalLinks:links,assets,activeForms:forms,errors},null,2));if(errors.length)process.exitCode=1;
