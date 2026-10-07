import { realpath } from 'node:fs/promises'

export async function runtimeReceipt() {
	const resolved = await realpath('node_modules/solid-js')
	const head = resolved.includes('/.upstream/')
	if ((process.env.TARGET ?? 'head') === 'head' && !head)
		throw new Error('HEAD is the primary target. Run bun run upstream first; use TARGET=rc13 for the baseline.')
	if (process.env.TARGET === 'rc13' && head)
		throw new Error('Baseline requested with HEAD linked. Run bun run upstream --restore.')
	return {
		target: head ? 'head' : 'rc13',
		upstream: head ? await Bun.file('.upstream/active.json').json() : null,
		buildMode: process.env.BUILD_MODE ?? 'development',
		solid: (await Bun.file('node_modules/solid-js/package.json').json()).version,
	}
}
