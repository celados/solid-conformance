import { expect, test } from 'bun:test'
import { withClientPage } from '../../harness/client-page'
import type { ProbeResult } from './client'

for (const lifecycle of ['settled', 'cleanup'] as const) {
  for (const control of ['show', 'for'] as const) {
    test(`${control}: ${lifecycle} cleanup can release shared reactive state`, async () => {
      await withClientPage('findings/058-list-cleanup-write/client.tsx', async (page, messages) => {
        const result = await page.evaluate(async options => {
          const api = window as typeof window & { runCleanupProbe: (input: typeof options) => Promise<ProbeResult> }
          return api.runCleanupProbe(options)
        }, { control, lifecycle })
        console.log(JSON.stringify({ control, lifecycle, result, messages }))
        expect(result.errors).toEqual([])
        expect(messages).toEqual([])
        expect(result.releases).toBe(1)
        expect(result.removed).toBe(control === 'for' ? 1 : 0)
        expect(result.appended).toBe(control === 'for' ? 2 : 1)
      })
    }, 30000)
  }
}

test('For ownedWrite control can remove a row and continue updating', async () => {
  await withClientPage('findings/058-list-cleanup-write/client.tsx', async (page, messages) => {
    const result = await page.evaluate(async () => {
      const api = window as typeof window & { runCleanupProbe: (input: { control: 'for'; lifecycle: 'settled'; ownedWrite: true }) => Promise<ProbeResult> }
      return api.runCleanupProbe({ control: 'for', lifecycle: 'settled', ownedWrite: true })
    })
    expect(messages).toEqual([])
    expect(result).toEqual({ errors: [], releases: 1, removed: 1, appended: 2 })
  })
}, 30000)

for (const nestedCleanup of [false, true]) {
  test.skipIf(process.env.BUILD_MODE === 'production')(`owned computation writes remain forbidden (inside cleanup: ${nestedCleanup})`, async () => {
    await withClientPage('findings/058-list-cleanup-write/client.tsx', async page => {
      const error = await page.evaluate(nested => {
        const api = window as typeof window & { runWriteGuardProbe: (insideCleanup: boolean) => string | undefined }
        return api.runWriteGuardProbe(nested)
      }, nestedCleanup)
      expect(error).toContain('[REACTIVE_WRITE_IN_OWNED_SCOPE]')
    })
  }, 30000)
}
