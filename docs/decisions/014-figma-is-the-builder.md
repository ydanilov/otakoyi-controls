# 014 — Figma is the builder

**Status:** Accepted

**Context.** Every client gets a fully designed pult: which controls, in what order and size, every
label and caption, phone and tablet layouts (ADR-013). Designing that in Figma and then re-entering
it in a builder doubles the work and drifts.

**Decision.** The studio lays out each client's pult in the OSC Figma file, built only from library
components and patterns. An exporter reads the file and produces the installation config; Figma
owns layout and copy, the config stays the only thing the app reads (ADR-001 unchanged).

Figma conventions:

- One page per client (`Client · <name>` or `Client / <installation-id>`). The page's `Brand`
  variable mode is the client theme (primary, accent, mode, font, logo).
- One top-level frame per pult page and form factor: `<pult-id> / <phone|tablet> / <page-id>`,
  frame title = page title, in swipe order left to right. Prototype screens (`Phone / …`,
  `Tablet / …`) also export: a screen with a Pult Header `Mode=Control` is a pult page, its active
  Screen Tab names the page, and later screens of the same page are state variants.
- Every control is an instance of a library component. Component set + variants give the type and
  mode (`Fader Mode=Relative` → `fader` with `mode: "relative"`, `Knob Mode=Color` → hue knob, …);
  patterns (Fader Bank, Knob Group, Camera Control, Scene Bar, …) are containers the exporter
  looks into.
- Instance text properties are the copy: `Label`, captions, option labels, scene names.
- The layer name is the control `id` (a layer left with the component's name gets an id from its
  label, and the report says so).
- Behaviour that has no visual lives in two Dev Mode annotations on the instance (or on the
  container it shares them with): **OSC** — address, type, range, values, rate, feedback and
  `key=value` extras (curve, step, default, target, lock, studioOnly, …) in a fixed text format —
  and **Depends on** — `when <control> = <value>` conditions (config `enabledWhen`) plus notes for
  people. The **Otakoyi Inspector** dev plugin (`tools/figma-plugin`) edits both, mirrors them into
  shared plugin data (`otakoyi` namespace) and previews the exporter's output for the selection.
- Layout is read from the frame geometry and mapped to the 12-column grid per form factor.
- In the config a Patterns instance built on a Console Panel (Fader Bank, Knob Group, Knob Row,
  Layer Toggles, Camera Control, Scene Bar, Show Actions) is a page **panel**: `pattern` from the
  component, `title` from the panel title, its controls in order (a Fader Bank strip = fader + its
  ON toggle); the layout places the panel instead of the controls. A List Card of switch rows is a
  panel with `pattern: "list"`. Icons on rows and segments are `icon` (the `Icon/<name>`). (The
  exporter does not emit panels yet: it still flattens patterns into controls.)
- A pult's primary form factor (`formFactor`, ADR-013) and its icon in the pult list (`icon`) are
  config fields the studio sets.

Exporter (`tools/figma-export`, TypeScript CLI; format and options in `docs/figma-export.md`):

1. Read the client page: Figma REST API (`FIGMA_ACCESS_TOKEN`; nodes, component properties, shared
   plugin data) or a saved snapshot of the same shape (exported by the Inspector; used for tests).
2. Map instances to schema controls with the shared mapping module; merge phone and tablet frames
   by control `id` (annotating one form factor is enough).
3. Validate with the zod schema (incl. `checkBrand()`); check addresses against the installation's
   OSC contract; report unknown components, missing or unused addresses, duplicate addresses and
   layout gaps. Exit non-zero on errors.
4. Compare with the published config, bump `revision` when the pults changed, write the config and
   the report (deterministic, for review in a PR).

**Documentation split.** Component documentation (purpose, do/don't, anatomy, states, behaviour,
accessibility, Figma mapping) lives in Storybook, next to the code. Figma components carry a one-line
description only. Client pages carry only what is specific to that build: the **OSC** and
**Depends on** annotations above. The Figma **Guidelines** page holds the rules for composing a
client pult.

**Consequences.**

- Schema v2: a page holds controls once and a layout per form factor (`layout.phone`,
  `layout.tablet` with grid placements). v1 configs migrate by copying `grid` into both layouts.
- **There is no separate builder app.** The roadmap's "pult builder" phase becomes the exporter
  plus the Otakoyi Inspector plugin. Publishing = exporter output reviewed in a PR and uploaded to
  the bridge (later the cloud). Brand checks and schema validation that the builder would have done
  live in the exporter CLI and the inspector plugin (an OSC test-send from the plugin is not built).
- `enabledWhen` is carried in the config from "Depends on"; the pult renderer does not evaluate it
  yet, and prose-only Depends on notes stay in the report.
- The installation side declares what it accepts in an **OSC contract**
  (`otakoyi/osc-contract.json` in the installation repo, format in `docs/osc-contract.schema.json`,
  guide in `docs/integration.md`). The exporter validates it (`parseContract`), fails on a
  control whose address is not in it, warns about controls on `hidden` parameters and `live`
  parameters missing from the pult (contract 1.1, ADR-017), and adds the standard System screen
  when the contract has the System group (ADR-018). `pnpm pult-draft` turns a contract into a
  draft config for testing before the Figma page exists (ADR-017).
- Library component names and variant values are now API: renaming one is a breaking change and
  needs an exporter mapping update in the same PR.
- A client's unique visual (not in the library) is added to the library first, then used.
