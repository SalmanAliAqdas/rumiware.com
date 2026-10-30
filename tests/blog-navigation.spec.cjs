const {test,expect}=require('@playwright/test');

const labels=['Home','Services','Portfolio','Pricing','About','Meet the Team','Blog','Contact'];

for(const theme of ['dark','light'])test(`Blog navigation works on desktop and mobile in ${theme} theme`,async({page})=>{
  await page.addInitScript(theme=>localStorage.setItem('rw-theme',theme),theme);
  for(const mount of ['/','/rumiware.com/'])for(const width of [375,1100,1280,1440]){
    await page.setViewportSize({width,height:900});await page.goto(mount);
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await expect(page.locator('#nav a')).toHaveText(labels);
    const blog=page.locator('#nav a[href$="blog/"]');await expect(blog).toHaveCount(1);
    const menu=page.locator('#menuBtn');
    if(width<1100){await expect(page.locator('#nav')).toBeHidden();await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');}
    else{
      await expect(menu).toBeHidden();await expect(page.locator('#nav')).toBeVisible();
      const fits=await page.evaluate(()=>{
        const logo=document.querySelector('header .logo').getBoundingClientRect(),nav=document.querySelector('#nav').getBoundingClientRect(),tools=document.querySelector('.tools').getBoundingClientRect();
        return logo.right<=nav.left&&nav.right<=tools.left&&document.documentElement.scrollWidth<=innerWidth;
      });expect(fits,`${mount} at ${width}px`).toBe(true);
      for(const link of await page.locator('#nav a').all())expect(await link.evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(44);
    }
    await blog.click();await expect(page).toHaveURL(new RegExp(mount+'blog/$'));
    await expect(page.locator('.crumbs [aria-current="page"]')).toHaveText('Blog');
    if(width<1100){
      await expect(menu).toHaveAttribute('aria-expanded','false');await expect(page.locator('#nav')).toBeHidden();await menu.click();
    }
    await expect(page.locator('#nav [aria-current="page"]')).toHaveText('Blog');
    expect(await blog.evaluate(el=>getComputedStyle(el).textDecorationLine)).toContain('underline');
    if(width<1100){await page.keyboard.press('Escape');await expect(menu).toBeFocused();await expect(page.locator('#nav')).toBeHidden();}
  }
});
