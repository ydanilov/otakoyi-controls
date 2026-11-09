import demoJson from "@osc/schema/examples/demo-installation.json";
import tryJson from "@osc/schema/examples/try-the-demo.json";
import templateJson from "../stories/fixtures/template.config.json";
import { parseConfig } from "@osc/schema";
import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import * as React from "react";
import { View } from "react-native";
import { expect } from "storybook/test";
import { ControlServicesProvider } from "../platform/services";
import { componentDocs } from "../stories/docs";
import { storyServices } from "../stories/services";
import { ThemeProvider } from "../theme/ThemeProvider";
import { PultPager, PultProvider } from "./PultRenderer";
import { PultStore } from "./store";

/** Pult pages mount Skia canvases; on a busy CI runner the first paint can take several seconds. */
const SLOW = { timeout: 8000 };

/** A toggle and a knob that "Depends on" it (`enabledWhen`, Figma annotation). */
const dependsJson = {
  schemaVersion: 2,
  installation: { id: "depends", name: "Depends on", revision: 1 },
  targets: [{ id: "td", name: "TD", protocol: "udp", host: "auto", port: 7000 }],
  pults: [
    {
      id: "p",
      name: "Audio",
      pages: [
        {
          id: "audio",
          title: "Audio",
          controls: [
            { id: "audio-react", type: "toggle", label: "Audio react", address: "/audio/on" },
            {
              id: "gain",
              type: "knob",
              label: "Gain",
              address: "/audio/gain",
              enabledWhen: [{ control: "audio-react", equals: 1 }],
            },
          ],
          layout: {
            phone: {
              "audio-react": { x: 0, y: 0, w: 12, h: 2 },
              gain: { x: 0, y: 2, w: 12, h: 4 },
            },
            tablet: {
              "audio-react": { x: 0, y: 0, w: 4, h: 2 },
              gain: { x: 4, y: 0, w: 4, h: 4 },
            },
          },
        },
      ],
    },
  ],
};

function Demo({
  pultIndex = 0,
  height = 700,
  config = "sample",
}: {
  pultIndex?: number;
  height?: number;
  /**
   * `sample`: every control type; `try`: the Figma "Try the demo" installation (panels);
   * `depends`: a knob enabled by a toggle (`enabledWhen`).
   */
  config?: "sample" | "try" | "depends" | "template";
}) {
  const store = React.useMemo(() => {
    const parsed = parseConfig(
      config === "try"
        ? tryJson
        : config === "depends"
          ? dependsJson
          : config === "template"
            ? templateJson
            : demoJson,
    );
    if (!parsed.ok) throw new Error("demo config invalid");
    const pult = parsed.config.pults[pultIndex] ?? parsed.config.pults[0]!;
    return new PultStore(parsed.config, pult, { send: () => {} });
  }, [pultIndex, config]);
  const services = React.useMemo(storyServices, []);
  const pager = (
    <View style={{ height }}>
      <ControlServicesProvider value={services}>
        <PultProvider store={store}>
          <PultPager pages={store.pult.pages} />
        </PultProvider>
      </ControlServicesProvider>
    </View>
  );
  // An exported client config carries its Figma Brand mode as `theme` (the app applies it the
  // same way); the toolbar brand applies to the other stories.
  return config === "template" ? (
    <ThemeProvider brand={store.config.theme}>{pager}</ThemeProvider>
  ) : (
    pager
  );
}

const meta = {
  title: "Pult/Pult Pager",
  component: Demo,
  args: { pultIndex: 0, height: 700 },
  parameters: {
    layout: "fullscreen",
    docs: {
      story: { inline: false, height: "720px" },
      description: {
        component: componentDocs({
          purpose:
            "The pult body: renders a config's pages from the control registry. Pages never scroll; they split into horizontally swiped screens (ADR-006).",
          use: [
            "The pult screen, under the Pult Header, with Settings / Installation presented over it.",
          ],
          avoid: ["Anything that is not a config page."],
          do: ["Review the phone viewport too — the grid re-flows for phones."],
          dont: ["Don't wrap it in a ScrollView."],
          anatomy: [
            "Screen tabs (when a page splits)",
            "Horizontal pager (the screen on show and its neighbours are mounted)",
            "Grid of controls and Console-Panel patterns (12 columns, rows stretch to the height)",
            "Panels: Fader Bank, Knob Group, Knob Row, Layer Toggles, Camera Control, Scene Bar, Show Actions, List — max width 640 / 480 / 560, centred when capped, never shorter than their content",
          ],
          behaviour: [
            "Controls are packed from the top at their Figma heights (phone 18 pt gaps, free space below; tablet 16 pt gaps, each column's last item to the bottom); a page that does not fit splits into screens (`layoutPage`, unit-tested, ADR-006).",
            "Phones re-flow controls to half/full width (`reflowForPhone`).",
            "Controls read/write the PultStore; view-only disables them.",
            "`enabledWhen` (Figma “Depends on”): the control is drawn Disabled until every condition holds.",
          ],
          a11y: ["Each control carries its own role; the pager is swipeable and tabbable."],
          content: ["Page titles ≤ 12 characters (tabs)."],
          figma: { component: "Screens / client pages (ADR-014 exporter input)" },
        }),
      },
    },
  },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DemoPult: Story = {};
export const Phone: Story = { globals: { viewport: { value: "phone" } } };
/** The demo's live pult: picture pad, compact knobs and sized pads. */
export const LivePult: Story = { args: { pultIndex: 2 } };

/** Figma Demo › Tablet / 03 Demo pult: the VJ console's Mix page from Console-Panel patterns. */
export const PanelsVjConsole: Story = {
  name: "Panels · VJ console (Try the demo)",
  args: { config: "try", pultIndex: 0, height: 640 },
  globals: { viewport: { value: "tablet" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByTestId("panel-mix", {}, SLOW)).toBeTruthy();
    await expect(canvas.getByTestId("panel-shape")).toBeTruthy();
    await expect(canvas.getByText("Layer 3")).toBeTruthy();
  },
};
/** Figma Demo › Phone / 03 Demo pult: the Lobby wall's Live page (switches as a List panel). */
export const PanelsLobbyPhone: Story = {
  name: "Panels · Lobby wall (phone)",
  args: { config: "try", pultIndex: 2, height: 640 },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("switch", { name: "Live data" }, SLOW)).toBeTruthy();
  },
};

/** Figma "Depends on": Gain is Disabled until Audio react is on (`enabledWhen`). */
export const DependsOn: Story = {
  name: "Depends on (enabledWhen)",
  args: { config: "depends", height: 420 },
  play: async ({ canvas, userEvent }) => {
    const gain = await canvas.findByRole("slider", { name: "Gain" }, SLOW);
    await expect(gain).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(canvas.getByRole("switch", { name: "Audio react" }));
    await expect(canvas.getByRole("slider", { name: "Gain" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};

/**
 * Client · Template as the exporter writes it (`tools/figma-export/fixtures/template.config.json`):
 * its sections use the Figma Brand mode "Aurora · Template", so the pult is teal / lavender.
 */
export const TemplateAurora: Story = {
  name: "Template · Aurora (exported from Figma)",
  args: { config: "template", height: 640 },
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("switch", { name: "Live data" }, SLOW)).toBeTruthy();
  },
};
