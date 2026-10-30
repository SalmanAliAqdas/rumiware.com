const {test,expect}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {apacheRules,routes}=require('../scripts/routes.cjs');
const root=path.resolve(__dirname,'..');
const block=()=>fs.readFileSync(path.join(root,'config/clean-url-redirects.conf'),'utf8').replace(/\r\n/g,'\n');

test('canonical host rules retain raw encoded paths, queries and a fixed destination (configuration fixture, not Apache)',()=>{
 const source=block();
 const hostLine=source.match(/RewriteCond %\{HTTP_HOST\} (\S+) \[NC\]/);expect(hostLine).not.toBeNull();
 const host=new RegExp(hostLine[1],'i');
 const requestLine=source.match(/RewriteCond %\{THE_REQUEST\} "([^"\n]+)"\nRewriteRule \^ https:\/\/rumiware\.com%1 \[R=301,L,NE\]/);expect(requestLine).not.toBeNull();
 const request=new RegExp(requestLine[1]);
 for(const value of ['/','/services/','/blog/future-of-ai/','/images/favicon.png','/a%20b%26c?q=two%20words%26more&plan=business','/a%2520b?q=%2526','/a%23b?q=%3F','//elsewhere.invalid/path']){
  const match=request.exec('GET '+value+' HTTP/1.1');expect(match).not.toBeNull();
  const suffix=value.includes('?')?value.slice(value.indexOf('?')):'';
  const location='https://rumiware.com'+match[1]+suffix;
  expect(location).toBe('https://rumiware.com'+value);expect(new URL(location).host).toBe('rumiware.com');
 }
 for(const value of ['www.rumiware.com','WWW.RUMIWARE.COM'])expect(host.test(value)).toBe(true);
 for(const value of ['rumiware.com','localhost','www.rumiware.com.evil.invalid','evilwww.rumiware.com','salmanaliaqdas.github.io'])expect(host.test(value)).toBe(false);
 expect(source).not.toMatch(/HTTP_X_FORWARDED|%\{HTTPS\}|QSD|HTTP_HOST\}[^\n]*\nRewriteRule[^\n]*HTTP_HOST/);
 expect(source).toContain('ErrorDocument 404 /404.html');
});

test('known legacy URLs target final non-www clean URLs before the host fallback',()=>{
 const source=block();expect(source).toBe(apacheRules());
 const fallback=source.indexOf('RewriteCond %{HTTP_HOST}');
 for(const [file,route] of Object.entries(routes).filter(([f])=>f!=='404.html')){
  const pattern=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const rule='RewriteRule ^'+pattern+'$ https://rumiware.com'+route+' [R=301,L,NE]';
  expect(source).toContain(rule);expect(source.indexOf(rule)).toBeLessThan(fallback);
 }
 expect(source).not.toMatch(/RewriteRule.*https:\/\/www\./);
});

test('reviewed deployment transition matches generated configuration and inspected baseline',()=>{
 const helper=fs.readFileSync(path.join(root,'scripts/hostinger-remote.py'),'utf8');
 const digest=crypto.createHash('sha256').update(block()).digest('hex');
 expect(helper).toContain("'8a51280002cd38ebe9f6cb4ff559d92a1bedc970a99eed99195ab1458d03d654'");expect(helper).toContain("'"+digest+"'");
 expect(helper).toContain("name == '.htaccess' and (digest(dest), digest(path)) == REVIEWED_HTACCESS_TRANSITION");
});
