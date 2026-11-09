# 013 — Two use cases, two form factors

**Status:** Accepted

**Context.** The same installation can be run in two very different ways, and the pult has to fit
each of them.

**Decision.**

- **Lobby / office / permanent installation** — the pult is a stylish, convenient controller for
  everyday use: few controls, scenes and modes, safe actions. Usually used on a **phone**.
- **Live event** — the pult is a **VJ console** for that installation: dense layout, absolute and
  relative controls, faders, knobs, thumbsticks, cue/layer groups, fine mode. Usually used on a
  **tablet**.
- **Every delivery ships both layouts** — phone and tablet — for the same config, whichever use case
  it is. The config marks the primary form factor (phone for lobby, tablet for live), and the studio
  designs that one first.

**Consequences.** Pult layouts are defined per form factor (phone portrait, tablet landscape) in the
config; `layoutPage` runs per form factor. Figma has a phone and a tablet frame for every screen of
the app and for every client pult. QA checks both before a delivery.

**Navigation (Apple HIG, iOS / iPadOS 26+).**

- The pult screen shows only the controls and a minimal header: **Settings** button on the leading
  side, connection status, **Installation** button on the trailing side. Edge swipes are shortcuts
  only, never the only way in: right edge → Installation (phone and tablet), left edge → Settings
  (phone only; on iPad the leading edge belongs to the system sidebar gesture).
- **Settings**: iPhone → system sheet (large detent, grabber, Close × leading); iPad → a floating
  drawer from the leading edge (400 pt wide, 12 pt in from the left and the bottom, under the status
  bar, radius 28, dark fill, large "Settings" title + round close button, inset-grouped sections
  that scroll) over the dimmed console. It slides in from the left; a swipe to the left or a tap on
  the dim closes it (the header button is the way in — the leading edge swipe stays the system's).
  Contents: Pairing (show the pairing QR, pair another installation), Control preferences (haptics,
  keep screen awake, status notifications; fine mode is always two fingers), Developer › Debug,
  About (what's new, help & support, app version), Account (forget this installation). No
  appearance switch — the theme mode ships in the config.
- **Installation**: iPhone → system sheet (large detent); iPad → inspector panel on the trailing side
  (390 pt, round Close × top-right, no dimming). Contents: name and status with stats (state, FPS, devices, uptime), pult switcher, quick
  actions (Flash, Restart, Blackout with hold-to-confirm), modes (Idle, optional Pause), a System
  row that pushes the standard System screen (output size, debug, seed; ADR-018) and an Activity
  row that pushes the activity list.
- **Dialogs** are content inside the system sheet (iPhone medium detent) or form sheet (iPad); the
  system provides grabber, Close and material. Cancel / Close leading, one prominent action trailing.
- **Menus**: long-press = system context menu with a preview; destructive item last, in red. (iOS:
  the SwiftUI menu through `@expo/ui`; the web pult and Android draw the same menu in-app.) Choices
  from a button = pop-up button (one of many) or pull-down menu (commands, 3+ items).
- **No confirmation for undoable actions**: deleting a prompt deletes immediately and shows an Undo
  toast. Confirmation only for actions that cannot be undone (action sheet on iPhone, popover on iPad).
- **Launch**: the system launch screen is a plain background matching the first screen (no logo or
  text). The client-branded loading screen (logo over a full-screen image) shows after launch while
  the app connects; connection problems are shown inline, not as an alert at startup.
- **Take control** is not in a drawer: while a device is view-only, every pult screen shows the
  "View only — Take control" banner in the header.
- Depth in the UI is meaningful: **inset** = active/pressed state or the bed under a control
  (tracks, toggle beds, inputs, tab bars); **raised** = interactive elements and top-level cards and
  panels; **flat** = information nested inside a card (chips, stat tiles, icon wells). Neon glow
  appears only on lit values and on press — never on resting buttons.
