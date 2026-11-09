import "./skia-web";
import "@osc/tokens/global.css";
import type { Decorator, Preview } from "@storybook/react-native-web-vite";
import { PortalHost } from "@rn-primitives/portal";
import { ThemeProvider } from "@osc/ui";
import { STORY_BRANDS, type StoryBrandId } from "@osc/ui/stories/brands";
import { withPlainHandlers } from "@osc/ui/stories/handlers";
import { layoutViolations } from "@osc/ui/stories/layout";
import * as React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Every story renders inside the same providers as the app: gestures, safe area, the client brand
 * (ThemeProvider → CSS variables for NativeWind + useTheme() for Skia) and a portal host for overlays.
 */
const withProviders: Decorator = (Story, ctx) => {
  const mode = (ctx.globals.theme ?? "dark") as "dark" | "light";
  const brandId = (ctx.globals.brand ?? "otakoyi") as StoryBrandId;
  const brand = React.useMemo(
    () => ({ ...(STORY_BRANDS[brandId] ?? STORY_BRANDS.otakoyi)?.brand, mode }),
    [brandId, mode],
  );
  const fullscreen = ctx.parameters.layout === "fullscreen";
  // Spies get plain data, not RN Web events (see stories/handlers.ts).
  const args = React.useMemo(() => withPlainHandlers(ctx.args), [ctx.args]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider brand={brand} style={{ minHeight: fullscreen ? "100vh" : undefined }}>
          <View
            style={{
              padding: fullscreen ? 0 : 24,
              flex: 1,
              alignItems: fullscreen ? "stretch" : "flex-start",
            }}
          >
            <Story args={args} />
          </View>
          <PortalHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// Layout sensor: `pnpm test-storybook` calls it after every story (see stories/layout.ts).
(globalThis as { __oscLayout?: typeof layoutViolations }).__oscLayout = layoutViolations;

const preview: Preview = {
  decorators: [withProviders],
  tags: ["autodocs"],
  globalTypes: {
    theme: {
      description: "Theme mode",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "light", title: "Light", icon: "sun" },
        ],
        dynamicTitle: true,
      },
    },
    brand: {
      description: "Client brand (primary, accent). Status colours never change.",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: Object.entries(STORY_BRANDS).map(([value, b]) => ({ value, title: b.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "dark", brand: "otakoyi" },
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    controls: { expanded: true, sort: "requiredFirst" },
    a11y: { test: "todo" },
    viewport: {
      options: {
        phone: {
          name: "Phone · 390×844 (lobby controller)",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet · 1180×820 (live VJ pult)",
          styles: { width: "1180px", height: "820px" },
          type: "tablet",
        },
      },
    },
    options: {
      storySort: {
        order: [
          "Docs",
          ["Introduction", "Guidelines", "Changelog"],
          "Foundations",
          "Chrome",
          "Forms",
          "Containers",
          "Media & actions",
          "Menus",
          "Connect",
          "Controls",
          "Pult",
          "Patterns",
          "Primitives (Reusables)",
        ],
      },
    },
  },
};

export default preview;
