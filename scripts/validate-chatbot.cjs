const {normalize}=require('../src/assets/chatbot-resolver.js');
const site=require('../src/data/site.json');
const pages=require('../src/data/pages.json');
const projects=require('../src/data/projects.json');
const allowedExternal=new Set([site.whatsapp,...projects.filter(p=>p.visible).map(p=>p.url)]);
module.exports=function validate(entries) {
 const ids=new Set(),variants=new Map();
 if(!/^https:\/\/wa\.me\/\d+$/.test(site.whatsapp))throw Error('Invalid configured WhatsApp destination');
 if(!Array.isArray(entries)||!entries.length)throw Error('Empty chatbot content');
 for(const e of entries) {
  if(!/^[a-z0-9-]+$/.test(e.id)||ids.has(e.id))throw Error('Invalid or duplicate chatbot ID: '+e.id);
  ids.add(e.id);
  for(const field of ['category','question','answer'])if(typeof e[field]!=='string'||!e[field].trim())throw Error('Empty chatbot '+field+': '+e.id);
  if(!Array.isArray(e.alternates)||e.alternates.length<2)throw Error('Missing alternate phrasings: '+e.id);
  for(const value of [e.question,...e.alternates]) {
   if(typeof value!=='string'||!normalize(value))throw Error('Empty chatbot variant: '+e.id);
   const normalized=normalize(value),previous=variants.get(normalized);
   if(previous&&previous!==e.id)throw Error('Conflicting chatbot variants: '+previous+' / '+e.id);
   variants.set(normalized,e.id);
  }
  for(const link of e.links||[]) {
   if(!link.label?.trim()||typeof link.url!=='string')throw Error('Invalid chatbot link: '+e.id);
   if(allowedExternal.has(link.url)) {
    const url=new URL(link.url);
    if(url.protocol!=='https:'||url.username||url.password)throw Error('Unsafe chatbot destination: '+link.url);
    continue;
   }
   const [file,hash]=link.url.split('#');
   if(!Object.hasOwn(pages,file)&&!Object.hasOwn(pages,file+'index.html'))throw Error('Untrusted chatbot destination: '+link.url);
   if(hash&&!require('node:fs').readFileSync(require('node:path').join(__dirname,'../src/pages',file),'utf8').includes('id="'+hash+'"')&&!projects.some(p=>p.visible&&p.id===hash)&&!require('../src/data/services.json').some(s=>s.id===hash))throw Error('Invalid chatbot anchor: '+link.url);
  }
 }
 return {entries:entries.length,categories:new Set(entries.map(e=>e.category)).size};
};
