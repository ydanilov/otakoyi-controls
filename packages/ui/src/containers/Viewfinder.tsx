import * as React from "react";
import { View } from "react-native";
import { Surface } from "../ds/depth";
import { useTheme } from "../theme/ThemeProvider";

const SIZE = { phone: 264, tablet: 420 } as const;

/**
 * Figma `Viewfinder`: the frame drawn over the camera preview while scanning a pairing QR
 * (ADR-012). Lit corners and a scan line; the camera view goes in `children`.
 */
export function Viewfinder({
  size = "phone",
  children,
}: {
  size?: keyof typeof SIZE;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  const s = SIZE[size];
  const arm = Math.round(s * 0.17);
  const w = 4;
  const corner = (pos: { top?: number; bottom?: number; left?: number; right?: number }) => {
    const v = pos.top !== undefined ? "top" : "bottom";
    const h = pos.left !== undefined ? "left" : "right";
    return (
      <View style={{ position: "absolute", width: arm, height: arm, ...pos }}>
        <Surface
          depth="flat"
          glow="signal"
          radius="sm"
          fill={false}
          style={{
            position: "absolute",
            [v]: 0,
            [h]: 0,
            width: arm,
            height: w,
            backgroundColor: t.control.fill,
          }}
        />
        <Surface
          depth="flat"
          glow="signal"
          radius="sm"
          fill={false}
          style={{
            position: "absolute",
            [v]: 0,
            [h]: 0,
            width: w,
            height: arm,
            backgroundColor: t.control.fill,
          }}
        />
      </View>
    );
  };
  return (
    <View
      className="bg-control-track overflow-hidden rounded-lg"
      style={{ width: s, height: s }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Point the camera at the QR code on the installation screen"
    >
      {children}
      {corner({ top: 8, left: 8 })}
      {corner({ top: 8, right: 8 })}
      {corner({ bottom: 8, left: 8 })}
      {corner({ bottom: 8, right: 8 })}
      <Surface
        depth="flat"
        glow="signal"
        radius="full"
        fill={false}
        style={{
          position: "absolute",
          left: arm * 0.6,
          right: arm * 0.6,
          top: s / 2 - 1,
          height: 2,
          backgroundColor: t.control.fill,
        }}
      />
    </View>
  );
}
