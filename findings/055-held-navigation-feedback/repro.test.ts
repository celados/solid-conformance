import {test, expect} from 'bun:test'
import {withClientPage} from '../../harness/client-page'
test('a held navigation publishes delayed feedback before its route commits', async () => {
 await withClientPage('findings/055-held-navigation-feedback/client.tsx', async (page, messages) => {
  await page.getByRole('button').click()
  await page.waitForTimeout(400)
  const before = {status: await page.getByRole('status').count(), text: await page.locator('p').textContent(), url: await page.evaluate(() => window.navigationURL())}
  await page.evaluate(() => window.releaseNavigation())
  await page.getByText('new', {exact: true}).waitFor()
  expect(messages).toEqual([])
  expect(before).toEqual({status: 1, text: 'old', url: '/'})
  expect(await page.getByRole('status').count()).toBe(0)
 })
}, 30000)
