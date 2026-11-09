/**
 * Tailwind preset for every surface that renders @osc/ui (mobile app, web pult, Storybook).
 * Colours, spacing, radius and type come from @osc/tokens; brand colours are CSS variables
 * that ThemeProvider overrides at runtime with the installation's theme.
 */
const tokens = require("@osc/tokens/tailwind-preset");
const { hairlineWidth } = require("nativewind/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  presets: [require("nativewind/preset"), tokens],
  theme: { extend: { borderWidth: { hairline: hairlineWidth() } } },
  plugins: [require("tailwindcss-animate")],
};
