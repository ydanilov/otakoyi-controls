// Headless check of the static Storybook build (CI-friendly, no extra test framework):
// serves storybook-static, opens every story in dark and light with Chromium (Playwright),
// and fails if a story throws, logs a React error, its `play` interaction test fails, or the
// layout sensor finds a sheet header over its content / content cut off at the side
// (`layoutViolations` in packages/ui/src/stories/layout.ts — the Figma layout invariants).
//
//   pnpm build-storybook && pnpm test-storybook
//   STORY=chrome-button pnpm test-storybook      # only stories whose id contains "chrome-button"
//   SHOTS=/tmp/shots pnpm test-storybook          # also save a screenshot per story and theme
//   WORKERS=2 pnpm test-storybook                 # parallel pages (default: cores, max 4)
//   CHROMIUM=/path/to/chrome pnpm test-storybook  # another Chromium build (default: Playwright's)
//
// Why it is built this way (it used to be slow and flaky locally):
// - Every story is a full page load, so the static server sends cache headers: the 8 MB
//   canvaskit.wasm and the bundles load once per worker instead of 600 times. Without them a
//   load could take long enough to hit the timeout on a busy machine.
// - Full Chrome (not the headless shell) asks for /favicon.ico; a 404 there was reported as a
//   story error. The server answers it, and a failed request is reported with its URL.
// - The a11y addon ran axe after every story; its colour-contrast rule reads the pixels of every
//   Skia (WebGL) canvas, which stalls the GPU: 14 s for a full pult page, over the timeout with
//   several workers. The checks report only ("todo") and nothing here reads them, so the runner
//   switches the automatic run off (`a11y.manual`); the Accessibility panel still runs them.
// - A `fn()` spy that receives a React Native Web press event (DOM nodes, fibers: circular)
//   made Storybook's instrumenter throw "Converting circular structure to JSON" on click. The
//   stories' handlers get plain data instead (see `stories/handlers.ts`).
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { availableParallelism } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../storybook-static/", import.meta.url));
if (!existsSync(join(root, "index.json"))) {
  console.error("storybook-static not found — run `pnpm build-storybook` first.");
  process.exit(1);
}
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? "/").split("?")[0])).replace(
    /^(\.\.[/\\])+/,
    "",
  );
  if (path === "/favicon.ico") {
    res.writeHead(204).end();
    return;
  }
  let file = join(root, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  // The story index and the iframe page change per build; everything else may be cached.
  const fresh = /(index\.json|\.html)$/.test(file);
  res.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": fresh ? "no-cache" : "public, max-age=3600",
  });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const filter = process.env.STORY ?? "";
const shots = process.env.SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const index = JSON.parse(readFileSync(join(root, "index.json"), "utf8"));
const stories = Object.values(index.entries).filter(
  (e) => e.type === "story" && e.id.includes(filter),
);
const jobs = stories.flatMap((s) => ["dark", "light"].map((theme) => ({ s, theme })));

const browser = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);

// Record what the preview emits: `storyFinished` (with a status) comes after render, `play` and
// afterEach; errors arrive as playFunctionThrewException / unhandledErrorsWhilePlaying /
// storyThrewException / storyErrored.
const recorder = () => {
  window.__sbEvents = [];
  const bad = [
    "playFunctionThrewException",
    "unhandledErrorsWhilePlaying",
    "storyThrewException",
    "storyErrored",
  ];
  const attach = setInterval(() => {
    const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
    if (!channel) return;
    clearInterval(attach);
    const emit = channel.emit.bind(channel);
    channel.emit = (n, ...args) => {
      const e = args[0];
      if (n === "storyFinished") window.__sbEvents.push({ n, msg: e?.status ?? "" });
      else if (bad.includes(n)) {
        const first = Array.isArray(e) ? e[0] : e;
        window.__sbEvents.push({ n, msg: String(first?.message ?? first?.title ?? "") });
      }
      return emit(n, ...args);
    };
  }, 1);
};

const failures = [];
const timings = [];
let layoutChecked = 0;
let done = 0;
// Per story: render + play. A full pult page is ~3 s alone; leave room for a loaded CI runner.
const TIMEOUT = 60000;

