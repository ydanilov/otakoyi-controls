import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-native-web-vite";

const require = createRequire(import.meta.url);
/** CanvasKit (Skia for web) is served next to the preview, like the web pult serves it. */
const canvaskit = join(dirname(require.resolve("canvaskit-wasm")), "full");
const fontDir = (pkg: string) => dirname(require.resolve(`${pkg}/package.json`));

const config: StorybookConfig = {
  stories: ["../docs/**/*.mdx", "../../../packages/ui/src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-native-web-vite",
    options: {
      // Packages that ship untranspiled RN / Flow / JSX code.
      modulesToTranspile: [
        "react-native-reanimated",
        "react-native-worklets",
        "react-native-gesture-handler",
        "react-native-css-interop",
        "react-native-svg",
        "react-native-safe-area-context",
        "react-native-screens",
        "nativewind",
        "@rn-primitives",
        "@shopify/react-native-skia",
        "phosphor-react-native",
        "expo-modules-core",
      ],
      pluginReactOptions: {
        // NativeWind 4: className → style through react-native-css-interop.
        jsxImportSource: "nativewind",
        babel: {
          plugins: [
            "@babel/plugin-proposal-export-namespace-from",
            // Reanimated 4 worklets (the plugin formerly shipped as react-native-reanimated/plugin).
            "react-native-worklets/plugin",
          ],
        },
      },
    },
  },
  staticDirs: [
    { from: canvaskit, to: "/" },
    { from: fontDir("@expo-google-fonts/inter"), to: "/fonts/inter" },
    { from: fontDir("@expo-google-fonts/jetbrains-mono"), to: "/fonts/jetbrains-mono" },
  ],
  core: { disableTelemetry: true },
  typescript: { reactDocgen: "react-docgen-typescript" },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    // The framework adds vite-tsconfig-paths, which scans every tsconfig in the monorepo and fails on
    // apps/mobile's `expo/tsconfig.base`. The workspace resolves through package exports instead.
    config.plugins = (config.plugins ?? [])
      .flat()
      .filter(
        (p) => !(p && typeof p === "object" && "name" in p && p.name === "vite-tsconfig-paths"),
      );
    return mergeConfig(config, {
      define: {
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
        "process.env.EXPO_OS": JSON.stringify("web"),
        global: "globalThis",
      },
      plugins: [
        {
          name: "osc:rn-web-shims",
          enforce: "pre",
          resolveId(id: string) {
            if (
              /^react-native(-web)?\/Libraries\/Image\/AssetRegistry$/.test(id) ||
              id === "@react-native/assets-registry/registry"
            )
              return fileURLToPath(new URL("./shims/AssetRegistry.js", import.meta.url));
            return null;
          },
        },
      ],
    });
  },
};

export default config;
