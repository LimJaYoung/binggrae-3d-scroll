import { test, expect } from '@playwright/test';
test('real model responds to scroll, reverse scroll, drag, reset and zoom',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-model','ready');
 await page.screenshot({path:'output/web-desktop.png'});
 const initial=await page.evaluate(()=>window.getBottleState());
 await page.evaluate(()=>window.scrollTo({top:innerHeight,behavior:'instant'}));
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().progress)).toBeGreaterThan(.98);
 const moved=await page.evaluate(()=>window.getBottleState());expect(moved.x).toBeLessThan(-2);expect(moved.rotation).toBeGreaterThan(2.8);
 await page.screenshot({path:'output/web-scroll.png'});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().progress)).toBeLessThan(.02);
 await page.evaluate(()=>window.scrollTo({top:document.querySelector('#explore').offsetTop,behavior:'instant'}));
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().progress)).toBeGreaterThan(2.98);
 const before=await page.evaluate(()=>window.getBottleState().rotation);
 await page.mouse.move(720,550);await page.mouse.down();await page.mouse.move(950,600,{steps:10});await page.mouse.up();
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().rotation)).toBeGreaterThan(before+1);
 await page.locator('#reset').click();await expect.poll(async()=>page.evaluate(()=>window.getBottleState().rotation)).toBeCloseTo(Math.PI*2,1);
 await page.locator('#zoom').fill('1.3');await expect.poll(async()=>page.evaluate(()=>window.getBottleState().scale)).toBeGreaterThan(1);
 await page.locator('#spin').click();expect(await page.locator('#spin').getAttribute('aria-pressed')).toBe('true');
 await page.screenshot({path:'output/web-explore.png'});expect(errors).toEqual([]);expect(initial.loaded).toBe(true);
});
test('mobile viewport keeps model and controls available without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-model','ready');
 await page.screenshot({path:'output/web-mobile.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.locator('.nav-link').click();await expect(page.locator('#reset')).toBeInViewport();
 await page.screenshot({path:'output/web-mobile-explore.png'});
});

test('vertical and horizontal full turns remain unrestricted and reset restores orientation',async({page})=>{
 await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-model','ready');
 await page.evaluate(()=>window.scrollTo({top:document.querySelector('#explore').offsetTop,behavior:'instant'}));
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().progress)).toBeGreaterThan(2.999);
 const control=page.locator('[data-rotation-control]');await control.focus();
 for(let i=0;i<48;i++)await page.keyboard.press('ArrowDown');
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().verticalRotation)).toBeGreaterThan(Math.PI*2);
 for(let i=0;i<48;i++)await page.keyboard.press('ArrowRight');
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().rotation)).toBeGreaterThan(Math.PI*4);
 expect(await control.evaluate(el=>getComputedStyle(el).touchAction)).toBe('none');
 await page.locator('#reset').click();
 await expect.poll(async()=>page.evaluate(()=>window.getBottleState().verticalRotation)).toBe(0);
 await expect.poll(async()=>page.evaluate(()=>Math.abs(window.getBottleState().quaternion[3]))).toBeGreaterThan(.999);
});
