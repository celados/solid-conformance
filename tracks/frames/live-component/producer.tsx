import { createMemo, onCleanup } from "solid-js";
export const stats = { calls: 0, opened: 0, closed: 0, cleaned: 0 };
let current = 17;
const active = new Set<any>();
export const produce = () => {
  stats.calls++;
  const source = {
    [Symbol.asyncIterator]() {
      stats.opened++;
      let first = true,
        closed = false,
        release: any;
      const iterator = {
        next() {
          if (first) {
            first = false;
            return Promise.resolve({ value: current, done: false });
          }
          return new Promise((r) => (release = r));
        },
        return() {
          if (!closed) {
            closed = true;
            stats.closed++;
            active.delete(iterator);
            release?.({ done: true });
          }
          return Promise.resolve({ done: true });
        },
        push(value: number) {
          release?.({ value, done: false });
        },
      };
      active.add(iterator);
      return iterator;
    },
  };
  return () => {
    const value = createMemo(() => source);
    onCleanup(() => stats.cleaned++);
    return <b data-live-component>{value()}</b>;
  };
};
export const push = (value: number) => {
  current = value;
  for (const source of active) source.push(value);
};
