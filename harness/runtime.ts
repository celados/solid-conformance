import { realpath } from 'node:fs/promises'

export async function runtimeReceipt() {
	const resolved = await realpath('node_modules/solid-js')
	const head = resolved.includes('/.upstream/')
	if ((process.env.TARGET ?? 'head') === 'head' && !head)
		throw new Error('HEAD is the primary target. Run bun run upstream first; use TARGET=rc15 for the baseline.')
	if (process.env.TARGET?.startsWith('rc') && head)
		throw new Error('Baseline requested with HEAD linked. Run bun run upstream --restore.')
	const version = (await Bun.file('node_modules/solid-js/package.json').json()).version
	if (process.env.TARGET?.startsWith('rc') && version !== `2.0.0-${process.env.TARGET.replace('rc', 'rc.')}`)
		throw new Error(`Requested ${process.env.TARGET}, installed ${version}`)
	return {
		target: head ? 'head' : version.replace('2.0.0-rc.', 'rc'),
		upstream: head ? await Bun.file('.upstream/active.json').json() : null,
		buildMode: process.env.BUILD_MODE ?? 'development',
		solid: version,
		router: (await Bun.file('node_modules/@solidjs/router/package.json').json()).version,
		routerHead: (await realpath('node_modules/@solidjs/router')).includes('/.scratch/router/') ? await Bun.file('.upstream/router-built.json').json() : null,
	}
}
