import { createSignal, OBSERVE } from "solid-js";
import { renderToString } from "@solidjs/web";
export async function run() {
  const messages: string[] = [];
  const original = [console.warn, console.error, console.info];
  const capture = OBSERVE?.diagnostics.capture();
  console.warn =
    console.error =
    console.info =
      (...args) => messages.push(args.map(String).join(" "));
  try {
    const html = renderToString(() => {
      const [value, write] = createSignal(0);
      write(1);
      return String(value());
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    return {
      html,
      count: Number(messages.some((m) => m.includes("[SERVER_WRITE] Writing a signal"))),
    };
  } finally {
    capture?.stop();
    [console.warn, console.error, console.info] = original as any;
  }
}
