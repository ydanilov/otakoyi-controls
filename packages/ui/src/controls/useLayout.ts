import * as React from "react";
import type { LayoutChangeEvent } from "react-native";

/** Measured size of a control body, used to map touches and size Skia canvases. */
export function useLayout() {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
  }, []);
  return { size, onLayout };
}
