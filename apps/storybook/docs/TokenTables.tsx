import { baseTokens, boxShadow, createTheme, type Depth } from "@osc/tokens";
import * as React from "react";

/** Live token tables for the Introduction page, generated from @osc/tokens (never hand-copied). */
const cell: React.CSSProperties = {
  padding: "6px 10px",
  borderBottom: "1px solid #8882",
  fontSize: 13,
};
const mono: React.CSSProperties = { fontFamily: "JetBrains Mono, monospace", fontSize: 12 };

export function ColorTable() {
  const dark = createTheme({ mode: "dark" });
  const light = createTheme({ mode: "light" });
  const rows: Array<[string, string, string]> = [
    ...(Object.keys(dark.color) as Array<keyof typeof dark.color>).map(
      (k) => [`color.${k}`, dark.color[k], light.color[k]] as [string, string, string],
    ),
    ...(["track", "fill", "tick"] as const).map(
      (k) => [`control.${k}`, dark.control[k], light.control[k]] as [string, string, string],
    ),
    ...(Object.keys(dark.status) as Array<keyof typeof dark.status>).map(
      (k) => [`status.${k}`, dark.status[k], light.status[k]] as [string, string, string],
    ),
  ];
  const swatch = (hex: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: hex,
          border: "1px solid #8884",
        }}
      />
      <span style={mono}>{hex}</span>
    </span>
  );
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th style={cell}>Token</th>
          <th style={cell}>Dark</th>
          <th style={cell}>Light</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, d, l]) => (
          <tr key={name}>
            <td style={{ ...cell, ...mono }}>{name}</td>
            <td style={cell}>{swatch(d)}</td>
            <td style={cell}>{swatch(l)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DepthTable() {
  const depths: Depth[] = ["raised", "raisedSm", "inset", "pressed", "flat"];
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {(["dark", "light"] as const).map((mode) => {
        const t = createTheme({ mode });
        return (
          <div
            key={mode}
            style={{
              background: t.color.background,
              padding: 24,
              borderRadius: 16,
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            {depths.map((d) => (
              <div
                key={d}
                style={{
                  width: 96,
                  height: 64,
                  borderRadius: 16,
                  background:
                    d === "inset" || d === "pressed"
                      ? t.control.track
                      : d === "flat"
                        ? t.color.surfaceRaised
                        : t.color.surface,
                  boxShadow: boxShadow(t, d),
                  color: t.color.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...mono,
                }}
              >
                {d}
              </div>
            ))}
            <div
              style={{
                width: 96,
                height: 64,
                borderRadius: 16,
                background: t.color.primary,
                boxShadow: boxShadow(t, "pressed", "signal"),
                color: t.color.onPrimary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...mono,
              }}
            >
              glow
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScaleTable() {
  const groups: Array<[string, Record<string, number | string>]> = [
    ["space", baseTokens.space],
    ["radius", baseTokens.radius],
    ["font.size", baseTokens.font.size],
    ["touch", baseTokens.touch],
    ["motion.duration", baseTokens.motion.duration],
  ];
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {groups.map(([g, values]) => (
          <tr key={g}>
            <td style={{ ...cell, ...mono, whiteSpace: "nowrap" }}>{g}</td>
            <td style={{ ...cell, ...mono }}>
              {Object.entries(values)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
