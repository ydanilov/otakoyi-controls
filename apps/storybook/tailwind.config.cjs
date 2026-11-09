/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["../../packages/ui/src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
  presets: [require("@osc/ui/tailwind-preset")],
};
