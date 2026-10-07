import { createServerReference } from "@solidjs/web/server-functions/client";
const call = createServerReference("typed");
(window as any).done = (async () => {
  const nested = await call({ data: new Uint8Array([65]) }).then(
    () => null,
    (e) => String(e),
  );
  const single = await call(new Uint8Array([65])).then(
    (value) => ({ value }),
    (e) => ({ error: String(e) }),
  );
  return { nested, single };
})();
