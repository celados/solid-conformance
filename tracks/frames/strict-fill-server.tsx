import { RequestContext } from '@solidjs/web'
import {
	frameTransformResult,
	frameTransformDirectResult,
	frameTransformFlightResult,
} from '@solidjs/web/frames/server'
import {
	configureServerFunctionsServer,
	registerServerReference,
	handleServerFunctionRequest,
	GET,
	createServerReference,
} from '@solidjs/web/server-functions/server'
import { AsyncLocalStorage } from 'node:async_hooks'
;(globalThis as any)[RequestContext] = new AsyncLocalStorage()
configureServerFunctionsServer({
	transformResult: frameTransformResult,
	transformDirectResult: frameTransformDirectResult,
	transformFlightResult: frameTransformFlightResult,
})
GET(
	createServerReference(
		registerServerReference('strict-fill', (family: string) => (p: any) => {
			if (family === 'binding') {
				const row = p.row({ n: 1 })
				return <span>{row.title}</span>
			}
			return (
				<div>
					<p.comment n={1} />
				</div>
			)
		}),
	),
)
export function handle(request: Request) {
	return handleServerFunctionRequest(request, { onError() {} })
}
