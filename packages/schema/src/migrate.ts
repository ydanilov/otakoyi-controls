import { reflowForPhone, type Cell } from "./layout";

/**
 * Schema v1 → v2 (ADR-014, ADR-015). Runs before preset resolution and validation, so the rest of
 * the code only ever sees v2.
 *
 * v1: every control carries its own `grid` (the tablet layout); phones re-flowed it at runtime.
 * v2: a page holds its controls once and a layout per form factor:
 *     `layout: { phone: { [controlId]: Grid }, tablet: { [controlId]: Grid } }`.
 *
 * Migration: `grid` becomes the tablet placement, and the phone placement is the same grid re-flowed
 * for phones (half / full rows) — exactly what the v1 app showed on a phone. `grid` is removed from
 * the control. A v1 colour picker without `format` keeps v1's default, `rgbFloat` (one message),
 * so the installation keeps receiving what it was built for. Anything that is not a recognisable v1 config is returned unchanged for the schema
 * to report.
 */
export function migrateConfig(input: unknown): unknown {
  if (!isObj(input) || input.schemaVersion !== 1 || !Array.isArray(input.pults)) return input;
  const pults = input.pults.map((pult) => {
    if (!isObj(pult) || !Array.isArray(pult.pages)) return pult;
    const pages = pult.pages.map((page) => {
      if (!isObj(page) || !Array.isArray(page.controls) || page.layout !== undefined) return page;
      const tablet = new Map<string, Cell>();
      const controls = page.controls.map((c) => {
        if (!isObj(c)) return c;
        const { grid, ...rest } = c;
        if (typeof c.id === "string" && isCell(grid)) tablet.set(c.id, grid);
        // v1 colour pickers sent one `r g b` message by default; v2 defaults to three addresses.
        if (c.type === "colorPicker" && rest.format === undefined) rest.format = "rgbFloat";
        return rest;
      });
      const columns = typeof page.columns === "number" ? page.columns : 12;
      return {
        ...page,
        controls,
        layout: {
          tablet: Object.fromEntries(tablet),
          phone: Object.fromEntries(reflowForPhone(tablet, columns)),
        },
      };
    });
    return { ...pult, pages };
  });
  return { ...input, schemaVersion: 2, pults };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isCell = (v: unknown): v is Cell =>
  isObj(v) &&
  (["x", "y", "w", "h"] as const).every((k) => typeof v[k] === "number" && Number.isInteger(v[k]));
