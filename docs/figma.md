# Figma ↔ code

File: **OSC** — https://www.figma.com/design/D2HHS8lt7PxZqxibv9PlOQ/OSC

Figma is the builder (ADR-014): there is no separate pult-builder app. The exporter and the
Otakoyi Inspector plugin are described in [figma-export.md](figma-export.md).

| Page                 | What                                                                                                  | Code                   |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------- |
| Cover                | File cover                                                                                            | —                      |
| Foundations          | Colour, elevation & glow, typography, rules                                                           | `packages/tokens`      |
| Components           | Design-system library in sections: icons, app chrome, forms & lists, controls, media, containers      | `packages/ui`          |
| Patterns             | Compositions: Channel Strip, Fader Bank, Knob Group, Mix, Prompt Presets, Installation Actions…       | `packages/ui`          |
| Guidelines           | Rules for composing a client pult: which control when, do/don’t, layout, annotating a build, copy     | —                      |
| iOS 27 · System      | System parts from the iOS and iPadOS 27 library: status bar, home indicator, sheets, keyboards, menus | native                 |
| Client · Template    | Template for every client pult (duplicate it per client): phone + tablet screens, standard OSC set    | config + `apps/mobile` |
| Demo · Try the demo  | Demo-mode prototype (simulated installation) for App Review and prospects, phone + tablet             | `apps/mobile` demo     |
| Research, References | Mobbin research board and visual references (Neumorphic Dark Knobs is the lead one)                   | —                      |

## Client pages are the pult builder

Component documentation lives in Storybook; Figma keeps only a one-line description. Client pages
carry the build-specific Dev Mode annotations on control instances (or on the panel around them):
category **OSC** (address, type, range, values, rate, feedback, `key=value` extras) and **Depends on**
(`when <control> = <value>` conditions; other lines are notes). The **Otakoyi Inspector** plugin
edits both and shows what the exporter makes of the selection.

One page per client (`Client · <name>` or `Client / <installation-id>`), built only from library
instances. The exporter (`tools/figma-export`, see [figma-export.md](figma-export.md)) reads the page
and writes the installation config:

- one frame per pult page and form factor: `<pult-id> / <phone|tablet> / <page-id>`, left to right
  in swipe order — or a prototype screen `Phone / …` / `Tablet / …` with a Pult Header
  (`Mode=Control`) whose active Screen Tab names the page;
- layer name of a control instance = control `id`; component + variants = control type and mode;
- instance text properties = copy (labels, options, scene names);
- the OSC annotation gives the address and behaviour; every address must exist in the
  installation's OSC contract (`docs/integration.md`).

## Style

Neumorphic dark hardware: graphite-navy surfaces, neon lime as the only lit colour, LEDs and glow
for state. Depth is meaningful (ADR-013):

- **Raised** (`Neu/Raised`, `Neu/Raised SM`) — interactive elements, top-level cards and panels.
- **Inset** (`Neu/Inset`, `Neu/Pressed`) — active / pressed states and beds under controls
  (tracks, toggle beds, inputs, tab bars).
- **Flat** — information nested in a card (Chip, Stat Tile, icon wells, Label).
- **Glow** (`Glow/*`) — lit values, LEDs, and buttons only while pressed. Never on resting buttons.
- **Touch light** (`Touch Light`) — the press response (Apple Liquid Glass): the touched element
  illuminates from within, starting under the fingertip — white only, clipped to the element. See
  Rules.

Effect colours are bound to `elevation/*` variables, so shadows and highlights switch with the
theme mode. `Glow/*` is the resting glow of lit values; `Glow/* Active` is used while a control is
touched or dragged (Fader/Knob `State=Active`, `State=Fine`, Button `State=Pressed`). While a finger is
down, the touched element lights up from within under it, follows it and fades on release.

Shape follows Apple: continuous corners (corner smoothing 0.6), radius scale 8 / 12 / 22 / 28,
nested corners are concentric (inner radius = outer radius − inset), tab bars and segmented
controls are capsules, list separators are inset to the text (`Divider Type=Inset`).

