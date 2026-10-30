const {HtmlValidate}=require('html-validate');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
  const root=path.resolve(__dirname,'../dist');
  // Standards rules check markup/content models; omit source-format preferences.
  const validator=new HtmlValidate({extends:['html-validate:standard'],rules:{'void-style':'off','no-trailing-whitespace':'off'}});
  const files=fs.readdirSync(root,{recursive:true}).filter(f=>/\.html?$/.test(f)).map(f=>f.replaceAll('\\','/'));
  const results=[];
  for(const file of files){
    const report=await validator.validateFile(path.join(root,file));
    for(const result of report.results) for(const m of result.messages) results.push({file,line:m.line,rule:m.ruleId,message:m.message});
  }
  console.log(JSON.stringify({files:files.length,issues:results},null,2));
  if(results.length) process.exitCode=1;
})();
