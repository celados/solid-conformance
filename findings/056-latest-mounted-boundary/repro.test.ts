import {test, expect} from 'bun:test'
import {withClientPage} from '../../harness/client-page'
test('a latest-mounted Loading shows fallback beside the committed value during an action hold', async () => {
 await withClientPage('findings/056-latest-mounted-boundary/client.tsx', async (page, messages) => {
  await page.getByRole('button').click()
  await page.waitForTimeout(50)
  const before = await page.locator('#app').textContent()
  await page.evaluate(() => window.releaseMount())
  await page.waitForFunction(() => document.querySelector('i')?.textContent === '1')
  expect(messages).toEqual([])
  expect(before).toBe('save0pending')
  expect(await page.locator('#app').textContent()).toBe('save11')
 })
}, 30000)