Pult screens never scroll; sheets may. Navigation follows the Apple HIG (ADR-013): Settings and
Installation open from header buttons (edge swipes are shortcuts) as system sheets on iPhone; on iPad
Settings is a floating drawer from the left (400 pt, 12 pt inset left / bottom, radius 28, dark fill,
large title + round close, over the dimmed pult — Tablet / 04 Settings) and Installation a 390 pt
trailing inspector, built from the **iOS 27 · System** page (`Sheet - iPhone`, `Sheet - iPad`) with our content inside; context and pull-down menus
use the iOS `Menu`. The scrim only dims (no blur). Debug never overlays the pult: it is a page pushed
inside Installation (Phone / 20 Debug in the sheet, Tablet / 20 Debug in the inspector, with a back
control) and from Settings › Developer › Debug. It is an inset-grouped list — Section + List Card of
Debug Rows (Connection, Traffic, Controls, Versions) and the OSC Log.

Control headers: vertical faders (and jog wheels) and knobs centre the label and value above the
control, 6 pt apart; horizontal faders keep label left / value right (`ControlFrame align`).

## Variables

| Collection  | Modes                     | Contents                                                                   | Code                                                                                                                                                                                                 |
| ----------- | ------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Base`      | Value                     | Neutrals for dark and light, status colours (hidden primitives)            | `tokens.json → color`                                                                                                                                                                                |
| `Brand`     | one mode per client brand | `brand/*` incl. `primary-signal-light` (primary darkened to ≥ 3:1)         | installation config `theme` (exporter, `docs/figma-export.md` › Adding a client theme); Otakoyi = `brandDefaults`, checked against `packages/tokens/figma/brand-modes.json`; Storybook Brand toolbar |
| `Theme`     | Dark / Light              | `color/*`, `control/*` (incl. `control/signal`), `status/*`, `elevation/*` | `createTheme()` output                                                                                                                                                                               |
| `Dimension` | Value                     | `space/*`, `radius/*`, `stroke/*`, `touch/*`, `control/*` sizes            | `tokens.json`                                                                                                                                                                                        |

`control/fill` and `control/signal` use the brand primary in dark mode and the darkened signal
colour in light mode — same rule as `createTheme()` (`SIGNAL_CONTRAST = 3`). Buttons keep the exact
brand colour. **Status colours live only in Base and are never aliased to Brand.**

## Components

Forms: Input, Value Input (label + recessed value with unit; Default / Focus / Error / Disabled; iOS number pad), Select (native iOS 27 popup button + pull-down menu; Default / Open / Disabled), Stepper, List Row, Switch (big, on-stage), Menu Switch (iOS size, menus and lists).

Chrome: Button (Primary / Secondary / Ghost / Destructive × Default / Pressed / Disabled), Icon
Button, Badge, Connection, Pult Select, Screen Tab, Tab Bar, Pult Header, Input, List Row, Switch,
Status Bar, Home Indicator, Top Bar, Brand Mark, Wordmark, Stat Tile, Note, Info Card, Chip, Loader,
Divider (Line / Inset / Label), Scrim, Page Dots, Nav Item, Viewfinder, Toast, Backdrop, Client Logo.
Slot containers: List Card, Section, Console Panel, Dialog (content for system sheets), Release Card,
Pult Card.

Debug: Debug Row (Kind=Metric / Control), OSC Log, Debug Tag, Debug HUD.

Controls: Fader (Absolute / Relative jog wheel / Crossfade × Vertical / Horizontal × Default / Active /
Fine “×0.2” / Off / Disabled), Knob (Absolute / Relative / Color-Hue × Vertical / Horizontal ×
Default / Active / Fine / Disabled × Size Regular / Compact, 240° travel), Pad (Size), Toggle (Size ×
Content=Text / Image), Thumbstick, Gyroscope (Off / Live / Permission denied / View only; uses the
Menu Switch),
XY Pad, Meter, Toggle, Pad, Hold to Confirm, Segmented (single-select), Group Button and Button
Group (multi-select with LED strip), Button Grid, Scene List, Label, Color Picker, Unsupported,
Touch Light (press response, 134:795; board "Touch light — press response" 134:15404).

Prompts: Prompt Preset (Off / On / In blend / Disabled / Applying / Error / Editing), Prompt Field;
patterns Prompt Presets (Active / Applying / All off / Editing / Empty / Error), Prompt Mix, Prompt
Context Menu, Prompt Editor Sheet (New / Edit), Prompt Deleted Toast, Image Source Menu.

Icons: Phosphor Regular as `Icon/<name>` components — use them for every glyph.

## Component → code

Docs for every component (purpose, states, behaviour, accessibility, content limits, variant → props)
live in Storybook (`pnpm storybook`); Figma keeps a one-line description. Component and variant names
are exporter API (ADR-014). Paths are under `packages/ui/src/`.

| Figma component (variants)                                                                                | Code                                                                          | File                                                                                           |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Neu/*`, `Glow/*` effect styles                                                                           | `Surface depth glow`, `boxShadow()`                                           | `ds/depth.tsx`, `@osc/tokens` depth.ts                                                         |
| Touch Light (press response)                                                                              | `useTouchLight` + `TouchLightSkia` / `TouchLightView`, `PinTouchLight`        | `controls/TouchLight.tsx`, `@osc/controls` touchLight.ts, tokens `touchLight`                  |
| `Icon/<name>`                                                                                             | `<Name>Icon` + `Glyph`                                                        | `ds/icons.ts`, `ds/Glyph.tsx`                                                                  |
| Button (Variant × State)                                                                                  | `Button variant pressed disabled`                                             | `chrome/Button.tsx`                                                                            |
| Icon Button (State=Default / Active)                                                                      | `IconButton active`                                                           | `chrome/Button.tsx`                                                                            |
| Badge                                                                                                     | `Badge tone`                                                                  | `chrome/Status.tsx`                                                                            |
| Connection (State=Online / Connecting / Offline)                                                          | `ConnectionStatus state`                                                      | `chrome/Status.tsx`                                                                            |
| Pult Header (Mode=Control / View / Studio)                                                                | `PultHeader mode` (+ `StatusBanner`)                                          | `pult/PultHeader.tsx`                                                                          |
| Pult Select                                                                                               | `PultSelect`                                                                  | `pult/PultSelect.tsx`                                                                          |
| Screen Tab (State), Tab Bar                                                                               | `ScreenTab active`, `TabBar`                                                  | `chrome/Navigation.tsx`                                                                        |
| Top Bar · Nav Item (State)                                                                                | `TopBar` · `NavItem active`                                                   | `chrome/Navigation.tsx`                                                                        |
| Brand Mark (Size) · Wordmark (Size)                                                                       | `BrandMark size` · `Wordmark size`                                            | `chrome/Brand.tsx`                                                                             |
| Stat Tile (Size) · Note · Info Card · Chip (Tone) · Divider (Type)                                        | `StatTile` · `Note` · `InfoCard` · `Chip` · `Divider`                         | `chrome/Status.tsx`                                                                            |
| Page Dots (Count)                                                                                         | `PageDots count active`                                                       | `chrome/Status.tsx`                                                                            |
| Loader (Tone) · Scrim (dim only) · Toast                                                                  | `Loader tone` · `Scrim` · `Toast`                                             | `chrome/Loader.tsx`, `chrome/Scrim.tsx`, `chrome/Toast.tsx`                                    |
| Master Bar (State=Default / Muted)                                                                        | `MasterBar muted`                                                             | `media/MasterBar.tsx`                                                                          |
| Input (State)                                                                                             | `TextField focused error disabled`                                            | `forms/Field.tsx`                                                                              |
| Value Input (State)                                                                                       | `ValueInput` (+ `parseValueInput`)                                            | `forms/Field.tsx`, `ds/logic.ts`                                                               |
| Select (State=Default / Open / Disabled)                                                                  | `Select` (iOS: `@expo/ui` Picker)                                             | `forms/Select.tsx`, `forms/Select.ios.tsx`                                                     |
| List Row (Trailing=Chevron / Value / Switch / None / Destructive)                                         | `ListRow trailing`                                                            | `forms/ListRow.tsx`                                                                            |
| Switch (State=Off / On / Disabled)                                                                        | `LedSwitch value disabled`                                                    | `forms/LedSwitch.tsx`                                                                          |
| Stepper (State=Default / Changed / Disabled)                                                              | `Stepper defaultValue` (+ `stepValue`)                                        | `forms/Stepper.tsx`, `ds/logic.ts`                                                             |
| Activity Row (Kind)                                                                                       | `ActivityRow kind`                                                            | `media/ActivityRow.tsx`                                                                        |
| Quick Action (State, incl. Hold)                                                                          | `QuickAction holdMs pressed disabled`                                         | `media/QuickAction.tsx`                                                                        |
| Image Tile (State) · Image Upload (State) — UI view                                                       | `ImageTile state` · `ImageUploadView state`                                   | `media/Image.tsx`                                                                              |
| List Card · Section · Console Panel (slots)                                                               | `ListCard` · `Section` · `ConsolePanel`                                       | `containers/Cards.tsx`                                                                         |
| Release Note (Latest) · Release Card · Pult Card (Primary)                                                | `ReleaseNote` · `ReleaseCard` · `PultCard`                                    | `containers/Cards.tsx`                                                                         |
| Dialog (Container=Modal / Sheet) — content only                                                           | `Dialog` inside the sheet / form sheet (`presentationFor`)                    | `containers/Dialog.tsx`, `ds/logic.ts`                                                         |
| Settings / Installation surfaces (sheet, iPad left drawer, inspector)                                     | `presentationFor`, `Drawer` + `DrawerHeader`, `Inspector`, `EdgeSwipe`        | `ds/logic.ts`, `containers/Drawer.tsx`, `containers/Inspector.tsx`, `containers/EdgeSwipe.tsx` |
| Menu Switch (State=Off / On / Disabled) — List Row `Trailing=Switch`                                      | `MenuSwitch` (List Row draws it)                                              | `forms/MenuSwitch.tsx`, `forms/ListRow.tsx`                                                    |
| Color Picker (Patterns, Style=Knobs / Square / Wheel)                                                     | `ColorPicker` (`pickerStyle`; maths in `@osc/controls` color.ts)              | `controls/ColorPicker.tsx`                                                                     |
| Mix · Prompt Mix (Patterns)                                                                               | `Mix` · `PromptMix`; scene selects = `Select variant="button"`                | `patterns/Mix.tsx`, `forms/Select.tsx`                                                         |
| Fader Bank · Knob Group · Knob Row · Layer Toggles · Camera Control · Scene Bar · Show Actions (Patterns) | page `panels` (`pattern`), drawn by `PanelView`; widths `panelMaxWidth`       | `pult/Panels.tsx`, `pult/layout.ts`, `@osc/schema` `Panel`                                     |
| Channel Strip ON button · Group Button (single)                                                           | Toggle `style: "led"`                                                         | `controls/discrete.tsx`                                                                        |
| Segmented (Content=Icon)                                                                                  | option `icon` (Phosphor name)                                                 | `controls/discrete.tsx`, `ds/iconByName.ts`                                                    |
| Meter (Level=Normal / Warning / Critical)                                                                 | `Meter` (24 LEDs, peak hold, dB scale; maths in `@osc/controls` meter.ts)     | `controls/Meter.tsx`                                                                           |
| Connect (phone / tablet) · Demo banner                                                                    | `ConnectOptions layout` · app `DemoBanner`                                    | `connect/Connect.tsx`, `apps/mobile/src/components/DemoBanner.tsx`                             |
| Context menu (long-press, preview) · image source pull-down                                               | `ContextMenu` · `PullDownMenu` (iOS: `@expo/ui`)                              | `menus/*`                                                                                      |
| Backdrop · Client Logo · Connect / Client loading screens                                                 | `Backdrop` · `ClientLogo` · `ConnectOptions`, `ConnectForm`, `BrandedLoading` | `connect/*`                                                                                    |
| Viewfinder (Size)                                                                                         | `Viewfinder size`                                                             | `containers/Viewfinder.tsx`                                                                    |
| Fader · Knob · XY Pad · Meter · Hold to Confirm                                                           | `Fader` · `Knob` · `XYPad` · `Meter` · `HoldToConfirm`                        | `controls/*.tsx`                                                                               |
| Toggle · Pad · Segmented · Button Grid · Scene List · Label · Unsupported                                 | `discrete.tsx` exports                                                        | `controls/discrete.tsx`                                                                        |
| Pad (Size) · Toggle (Size × Content=Text / Image)                                                         | `size: regular \| compact`, toggle `image` (picture pad)                      | `controls/discrete.tsx`, `pult/layout.ts` (`naturalHeightFor`)                                 |
| Knob (Size=Regular / Compact)                                                                             | `size: regular \| compact`                                                    | `controls/Knob.tsx`                                                                            |
| Debug Row (Kind=Metric / Control) · OSC Log — the Debug page (Phone / Tablet 20 Debug)                    | `DebugRow kind` · `OscLog` (+ `DebugStore` in `@osc/controls`)                | `debug/DebugRow.tsx`, `debug/OscLog.tsx`; page: `apps/mobile/src/components/DebugContent.tsx`  |
| Debug Tag · Debug HUD (in the library, not used in the app now)                                           | `DebugTag` · `DebugHud`                                                       | `debug/Debug.tsx`                                                                              |
| Patterns: Quick Actions Row, Installation Actions, Installation Switcher, Activity Log, Stepper Group     | same names                                                                    | `patterns/Installation.tsx`                                                                    |
| System Screen (Patterns 285:1953, Breakpoint=Phone / Tablet) — standard System screen, ADR-018            | `SystemScreen`                                                                | `patterns/System.tsx`                                                                          |

New control types (ADR-015) — Fader Mode=Relative/Crossfade, Knob Mode=Relative/Color,
Thumbstick, Button Group, Image, Mic, Prompt — and Gyroscope (204:853) live in `controls/*` (`Jog.tsx`,
`Thumbstick.tsx`, `Gyroscope.tsx`, `media.tsx`, `Prompt.tsx`, `discrete.tsx`) and have stories. Not in code on purpose: Status Bar and
Home Indicator (device chrome in mockups). Control compositions on the Patterns page (Fader Bank,
Knob Group, Camera Control, Scene Bar…) are page `panels` in the config, drawn by the pult renderer
(`pult/Panels.tsx`).

The "Try the demo" installation (`packages/schema/examples/try-the-demo.json`) is the Figma page
**Demo · Try the demo**: VJ console (tablet: Mix / FX / Cues / Scenes), Lighting cues, Lobby wall
(phone: Live / Scenes).

## Rules

- Screens are built only from library instances and patterns; anything missing goes into the library first.
- Component and variant names follow the code (`controlRegistry` types, ADRs).
- Colours only through variables; a new colour starts in `tokens.json`, then here.
- The control drawing in code (Skia) is the source of truth for geometry; Figma mirrors it.
- **Touch light** (Apple Liquid Glass): the touched element illuminates from within, starting under
  the fingertip. **White only**, clipped to the touched element — never spilling onto the track or
  the surroundings. Faders, knobs, thumbstick, jog wheel: no separate layer — the thumb / disc /
  stick / wheel itself gets a radial white gradient (16 % at the touch point → 0), below its LED,
  grips, cap and marks. Pads, buttons, toggles, segments, quick actions, XY pad: halo 7 % + core
  12 % white, clipped to the surface, below labels / icons. In 120 ms ease-out (scale 0.6 → 1),
  follows 1:1, out 260 ms; Reduce Motion fades only. Never on disabled or view-only controls.
  Sizes and timings: `touchLight` in `tokens.json`.
- **Relative controls** (jog wheel, encoder knob): the ↻ glyph next to a signed value (`+12`,
  `−0.02`, `0.00`) — the change accumulated since the session started, kept while the pult is
  open. No REL badge (board "Relative indicator — options", 131:406).
- **Instance constraints**: a control's parts keep their component size when the instance is
  stretched (Center, not Scale): a fader thumb is 40 × 48 / 60 × 44 at any length. The code
  draws them at the component size.
- **Pult layout** (ADR-006): controls and panels are packed from the top at their component
  height — phone 16 pt sides, 12 pt top, 18 pt gaps, free space left at the bottom; tablet Console
  20 pt sides, 10 pt top / bottom, 16 pt gaps, the last item of each column stretched to the
  bottom. Stretchable controls (vertical faders, XY pad, meter, grids, lists) share the free height.
- **Responsive panels**: Console-Panel patterns fill their column's width up to a maximum (Fader
  Bank 640, Knob Row / Camera Control 480, others 560; centred when capped), never below their
  content height. Vertical knobs / faders centre their body when stretched; Group
  Buttons share the row (LED stays 40 wide, centred); Knob Group spaces knobs evenly; Scene Bar,
  Layer Toggles and Show Actions centre their content vertically.

## Gallery in code

`/gallery` in the app and web pult renders every control type in Initial / Active / View-only state
under four themes (Otakoyi dark/light, two sample client brands). Use it to compare code with this library.
Storybook (`pnpm storybook`) covers every component, not only controls, with the same brands.
