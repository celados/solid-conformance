// Opens index.html in Chromium and prints each change of <main>'s text, with its time.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chromium" });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.addInitScript(() => {
  window.changes = [];
  const t0 = performance.now();
  new MutationObserver(() => {
    const text = document.querySelector("main")?.textContent;
    if (text !== undefined && text !== window.last) {
      window.last = text;
      window.changes.push(`${Math.round(performance.now() - t0)} ms: ${text}`);
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });
});
await page.goto(new URL("./index.html", import.meta.url).href);
await page.waitForTimeout(2000);
console.log((await page.evaluate(() => window.changes)).join("\n"));
const observations = await page.evaluate(() => window.changes);
await browser.close();if (errors.length) throw Error(errors.join("\n"));
if (!observations.some(line => line.endsWith(": yes5")) || observations.some(line => line.endsWith(": no"))) {
  throw Error("Expected the hydrated flag to commit with overview still visible before the client promise settles");
}
