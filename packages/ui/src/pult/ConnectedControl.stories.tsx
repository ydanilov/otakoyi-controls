import { parseConfig } from "@osc/schema";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect, waitFor } from "storybook/test";
import { Text } from "../components/ui/text";
import { ControlServicesProvider } from "../platform/services";
import { componentDocs } from "../stories/docs";
import { storyServices } from "../stories/services";
import { ConnectedControl } from "./ConnectedControl";
import { PultProvider } from "./context";
import { PultStore } from "./store";

/** Feedback messages per control in the story, and the gap between them (a bridge at ~30 Hz). */
const TICKS = 8;
const TICK_MS = 33;

const CONTROLS = [
  { id: "audio", type: "meter", label: "Audio", feedback: "/wall/audio/level" },
  { id: "fps", type: "label", label: "FPS", feedback: "/sys/fps" },
  { id: "position", type: "xy", label: "Focus point", address: "/wall/focus" },
  { id: "intensity", type: "fader", label: "Intensity", address: "/wall/intensity" },
  { id: "zoom", type: "knob", label: "Zoom", address: "/live/zoom" },
] as const;

/** What the installation (or another device) reports for each control at tick `i`. */
const valueAt = (id: string, i: number): unknown => {
  const s = (k: number) => 0.5 + 0.4 * Math.sin(i / k);
  switch (id) {
    case "audio":
      // Rising: the peak follows the level (a falling peak redraws on its own timer).
      return (0.9 * i) / TICKS;
    case "fps":
      return (58 + (i % 3)).toFixed(1);
    case "position":
      return { x: s(3), y: s(5) };
    case "hue":
      return (i * 13) % 360;
    case "cam":
      return { x: s(3) - 0.5, y: s(4) - 0.5 };
    case "tint":
      return `#${((i * 0x10307) & 0xffffff).toString(16).padStart(6, "0").toUpperCase()}`;
    default:
      return s(4);
  }
};

/**
 * The pult's continuous and feedback-only controls wired to a store that receives a new value for
 * every control on every message, starting right after mount (as after the bridge's welcome).
 * Counts React commits: one feedback message must cost one commit — a control that copies `value`
 * into state from an effect costs two, and on a phone that ends in "Maximum update depth exceeded".
 */
function FeedbackRate({ feed = true }: { feed?: boolean }) {
  const store = React.useMemo(() => {
    const parsed = parseConfig({
      schemaVersion: 2,
      installation: { id: "rate", name: "Feedback rate", revision: 1 },
      targets: [{ id: "td", name: "TD", protocol: "udp", host: "auto", port: 7000 }],
      pults: [
        {
          id: "p",
          name: "Rate",
          pages: [
            {
              id: "main",
              title: "Main",
              controls: CONTROLS,
              layout: {
                phone: Object.fromEntries(
                  CONTROLS.map((c, i) => [c.id, { x: 0, y: i * 4, w: 12, h: 4 }]),
                ),
                tablet: Object.fromEntries(
                  CONTROLS.map((c, i) => [
                    c.id,
                    { x: (i % 4) * 3, y: Math.floor(i / 4) * 4, w: 3, h: 4 },
                  ]),
                ),
              },
            },
          ],
        },
      ],
    });
    if (!parsed.ok) throw new Error("feedback-rate config invalid");
    return new PultStore(parsed.config, parsed.config.pults[0]!, { send: () => {} });
  }, []);
  /** React commits so far (counted by the preview's test hook, `.storybook/preview-head.html`). */
  const commits = {
    get current() {
      return (globalThis as { __oscCommits?: number }).__oscCommits ?? NaN;
    },
  };
  const [result, setResult] = React.useState<string>("feeding…");
  React.useEffect(() => {
    if (!feed) return;
    let i = 0;
    let start = 0;
    const tick = () => {
      if (i === 0) start = commits.current;
      if (i === TICKS) {
        // Let anything an effect scheduled land before counting.
        setTimeout(() => setResult(`messages ${TICKS} · commits ${commits.current - start}`), 500);
        return;
      }
      i++;
      for (const c of CONTROLS) store.set(c.id, valueAt(c.id, i) as never);
      setTimeout(tick, TICK_MS);
    };
    const t = setTimeout(tick, 0);
    return () => clearTimeout(t);
  }, [store, feed]);
  const services = React.useMemo(storyServices, []);
  return (
    <ControlServicesProvider value={services}>
      <PultProvider store={store}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {store.controls().map((c) => (
              <View key={c.id} style={{ width: 200, height: c.type === "label" ? 80 : 170 }}>
                <ConnectedControl control={c} studio={false} />
              </View>
            ))}
          </View>
          <Text
            className="text-muted-foreground font-mono text-xs"
            accessibilityLabel="Feedback rate"
          >
            {result}
          </Text>
        </View>
      </PultProvider>
    </ControlServicesProvider>
  );
}

const meta = {
  title: "Pult/Connected Control",
  component: FeedbackRate,
  args: { feed: true },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          purpose:
            "One control wired to the pult's store (`useControlValue`, mode, `enabledWhen`): what the pult renders for every config control.",
          use: ["Inside `PultProvider` — the Pult Pager does it for every control of a page."],
          avoid: ["Stories of a single control's looks — use the control's own story."],
          behaviour: [
            "Re-renders when the store value changes: another device, installation feedback (meters and labels at 10–30 Hz).",
            "One store change = one React commit. Controls derive their readout during render (`useHeldValue`, the meter's peak) and never copy `value` into state from an effect — that doubles the commits and React aborts with “Maximum update depth exceeded” on a phone.",
            "Disabled in view-only mode or while `enabledWhen` does not hold; studio-only controls are hidden outside a studio session.",
          ],
          a11y: ["Each control carries its own role and label."],
          figma: { component: "— (runtime wiring, no Figma component)" },
        }),
      },
    },
  },
} satisfies Meta<typeof FeedbackRate>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Regression (fix/feedback-echo-loop): every control gets a new value on every message, right after
 * mount. Each message must cost one commit, not one plus an effect's.
 */
export const HighRateFeedback: Story = {
  play: async ({ canvas }) => {
    const out = await canvas.findByLabelText("Feedback rate", {}, { timeout: 8000 });
    await waitFor(() => expect(out.textContent).toMatch(/^messages/), { timeout: 45000 });
    const commits = Number(/commits (\d+)/.exec(out.textContent ?? "")?.[1]);
    await expect(commits).toBeLessThanOrEqual(TICKS + 2);
  },
};
export const Idle: Story = { args: { feed: false } };
