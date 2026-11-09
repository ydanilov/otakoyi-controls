# 004 — Design system

**Status:** Accepted

**Decision.** App chrome uses React Native Reusables (shadcn API, components copied into
`packages/ui`) on NativeWind. Continuous controls (fader, knob, XY, meter, hold ring) are custom Skia
components; discrete controls are Views. All read `@osc/tokens`; the client brand is applied at
runtime through `createTheme(brand)` and NativeWind `vars()`.

**Branding is part of the studio's delivery.** Colour scheme, light/dark mode (`theme.mode`), logo, loading-screen image (`theme.splash`), font and
any white-label work are set by the studio (Figma `Brand` mode → exported config, ADR-014) and
shipped as a config revision. The client never uploads a logo, changes colours or edits the brand
in the app; there is no UI for it. Changing a client's brand = a new config revision from the studio.

**Consequences.** Figma library mirrors these names. Status colours stay outside the brand layer.
The app has no brand or theme editor; the only appearance-related input is what the config ships.
