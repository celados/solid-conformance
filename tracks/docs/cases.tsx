import { isServer } from '@solidjs/web'
import { remainingCoreCases } from './remaining-core-cases'
import { diagnosticCases } from './diagnostic-cases'
import { attributionCases } from './attribution-cases'
import { serverDiagnosticCases } from './server-diagnostic-cases'
import { clientDiagnosticCases } from './client-diagnostic-cases'
import { coreCases } from './core-cases'
import { httpCases } from './http-cases'
import { rpcCases } from './rpc-cases'
import { renderCases } from './render-cases'
import { runCases, type DocResult } from './registry'
export async function runDocCases() {
	const serverOnly = new Set(['03/client-only-ssr','05/client-source-ssr','05/declared-client-ssr'])
	return runCases([...serverDiagnosticCases, ...(isServer ? [] : coreCases), ...renderCases, ...httpCases, ...rpcCases, ...diagnosticCases, ...clientDiagnosticCases, ...attributionCases, ...(isServer ? [] : remainingCoreCases)].filter(c =>
		isServer ? c.id !== '12/client-http-noop' : !serverOnly.has(c.id)))
}
export function docsCase() {
	const docs: DocResult[] = []
	return { App: () => <span>docs</span>, streams: [], docs, async settle() { if (!isServer) docs.push(...await runDocCases()) } }
}
