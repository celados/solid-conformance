import { isServer } from '@solidjs/web'
import { coreCases } from './core-cases'
import { httpCases } from './http-cases'
import { rpcCases } from './rpc-cases'
import { renderCases } from './render-cases'
import { runCases, type DocResult } from './registry'
export async function runDocCases() { return runCases([...(isServer ? [] : coreCases), ...renderCases, ...httpCases, ...rpcCases]) }
export function docsCase() {
	const docs: DocResult[] = []
	return { App: () => <span>docs</span>, streams: [], docs, async settle() { if (!isServer) docs.push(...await runDocCases()) } }
}
