import { expect, test } from 'bun:test'
import { withClientPage } from '../../harness/client-page'

for (const first of ['left', 'right']) {
  test('independent requests commit separately when ' + first + ' resolves first', async () => {
    await withClientPage('tracks/transitions/independent-lanes.tsx', async (page, messages) => {
      const other = first === 'left' ? 'right' : 'left'
      for (const id of ['left', 'right']) await page.locator('#' + id).getByText('request', {exact:true}).click()
      await page.locator('#' + first).getByText('resolve', {exact:true}).click()
      await page.locator('#' + first).filter({hasText:'done'}).waitFor()
      expect(await page.locator('#' + other).innerText()).not.toContain('done')
      await page.locator('#' + other).getByText('resolve', {exact:true}).click()
      await page.locator('#' + other).filter({hasText:'done'}).waitFor()
      expect(messages).toEqual([])
    })
  },30000)
}