async function worker() {
  const context = await browser.newContext({ viewport: { width: 900, height: 760 } });
  const page = await context.newPage();
  await page.addInitScript(recorder);
  let errors = [];
  page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]));
  page.on("console", (m) => {
    if (m.type() !== "error" || /^Failed to load resource/.test(m.text())) return;
    errors.push(m.text().split("\n")[0]);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`);
  });
  page.on("requestfailed", (r) => {
    // Navigating to the next story aborts the previous page's pending requests.
    if (/ERR_ABORTED/.test(r.failure()?.errorText ?? "")) return;
    errors.push(`request failed: ${new URL(r.url()).pathname} ${r.failure()?.errorText ?? ""}`);
  });
  for (let job = jobs.shift(); job; job = jobs.shift()) {
    const { s, theme } = job;
    errors = [];
    const t0 = Date.now();
    await page
      .goto(
        `${base}/iframe.html?id=${s.id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        { waitUntil: "domcontentloaded" },
      )
      .catch((e) => errors.push(`navigation: ${String(e.message ?? e).split("\n")[0]}`));
    await page
      .waitForFunction(() => window.__sbEvents.some((e) => e.n === "storyFinished"), null, {
        timeout: TIMEOUT,
      })
      .catch(() => errors.push(`timeout: story did not finish rendering / play in ${TIMEOUT} ms`));
    await page.waitForTimeout(150);
    const shown = await page.evaluate(() => {
      const bad = window.__sbEvents.filter((e) => e.n !== "storyFinished" || e.msg === "error");
      return bad.length ? bad.map((e) => `${e.n}: ${e.msg}`.slice(0, 300)).join(" | ") : null;
    });
    // Layout sensor (every story, both themes): header vs content, content inside the screen.
    const layout = await page.evaluate(() =>
      window.__oscLayout ? window.__oscLayout(document) : { checked: -1, violations: [] },
    );
    if (layout.checked < 0) errors.push("layout sensor missing from the preview");
    else layoutChecked += layout.checked;
    errors.push(...layout.violations.map((v) => `layout: ${v}`));
    if (shots) await page.screenshot({ path: join(shots, `${s.id}-${theme}.png`) });
    const errs = errors.filter((e) => !/Download the React DevTools/.test(e));
    const ms = Date.now() - t0;
    timings.push({ id: `${s.id} [${theme}]`, ms });
    done++;
    if (shown || errs.length) {
      failures.push(`${s.id} [${theme}] ${shown ?? ""} ${errs.slice(0, 3).join(" | ")}`.trim());
      console.log(`✗ ${done}/${stories.length * 2} ${s.id} [${theme}] ${ms} ms`);
    } else if (process.env.CI !== "true" && done % 50 === 0)
      console.log(`… ${done}/${stories.length * 2}`);
  }
  await context.close();
}

// One page per core (max 4): Skia stories are CPU-bound software WebGL in headless Chromium.
const workers = Math.max(1, Number(process.env.WORKERS ?? Math.min(4, availableParallelism())));
const t0 = Date.now();
await Promise.all(Array.from({ length: workers }, worker));
await browser.close();
server.close();

timings.sort((a, b) => b.ms - a.ms);
console.log(
  `${stories.length} stories × 2 themes checked in ${Math.round((Date.now() - t0) / 1000)} s ` +
    `(${workers} workers; slowest: ${timings
      .slice(0, 3)
      .map((t) => `${t.id} ${t.ms} ms`)
      .join(", ")}).`,
);
// The sensor must have seen the sheet stories; zero means it went blind (test ids renamed…).
if (!filter && layoutChecked === 0)
  failures.push("layout sensor checked no SheetScaffold — is LAYOUT_TEST_ID still rendered?");
console.log(`layout sensor: ${layoutChecked} sheet layouts checked`);
if (failures.length) {
  console.error(
    `${failures.length} failed:\n` + failures.map((f) => "  ✗ " + f.slice(0, 500)).join("\n"),
  );
  process.exit(1);
}
console.log("✓ all stories render and their play tests pass");
