import { startDocument } from "./document";

export async function run(abort = true) {
  let release!: () => void;
  let closed = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  async function* values() {
    try {
      yield 1;
      await pending;
    } finally {
      closed++;
    }
  }
  const document = startDocument(values);
  await new Promise((resolve) => setTimeout(resolve, 10));
  if (abort) document.abort();
  release();
  await new Promise((resolve) => setTimeout(resolve, 30));
  return { html: document.html(), closed };
}
