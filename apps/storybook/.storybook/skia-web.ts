// Skia's web build creates its API object from `global.CanvasKit` when the module is first
// evaluated, so CanvasKit must be loaded before anything imports @shopify/react-native-skia.
// preview.tsx imports this module first; the top-level await holds back every later import.
// (The web pult does the same in apps/mobile/index.web.ts.)
import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web/LoadSkiaWeb";

await LoadSkiaWeb({ locateFile: (file: string) => `./${file}` });
