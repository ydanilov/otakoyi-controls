# 006 — No vertical scrolling; controls packed at their Figma size

**Status:** Accepted

**Decision.** A pult screen never scrolls vertically. The layout follows the Figma client page
(ADR-014) exactly (`layoutPage` in `packages/ui/src/pult/layout.ts`, tokens `control.pult*`):

- **Packing.** The page's grid (12 columns, rows) gives each control or panel its columns and its
  order; rows only order. Items are packed from the top: each sits one gap below the lowest item
  above it in its columns. Phone: 16 pt sides, 12 pt top / bottom, 18 pt gaps. Tablet: 20 pt
  sides, 10 pt top / bottom, 16 pt gaps (the Console frame).
- **Heights.** Controls and Console-Panel patterns with a Figma height keep it: horizontal fader
  82, knob 186 / 138 compact, segmented 78 (56 without a label), pad / toggle / hold 88 / 64,
  picture pad 168 / 120, list rows 56 + 1, panels their pattern height (`naturalHeightFor`,
  `panelMinHeight`). Stretchable controls (vertical fader, XY pad, meter, button grid, scene list,
  colour picker, thumbstick, prompt; the Fader Bank) share their columns' free height by grid rows.
- **Free space.** On a phone, fixed controls stay at their size and the free space stays at the
  bottom. On a tablet, the last item of every column stretches to the bottom (Console columns).
- **Screens.** Controls that share grid rows form a band; bands are never cut. A band that does
  not fit under the previous ones (stretchable items at 40 pt per row) starts a new screen; screens
  swipe horizontally with tabs (`<Page> 1`, `<Page> 2`) and page dots. A single band taller than
  the screen is scaled to fit (up to one gap of overflow into the bottom padding is kept).
