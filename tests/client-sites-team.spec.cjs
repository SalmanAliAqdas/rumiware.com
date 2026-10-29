const {test,expect}=require('@playwright/test');
const team=require('../src/data/team.json');

test('client websites use the Websites filter, authentic responsive previews and exact buttons',async({page})=>{
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount+'portfolio.html');
  const filter=page.getByRole('button',{name:'Websites',exact:true});await filter.focus();await filter.press('Space');
  await expect(filter).toHaveAttribute('aria-pressed','true');await expect(page.locator('.proj:visible')).toHaveCount(2);
  await expect(page.locator('#project-count')).toHaveText('2 projects shown');
  for(const [id,title,category,technology,url,image] of [
   ['rumi-dental-care','Rumi Dental Care','Healthcare','WordPress','https://rumidentalcare.com/','rumi-dental-care'],
   ['mani-bakes','Mani Bakes','Food & Bakery','HTML, CSS, JavaScript','https://rumi-ware.github.io/Mani-Bakes/','mani-bakes-home']
  ]){
   const card=page.locator('#'+id);await expect(card.locator('h2')).toHaveText(title);
   await expect(card.locator('.project-category')).toHaveText('Websites / '+category);await expect(card).toContainText('Technologies: '+technology);
   const visit=card.getByRole('link',{name:new RegExp('Visit Website\\s*:\\s*'+title)});
   await expect(visit).toHaveAttribute('href',url);await expect(visit).toHaveAttribute('target','_blank');await expect(visit).toHaveAttribute('rel','noopener noreferrer');
   await visit.focus();await expect(visit).toBeFocused();expect(await visit.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
   const img=card.locator('img');await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());
   await expect(img).toHaveAttribute('width','1280');await expect(img).toHaveAttribute('height','800');
   await expect(img).toHaveAttribute('srcset',new RegExp(image+'-640\\.webp 640w'));
   expect(await img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
   await expect(card.locator('figcaption')).toContainText('Public');
  }
  await expect(page.locator('#rumi-dental-care a.more')).toHaveCount(1);
  await expect(page.locator('#rumi-dental-care a[href*="github.com"]')).toHaveCount(0);
  await expect(page.locator('#mani-bakes a.more')).toHaveCount(2);
  await expect(page.locator('#mani-bakes').getByRole('link',{name:/View Code\s*:\s*Mani Bakes/})).toHaveAttribute('href','https://github.com/Rumi-Ware/Mani-Bakes');
  await page.getByRole('button',{name:'All projects',exact:true}).click();await expect(page.locator('.proj:visible')).toHaveCount(11);
  await page.goto(mount);await expect(page.locator('.home-work h3')).toHaveText(['Rumiware SchoolOS','Rumi Enquiry Assistant','Rumiware Expense Tracker']);
  await expect(page.locator('.home-work')).not.toContainText(/Rumi Dental Care|Mani Bakes/);
 }
});

test('team links belong to the correct existing person and preserve profiles',async({page})=>{
 for(const mount of ['/','/rumiware.com/']){
  await page.goto(mount+'team.html');await expect(page.locator('article.team-card')).toHaveCount(4);
  for(const person of team){
   const card=page.locator('article.team-card').filter({has:page.getByRole('heading',{name:person.name,exact:true})});
   await expect(card).toHaveCount(1);await expect(card.locator('.team-role')).toHaveText(person.role);await expect(card).toContainText(person.description);
   await expect(card.locator('img')).toHaveAttribute('src','images/portraits/'+person.image+'.webp');
   for(const [platform,url] of [['GitHub',person.github],['LinkedIn',person.linkedin]])if(url){
    const link=card.getByRole('link',{name:person.name+"'s "+platform+' profile (opens in a new tab)',exact:true});
    await expect(link).toHaveAttribute('href',url);await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');
    await link.focus();await expect(link).toBeFocused();expect(await link.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
   }
  }
  const salman=page.locator('article.team-card').filter({has:page.getByRole('heading',{name:'Salman Ali Aqdas',exact:true})});
  await expect(salman.locator('.team-role')).toHaveText('Founder & CEO');
  const linkedin=[['Hassan','https://www.linkedin.com/in/hassan-alee/'],['Hussain','https://www.linkedin.com/in/hafiz-hussain-ali/'],['Salman Ali Aqdas','https://www.linkedin.com/in/salmanaliaqdas/']];
  for(const [name,url] of linkedin)await expect(page.getByRole('link',{name:name+"'s LinkedIn profile (opens in a new tab)",exact:true})).toHaveAttribute('href',url);
  await page.goto(mount);await expect(page.locator('a[href*="linkedin.com"]')).toHaveCount(0);
 }
});
