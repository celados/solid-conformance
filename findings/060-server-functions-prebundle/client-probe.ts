import { configureServerFunctionsClient as main } from '@solidjs/web/server-functions'
import { configureServerFunctionsClient as child } from '@solidjs/web/server-functions/client'

globalThis.prebundleProbe = { ready: true, settled: false, sameConfigure: main === child }

declare global {
  var prebundleProbe: { ready: boolean; settled: boolean; sameConfigure: boolean; value?: string; error?: string }
}
