# Design intent

What Otakoyi Control should feel like and why, in one place. Read it before designing a
component, a pattern or a client pult. It records decisions, not values:

| Need                                   | Go to                           |
| -------------------------------------- | ------------------------------- |
| Token values                           | `packages/tokens/tokens.json`   |
| Rules that fail a check                | `AGENTS.md` → Hard rules        |
| A component's states, limits, props    | Storybook (component Docs page) |
| Screen-level rules (navigation, menus) | Storybook › Docs › Guidelines   |
| Figma pages, variables, name mapping   | `docs/figma.md`                 |
| Why a decision was made                | `docs/decisions/`               |

## Thesis

**A piece of studio hardware that happens to be on glass.**

The pult is operated in dark venues, by people looking at a wall, not at the phone. It should
read like a physical console: every control has weight and a place, state is shown by light,
and nothing moves unless a hand moves it. The reference is neumorphic dark hardware
(Figma › Research, _Neumorphic Dark Knobs_).

It is delivered as part of an installation and wears the client's brand, so the system is
quiet by itself: graphite surfaces, one lit colour, and that colour is the client's.

## Light and colour

- **One lit colour.** The brand primary (neon lime for Otakoyi) is the only colour that glows.
  It means "this value is on / this is how much". It is not decoration.
- **Glow is state.** Lit values glow softly at rest and fully while touched. Buttons glow
  only while pressed. Nothing glows to look good.
- **Status is not brand.** Online, warning, critical, offline and studio look the same on
  every pult, whatever the client's colours, so an operator recognises them anywhere.
- **Brand is the studio's delivery.** Primary, accent, neutrals, font, logo and theme mode
  ship in the config. The app has no appearance settings and never will (ADR-004).
- Dark is the default and is designed first; light exists because some venues need it.

## Depth

Depth says what a thing is, never how important it is.

- **Raised** — you can touch it, or it is a top-level card or panel.
- **Inset** — it is active or pressed, or it is the bed a control moves in.
- **Flat** — it is information sitting inside a card.
- One level only: a raised panel holds flat info and inset beds, never another raised panel.
- Depth is never the only signal. Pair it with colour, an icon or words.

## Touch

- **A touch never changes a value by accident.** Faders are relative by default: touching
  does nothing, dragging moves 1:1 (ADR-007). An accidental tap in a dark venue must not
  flash or kill a wall.
- **The surface answers the finger.** The touched element lights from within under the
  fingertip, follows it and fades on release (Touch Light). White only, clipped to the element.
- **Precision is a gesture, not a mode switch.** Two fingers = fine. Double-tap = default.
- **Dangerous actions need time, not a dialog.** Blackout and Restart are hold-to-confirm.
  Undoable actions happen at once with an Undo toast.

## Shape and type

- Shape follows Apple: continuous corners, concentric nested radii, capsules for tab bars
  and segmented controls, list separators inset to the text.
- Inter for everything a person reads; JetBrains Mono for values and logs. A brand may
  replace the sans. Sentence case, one line per label, verbs on buttons, nouns on switches.
- Phosphor Regular for every glyph. No other icon set, no custom one-offs.

## Layout

- **The pult never scrolls vertically** (ADR-006). What does not fit becomes the next screen,
  swiped as a whole. Sheets may scroll; the pult may not.
- **Two pults per installation** (ADR-013): a phone pult for everyday use (few controls,
  scenes, safe actions) and a tablet console for live operation (dense, faders and knobs).
  Design the primary one first, ship both.
- **The installation's settings pages are the pult's tabs.** Parameters arrive grouped by the
  TouchDesigner custom-parameter pages (one page = one contract group). A pult page (tab) holds
  whole groups and never mixes in pieces of another; small groups may share a tab, a group is
  split only when it alone is bigger than a screen.
- **The first screen runs the show.** `live` parameters come first, then `tune`; `setup` goes to a
  separate Setup pult, `hidden` never reaches a pult. What does not fit the first screen becomes
  the next screen, swiped horizontally — never a scroll, never smaller controls (ADR-006,
  product ADR-017).
- **Dense by default.** Controls sit close; free space collects at the bottom on a phone and
  is filled by the last item of each column on a tablet.
- **Panel titles are usually noise.** Drop the Console Panel title wherever the controls
  explain themselves; keep one only when a panel's purpose is unclear without it.
- **One switch, the small one.** On/off is the iOS-size Menu Switch everywhere: menus, lists
  and the pult. When an on/off needs a bigger target, it is a Toggle pad, not a bigger switch.
- **Colour picking is a square**, never a wheel. Add sliders when needed.

## Chrome

- Around the pult the app is plain iOS: system sheets, menus, pop-up buttons, the iPad
  drawer and inspector, all per the current Apple HIG. Our content, the system's container.
- The pult screen carries a minimal header and nothing else. Settings and Installation are
  one tap away and never cover the controls by surprise.
- Motion in chrome is the system's. Controls never animate decoratively.

## Do / don't

| Do                                                    | Don't                                                |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Light a value                                         | Light a resting button, a border or a title          |
| Use the brand colour for "on" and "how much"          | Use it for warnings, errors or connection state      |
| Split a crowded page into screens                     | Shrink controls below their Figma size or add scroll |
| Build a client pult only from library instances       | Draw a one-off control on a client page              |
| Add a missing control to the library first            | Restyle a component for one client                   |
| Use the system sheet, menu or picker                  | Rebuild a system container in our style              |
| Use the Menu Switch for every on/off switch           | Draw a larger or restyled switch for the pult        |
| Leave a panel untitled when its controls are labelled | Title every Console Panel out of habit               |

## Tried and rejected

- Round (wheel) colour picker — removed 2026-11-09
- Absolute faders as the default (ADR-007)
- A separate pult-builder app; Figma is the builder (ADR-014)
- Client login and an in-app brand or theme editor (ADR-004, ADR-012)
- Blur under the scrim; a debug overlay on top of the pult (ADR-013)
- The big pult Switch with grips and two LEDs — removed 2026-11-16; the Menu Switch is the
  only switch

## Keeping this file honest

- `AGENTS.md` tells agents to read this file before any UI task; they will not find it on
  their own.
- When a design decision changes, change it here in the same PR as the code and Figma.
- A statement that a script can check belongs in a test, not here.
