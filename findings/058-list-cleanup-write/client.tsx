import { render } from '@solidjs/web'
import { createMemo, createSignal, flush, For, onCleanup, onSettled, Show, untrack } from 'solid-js'

type ProbeOptions = {
  control: 'for' | 'show'
  lifecycle: 'settled' | 'cleanup'
  ownedWrite?: boolean
}

export type ProbeResult = {
  errors: string[]
  releases: number
  removed: number
  appended: number
}

const host = document.getElementById('app')!

async function run(options: ProbeOptions): Promise<ProbeResult> {
  const [rows, setRows] = createSignal([1, 2])
  const [visible, setVisible] = createSignal(true)
  const [releases, setReleases] = createSignal(0, { ownedWrite: options.ownedWrite })
  const errors: string[] = []

  function Row() {
    const release = () => setReleases(value => value + 1)
    if (options.lifecycle === 'settled') onSettled(() => release)
    else onCleanup(release)
    return <i>row</i>
  }

  const dispose = render(() => options.control === 'for'
    ? <For each={rows()}>{() => <Row />}</For>
    : <Show when={visible()}><Row /></Show>, host)
  flush()
  await Promise.resolve()

  try {
    if (options.control === 'for') setRows([2])
    else setVisible(false)
    flush()
  } catch (error) {
    errors.push(String(error))
  }
  const removed = host.querySelectorAll('i').length
  try {
    if (options.control === 'for') setRows([2, 3])
    else setVisible(true)
    flush()
  } catch (error) {
    errors.push(String(error))
  }
  const result = { errors, releases: untrack(releases), removed, appended: host.querySelectorAll('i').length }
  try { dispose() } catch { /* Preserve the first failed operation's result. */ }
  return result
}

;(window as typeof window & { runCleanupProbe: typeof run }).runCleanupProbe = run

function guard(nestedCleanup: boolean): string | undefined {
  const [, setValue] = createSignal(0)
  const [rows, setRows] = createSignal([1])
  let error: string | undefined
  const illegalWrite = () => {
    try { createMemo(() => { setValue(1); return 0 })() }
    catch (caught) { error = String(caught) }
  }
  function GuardRow() {
    if (nestedCleanup) onCleanup(illegalWrite)
    else illegalWrite()
    return <i />
  }
  const dispose = render(() => <For each={rows()}>{() => <GuardRow />}</For>, host)
  flush()
  setRows([])
  flush()
  dispose()
  return error
}

;(window as typeof window & { runWriteGuardProbe: typeof guard }).runWriteGuardProbe = guard
