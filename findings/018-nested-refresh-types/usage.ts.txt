import { createStore, refresh } from 'solid-js'
const [store] = createStore(() => ({ row: { n: 1 } }), { row: { n: 0 } })
void refresh(store.row)
