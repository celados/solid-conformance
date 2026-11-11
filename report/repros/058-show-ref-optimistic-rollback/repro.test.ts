import {test, expect} from 'bun:test'
import {chromium} from 'playwright'
import {build} from './build'
test('restores the branch after an optimistic hide', async () => {
 await build({client:['app.tsx'],server:[]})
 const server = Bun.serve({hostname:'127.0.0.1',port:0,fetch(request) {
  return new URL(request.url).pathname === '/app.js'
   ? new Response(Bun.file('.build/app.js'),{headers:{'content-type':'text/javascript'}})
   : new Response('<div id="root"></div><script type="module" src="/app.js"></script>',{headers:{'content-type':'text/html'}})
 }})
 const browser = await chromium.launch({channel:'chrome',headless:true})
 try {
  const page = await browser.newPage(), errors:string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => {if (m.type() === 'error') errors.push(m.text())})
  await page.goto(String(server.url))
  await page.locator('span').waitFor()
  await page.evaluate(() => { (window as any).hide() })
  await page.locator('span').waitFor({state:'detached'})
  await page.evaluate(() => { (window as any).release() })
  await page.waitForTimeout(100)
  console.log(JSON.stringify({html: await page.locator('#root').innerHTML(), errors}, null, 2))
  expect(errors).toEqual([])
  expect(await page.locator('span').count()).toBe(1)
  expect(await page.locator('span').getAttribute('title')).toBe('1')
 } finally {await browser.close();server.stop(true)}
},30000)
