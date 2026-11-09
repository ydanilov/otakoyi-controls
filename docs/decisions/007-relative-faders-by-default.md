# 007 — Relative faders by default

**Status:** Accepted

**Context.** Research (TouchOSC, Open Stage Control): absolute faders jump to the finger, so an
accidental touch in a dark venue can flash or kill a wall.

**Decision.** Faders default to `response: "relative"` — a touch never changes the value; dragging moves
it 1:1 with the track. `absolute` is opt-in per control. Faders and knobs share: two-finger fine mode
(`fineFactor`, ×0.2), shown as a badge with the coefficient (`×0.2`) while the tick marks (fader ticks,
jog ribs, knob tick ring) spread ×1.8 around the thumb; double-tap resets to `default`
(`doubleTapReset`). Adding or lifting a finger re-anchors the drag, so the value never jumps.

**States.** Active (finger down or dragging) = the full neon glow on the lit value; at rest the lit
value keeps ~40 % of it (animated ~180 ms). The numbers live in `@osc/controls` (`states.ts`).
