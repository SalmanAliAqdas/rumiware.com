// A small, dependency-free static builder. It never contacts hosting or providers.
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const out=path.resolve(root,'dist');
if(path.relative(root,out)!=='dist'||(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink()))throw Error('Unsafe output path');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');const data=name=>JSON.parse(read(`src/data/${name}.json`));
const site=data('site'),pages=data('pages'),plans=data('pricing'),team=data('team'),services=data('services'),commercial=data('commercial'),icons=data('icons'),projects=data('projects');
const homeEnquiry=data('home-enquiry');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const json=s=>JSON.stringify(s).replaceAll('<','\\u003c');
const icon=name=>{if(!icons[name])throw Error('Unknown icon '+name);return `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;};
const nav=(flag,file)=>site.navigation.filter(n=>n[flag]).map(n=>`<li><a href="${esc(n.file)}"${n.file===file?' aria-current="page"':''}>${esc(n.label)}</a></li>`).join('');
function projectPreview(p,larger){
 const sizes=larger?'(max-width: 619px) calc(100vw - 7rem), (max-width: 1199px) calc(50vw - 6rem), 510px':'(max-width: 619px) calc(100vw - 7rem), (max-width: 959px) calc(50vw - 6rem), 300px';
 const responsive=p.imageSmall?' srcset="images/projects/'+esc(p.imageSmall)+' 640w, images/projects/'+esc(p.image)+' '+p.width+'w" sizes="'+sizes+'"':'';
 let image='<img src="images/projects/'+esc(p.image)+'"'+responsive+' width="'+p.width+'" height="'+p.height+'" loading="lazy" decoding="async" alt="'+esc(p.alt)+'">';
 const expanded=larger&&p.imageSmall;
 if(expanded)image='<a class="preview-link" href="images/projects/'+esc(p.image)+'" target="_blank" rel="noopener noreferrer" aria-label="View larger screenshot of '+esc(p.name)+' (opens in a new tab)">'+image+'</a>';
 return '<figure class="project-evidence">'+image+'<figcaption>'+esc(p.caption)+(expanded?' <span class="preview-hint">Select image for a larger preview (opens in a new tab).</span>':'')+'</figcaption></figure>';
}
function projectCategory(p){return esc(p.category)+(p.subcategory?' / '+esc(p.subcategory):'');}
// Replace only the homepage's PDF slot; portfolio records and their assets stay intact.
function projectCards(){return projects.filter(p=>p.visible&&p.featured).map(p=>p.id==='pdf-toolkit'?homeEnquiry:p).map(p=>`<article class="card project-card rv">${projectPreview(p)}<p class="tag">${esc(p.status)}</p><p class="project-category">${projectCategory(p)}</p><h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p><a class="more" href="${p.homeUrl?esc(p.homeUrl):'portfolio.html#'+p.id}"${p.homeUrl?' target="_blank" rel="noopener noreferrer"':''}>${p.homeLinkLabel?esc(p.homeLinkLabel):'View project details'}<span class="sr-only"> for ${esc(p.name)}${p.homeUrl?' (opens in a new tab)':''}</span> &rarr;</a></article>`).join('');}
function projectCases(){return projects.filter(p=>p.visible).map(p=>`<article class="card project-card case-study proj" id="${p.id}" data-cat="${p.categoryId}">${projectPreview(p,true)}<p class="tag">${esc(p.status)}</p><p class="project-category">${projectCategory(p)}</p><h2>${esc(p.name)}</h2>${p.presentation?'<p class="project-presentation">'+esc(p.presentation)+'</p>':''}<p>${esc(p.summary)}</p><p class="project-purpose">${esc(p.problem)}</p><a class="more" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.linkLabel)}<span class="sr-only">: ${esc(p.name)} (opens in a new tab)</span> &nearr;</a></article>`).join('');}
function projectFilters(){return [{id:'all',label:'All projects'},...Array.from(new Map(projects.filter(p=>p.visible).map(p=>[p.categoryId,{id:p.categoryId,label:p.category}])).values())].map(c=>`<button type="button" data-filter="${c.id}" aria-pressed="${c.id==='all'}">${esc(c.label)}</button>`).join('');}
function person(p,compact){const portrait=data('portraits')[p.image];return `<${compact?'div':'article'} class="card team-card rv"><div class="avatar-photo"><img src="images/portraits/${p.image}.webp" width="${portrait.width}" height="${portrait.height}" alt="${esc(p.name)}" loading="lazy" decoding="async"></div><${compact?'h3':'h2'}>${esc(p.name)}</${compact?'h3':'h2'}><p class="team-role">${esc(p.role)}</p>${compact?'':`<p>${esc(p.description)}</p>${p.github?`<a class="more" href="${esc(p.github)}" rel="noopener">GitHub profile</a>`:''}`}</${compact?'div':'article'}>`;}
function pricingCards(){return plans.map(p=>`<article class="card plan"><h3>${esc(p.label)}</h3><p>${esc(p.description)}</p><p class="price">${esc(p.price)} <small>${esc(p.qualifier)}</small></p><ul class="checks">${p.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><a class="btn${p.id==='business'?'':' ghost'}" href="get-quote.html?plan=${p.id}">Request a consultation<span class="sr-only"> about ${esc(p.label)}</span></a></article>`).join('');}
function questions(){return data('faq').map(q=>({'@type':'Question',name:q.name,acceptedAnswer:{'@type':'Answer',text:q.commercial?commercial[q.commercial]:q.acceptedAnswer.text}}));}
function faqMarkup(){return questions().map(q=>`<details><summary>${esc(q.name)}</summary><p>${esc(q.acceptedAnswer.text)}</p></details>`).join('');}
function tokens(file){return {EMAIL:esc(site.email),TELEPHONE:esc(site.telephone),PHONE_DISPLAY:esc(site.phoneDisplay),WHATSAPP:esc(site.whatsapp),GITHUB:esc(site.github),ADDRESS:esc(site.address),LOCATION:esc(site.location),HOURS:esc(site.hours),CONTACT_FORM:esc(site.forms.contact),QUOTE_FORM:esc(site.forms.quote),MAIN_NAV:nav('main',file),COMPANY_NAV:nav('company',file),SERVICE_NAV:nav('service',file),PROJECT_FILTERS:projectFilters(),PROJECT_CARDS:projectCards(),PROJECT_CASES:projectCases(),TEAM_PREVIEW:team.map(p=>person(p,true)).join(''),TEAM_CARDS:team.map(p=>person(p,false)).join(''),SERVICE_CARDS:services.filter(s=>s.featured).map(s=>`<article class="card"><div class="ico" aria-hidden="true">${icon(s.icon)}</div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><a class="more" href="${s.file}">Explore ${esc(s.name.toLowerCase())} &rarr;</a></article>`).join(''),PRICING_CARDS:pricingCards(),SUPPORT:esc(commercial.support),PAYMENTS:esc(commercial.payment),COSTS:esc(commercial.costs),FAQ:faqMarkup(),PACKAGES_JSON:json(Object.fromEntries(plans.map(p=>[p.id,{label:p.label,summary:p.summary}])))};}
function render(source,values){return source.replace(/\{\{icon:([a-z]+)\}\}/g,(_,name)=>icon(name)).replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(!(key in values))throw Error('Unknown template value '+key);return values[key];});}
const organization={'@context':'https://schema.org','@type':'Organization',name:site.name,url:site.url,email:site.email,telephone:site.telephone,address:{'@type':'PostalAddress',addressLocality:'Lahore',addressCountry:'PK'},sameAs:[site.github]};
const outputs={};
for(const [file,page] of Object.entries(pages)){
 if(!/^[a-z0-9-]+\.html$/.test(file)||typeof page.title!=='string'||!page.title.trim()||typeof page.description!=='string'||!page.description.trim())throw Error('Invalid filename or missing page metadata: '+file);
 const values=tokens(file);values.ROBOT=read('src/assets/robot.svg');values.WEEKENDS=esc(site.weekends);
 values.SERVICE_JUMPS=services.map(s=>`<a href="#${s.id}">${esc(s.name)}</a>`).join('');
 values.SERVICE_DETAILS=services.map(s=>`<article class="svc rv" id="${s.id}"><div class="ico" aria-hidden="true">${icon(s.icon)}</div><div><h2>${esc(s.name)}</h2><p>${esc(s.description)}</p><a class="more" href="get-quote.html">Request a consultation</a></div><ul class="checks">${s.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul></article>`).join('');
 const pageUrl=site.url+(file==='index.html'?'/':'/'+file);
 const schemas=[organization,...page.schemas];if(file==='faq.html')schemas.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:questions()});
 Object.assign(values,{TITLE:esc(page.title),DESCRIPTION:esc(page.description),OG_TYPE:page.type,PAGE_URL:pageUrl,SOCIAL_IMAGE:site.url+'/images/social-preview.png',CANONICAL:file==='404.html'?'':`<link rel="canonical" href="${pageUrl}">`,ROBOTS:file==='404.html'?'<meta name="robots" content="noindex">':'',
 BASE:file==='404.html'?`<base href="${site.url}/"><script>document.querySelector('base').setAttribute('href', location.hostname === ${json(site.previewHost)} || location.pathname.indexOf(${json(site.previewPath)}) === 0 ? ${json(site.previewPath)} : '/');</script><noscript><style>.js-recovery{display:none}</style></noscript>`:'',
 FALLBACK_STYLE:file==='404.html'?'<style>body{margin:0;background:#0B1E2D;color:#E6E0D0;font:1rem/1.65 system-ui,sans-serif}a{color:#3FD0CB}h1,h2{color:#F4EEDD}</style>':'',
 SCHEMA:schemas.map(s=>`<script type="application/ld+json">${json(s)}</script>`).join('\n'),HEADER:render(read('src/layout/header.html'),values),FOOTER:render(read('src/layout/footer.html'),values),CONTENT:render(read('src/pages/'+file),values)});
 outputs[file]=render(read('src/layout/document.html'),values);
 if(/\{\{[A-Za-z_]/.test(outputs[file]))throw Error('Unresolved template in '+file);
}
// Page bodies are rendered before replacing only the verified generated directory.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const [file,source] of Object.entries(outputs))fs.writeFileSync(path.join(out,file),source);
for(const file of ['style.css','script.js'])fs.copyFileSync(path.join(root,'src/assets',file),path.join(out,file));
const assets=['images/favicon.png','images/social-preview.png',...team.map(p=>`images/portraits/${p.image}.webp`),...projects.filter(p=>p.visible&&p.image).flatMap(p=>[p.image,p.imageSmall].filter(Boolean).map(f=>`images/projects/${f}`)),...[homeEnquiry.image,homeEnquiry.imageSmall].map(f=>`images/projects/${f}`),...['bricolage-latin.woff2','dm-sans-latin.woff2','bricolagegrotesque-OFL.txt','dmsans-OFL.txt'].map(f=>'images/fonts/'+f)];
for(const asset of assets){const dest=path.join(out,asset);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,asset),dest);}
fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(pages).filter(f=>f!=='404.html').map(f=>`<url><loc>${site.url}${f==='index.html'?'/':'/'+f}</loc></url>`).join('')}</urlset>\n`);
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log(`Built ${Object.keys(outputs).length} complete HTML pages in dist/; development references excluded.`);
