// RFC 04 advertises storePath in solid-js; the browser entry omits it.
// @ts-expect-error Missing client export is the discrepancy under test.
import { storePath } from 'solid-js'
export const update = storePath('value', 1)
