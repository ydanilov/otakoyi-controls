// react-native-web has no AssetRegistry; Skia's web build only looks images up through it.
// Metro (the web pult) provides one; under Vite this minimal registry is enough for Storybook.
const assets = [];
export function registerAsset(asset) {
  return assets.push(asset);
}
export function getAssetByID(id) {
  return assets[id - 1];
}
export default { registerAsset, getAssetByID };
