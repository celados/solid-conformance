import { lazy } from 'solid-js'
import { renderToStream } from '@solidjs/web'
export async function sample(sync: boolean) {
  const error = new Error('resolver-failed')
  const Part = lazy(async () => ({ default: () => <span>available</span> }), undefined, 'part.tsx')
  try {
    const html = await renderToStream(() => <Part/>, { manifest: () => {
      if (sync) throw error
      return Promise.reject(error)
    } })
    return { rendered: html.includes('available'), error: null }
  } catch (caught) { return { rendered: false, error: caught === error ? error.message : String(caught) } }
}
