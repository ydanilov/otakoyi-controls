// Tailwind compiles the NativeWind classes used by @osc/ui into CSS for react-native-web.
module.exports = {
  plugins: { tailwindcss: { config: require.resolve("./tailwind.config.cjs") } },
};
