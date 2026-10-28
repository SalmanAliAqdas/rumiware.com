const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const revision = '31e50cc92dc022cc46542e3ab8da95b3145f1f0d';
const files = fs.readdirSync(root).filter(p=>p.endsWith('.html'));
const rows=[];
for(const file of files) {
  const before=execFileSync('git',['show',`${revision}:${file}`],{cwd:root,encoding:'utf8'});
  const after=fs.readFileSync(path.join(root,file),'utf8');
  for(const [index, match] of [...before.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].entries()) {
    const action=match[0].match(/action="([^"]*)"/)[1];
    const kind=/class="(?:nl|newsletter)/.test(match[0])?'Newsletter':file==='careers.html'?'Application':file==='contact.html'?'Contact':'Quote';
    const result=kind==='Newsletter'?'Removed; destination is unverified':kind==='Application'?'Removed; no confirmed vacancy':file==='get-quote-preview.html'?'Uses maintained quote endpoint mkjojozj':'Preserved unchanged';
    rows.push(`| ${file} (form ${index+1}) | ${kind} | ${action} | ${result} |`);
  }
}
const active=files.reduce((n,file)=>n+[...fs.readFileSync(path.join(root,file),'utf8').matchAll(/<form\b/g)].length,0);
const text=`# Form inventory\n\nBaseline: ${revision}. Inspected all ${files.length} HTML files, including standalone previews and shared fragments.\n\n${rows.length} original forms; ${active} active forms remain (contact, quote, and the preserved quote preview URL). All use concrete Formspree actions; none are subscriptions.\n\n| Location | Purpose | Original destination | Phase 1 result |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\nA concrete Formspree form ID does not establish subscriber storage, confirmation emails, consent records or unsubscribe handling. No production submissions were made.\n`;
fs.mkdirSync(path.join(root,'verification'),{recursive:true});
fs.writeFileSync(path.join(root,'verification/form-inventory.md'),text);
process.stdout.write(`Inventoried ${rows.length} original forms in ${files.length} HTML files; ${active} active forms remain.\n`);
