import { Loading, createMemo } from "solid-js";
import { isServer } from "@solidjs/web";
function Content(props: { delay: number }) {
  const value = createMemo(() =>
    isServer
      ? new Promise<string>((_resolve, reject) =>
          setTimeout(() => reject(new Error("server-only failure")), props.delay),
        )
      : Promise.resolve("recovered"),
  );
  return <span data-recovered>{value()}</span>;
}
export function RecoveryApp(props: { delay: number }) {
  return (
    <Loading fallback="waiting">
      <Content delay={props.delay} />
    </Loading>
  );
}
