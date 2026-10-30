// Source page IDs stay stable; this is the single public URL/output mapping.
const routes=require('../src/data/routes.json');
const pages=require('../src/data/pages.json');
const site=require('../src/data/site.json');
if(Object.keys(routes).length!==Object.keys(pages).length||Object.keys(pages).some(p=>!Object.hasOwn(routes,p)))throw Error('Route mapping must cover every source page');
if(new Set(Object.values(routes)).size!==Object.keys(routes).length)throw Error('Duplicate public route');
for(const [file,route] of Object.entries(routes))if(file!=='404.html'&&!/^\/(?:[a-z0-9-]+\/)*$/.test(route))throw Error('Invalid canonical route: '+route);
const outputFile=file=>file==='404.html'?'404.html':routes[file].slice(1)+'index.html';
function cleanLink(value) {
 const absolute=value.startsWith(site.url+'/');
 const raw=absolute?value.slice(site.url.length+1):value.replace(/^\.\//,'');
 if(!absolute&&/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value))return value;
 const match=raw.match(/^([^?#]*)(.*)$/),file=match[1],suffix=match[2];
 if(!Object.hasOwn(routes,file)||file==='404.html')return value;
 return (absolute?site.url+routes[file]:routes[file].slice(1)||'./')+suffix;
}
const redirects=new Map();
for(const [file,route] of Object.entries(routes))if(file!=='404.html') {
 redirects.set('/'+file,route);
 if(route!=='/')redirects.set(route+'index.html',route);
}
function redirectFor(pathname) {
 if(redirects.has(pathname))return redirects.get(pathname);
 if(pathname!=='/'&&Object.values(routes).includes(pathname+'/'))return pathname+'/';
 return null;
}
function apacheRules() {
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return '# BEGIN RumiWare clean URLs\n<IfModule mod_rewrite.c>\nRewriteEngine On\n'+[...redirects].map(([old,route])=>
  '# External requests only: internal DirectoryIndex resolution must not redirect.\n'+
  'RewriteCond %{THE_REQUEST} "\\s/+'+escape(old.slice(1))+'(?:[?\\s])" [NC]\n'+
  'RewriteRule ^'+escape(old.slice(1))+'$ '+route+' [R=301,L,NE]\n').join('\n')+'</IfModule>\nErrorDocument 404 /404.html\n# END RumiWare clean URLs\n';
}
module.exports={routes,outputFile,cleanLink,redirectFor,apacheRules};
