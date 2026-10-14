import { resolve } from 'node:path'
import { rm } from 'node:fs/promises'
import { chromium, type Page } from 'playwright'
import { build, type BuildMode } from '../scripts/build'
let sequence = 0
export async function withClientPage<T>(entry: string, run: (page: Page, messages: string[]) => Promise<T>, mode = (process.env.BUILD_MODE ?? 'development') as BuildMode): Promise<T> {
 const directory = resolve('.build', `focused-${process.pid}-${sequence++}`)
 await build(directory, mode, {client: [entry], server: []})
 const server = Bun.serve({hostname: '127.0.0.1', port: 0, fetch(request) {
  const path = new URL(request.url).pathname
  return path.endsWith('.js') ? new Response(Bun.file(directory + path), {headers: {'content-type': 'text/javascript'}}) : new Response(`<!doctype html><div id="app"></div><script type="module" src="/${entry.split("/").at(-1)!.replace(/\.tsx$/, ".js")}"></script>`, {headers: {'content-type': 'text/html'}})
 }})
 try {
  const browser = await chromium.launch({channel: 'chrome', headless: true})
  try {
   const page = await browser.newPage()
   page.setDefaultTimeout(10000)
   const messages: string[] = []
   page.on('pageerror', error => messages.push(error.message))
   page.on('console', message => {if (message.type() === 'error' || message.type() === 'warning') messages.push(message.text())})
   await page.goto(String(server.url))
   return await run(page, messages)
  } finally {await browser.close()}
 } finally {server.stop(true); await rm(directory, {recursive: true, force: true})}
}
