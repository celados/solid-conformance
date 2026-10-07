import {registerServerReference,handleServerFunctionRequest} from '@solidjs/web/server-functions/server'
let release: (() => void) | undefined
let releasedEarly = false
export function releaseRouterRPC() { if(release) release(); else releasedEarly = true; return new Response('released') }
export function handleRouterRPC(request: Request) {
  const gate = new Promise<void>(resolve => { release = resolve; if(releasedEarly) {releasedEarly=false; resolve()} })
  registerServerReference('wave3-router-action', async (n: number) => {await gate; release=undefined; return n})
  return handleServerFunctionRequest(request)
}
