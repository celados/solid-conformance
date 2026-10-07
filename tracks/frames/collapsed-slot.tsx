import { createSignal, Show } from "solid-js";
export function CollapsedSlot(props: any) {
  const [open, setOpen] = createSignal(false);
  return (
    <section>
      <button data-expand onClick={() => setOpen(true)}>
        expand
      </button>
      <Show when={open()}>{props.children}</Show>
    </section>
  );
}
