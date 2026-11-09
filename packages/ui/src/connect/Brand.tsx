import * as React from "react";
import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { Text } from "../components/ui/text";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Figma `Backdrop`: a full-screen client image (the installation itself) with a legibility gradient
 * into the background colour, behind the client-branded loading screen. Without an image it is the
 * plain background. Children are laid over it.
 */
export function Backdrop({
  source,
  children,
  label,
}: {
  source?: ImageSourcePropType;
  children?: React.ReactNode;
  /** Describe the image for VoiceOver; omit when it is decorative. */
  label?: string;
}) {
  const t = useTheme();
  return (
    <View className="bg-background flex-1 overflow-hidden">
      {source ? (
        <Image
          source={source}
          resizeMode="cover"
          // An explicit size: a bundled asset's own width / height would win over absoluteFill.
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
          accessible={!!label}
          accessibilityLabel={label}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          {/* Figma Backdrop › Legibility: a linear wash top → bottom and a centre vignette. */}
          <LinearGradient id="legibility" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.color.background} stopOpacity={0.6} />
            <Stop offset="0.3" stopColor={t.color.background} stopOpacity={0.45} />
            <Stop offset="0.6" stopColor={t.color.background} stopOpacity={0.55} />
            <Stop offset="1" stopColor={t.color.background} stopOpacity={0.95} />
          </LinearGradient>
          <RadialGradient id="centre" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
            <Stop offset="0" stopColor={t.color.background} stopOpacity={0.55} />
            <Stop offset="0.7" stopColor={t.color.background} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#centre)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#legibility)" />
      </Svg>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}

/**
 * Figma Client Logo: name bold 44 pt, tracking 18 %; tagline semibold 13 pt at 70 %. `xl` is the
 * iPad loading screen's instance (scaled 125 %: 55 pt, tagline 16.25 / 22.5).
 */
const LOGO = {
  sm: { h: 32, title: "text-xl", sub: "text-[9px]", track: 4, gap: "gap-1" },
  lg: { h: 64, title: "text-[44px] leading-[53px]", sub: "text-sm", track: 7.92, gap: "gap-1.5" },
  xl: {
    h: 80,
    title: "text-[55px] leading-[67px]",
    sub: "text-[16.25px] leading-[22.5px]",
    track: 9.9,
    gap: "gap-2",
  },
};

/**
 * Figma `Client Logo` (white over the client's image, like the Figma component): the installation's logo from the config (`theme.logo`), or — until the studio
 * ships one — its name set in the brand font with an optional subtitle ("AURORA · HALL · LIVE").
 * Part of the studio's branding; clients never change it.
 */
export function ClientLogo({
  name,
  subtitle,
  source,
  size = "lg",
}: {
  name: string;
  subtitle?: string;
  source?: ImageSourcePropType;
  size?: keyof typeof LOGO;
}) {
  const s = LOGO[size];
  // Figma: white (70 % for the tagline) over the dark backdrop; the light theme keeps its ink.
  const dark = useTheme().mode === "dark";
  const ink = dark ? "text-white" : "text-foreground";
  const inkSub = dark ? "text-white/70" : "text-foreground/70";
  if (source)
    return (
      <Image
        source={source}
        resizeMode="contain"
        style={{ height: s.h, width: s.h * 4 }}
        accessibilityRole="image"
        accessibilityLabel={name}
      />
    );
  return (
    <View
      className={cn("items-center", s.gap)}
      accessible
      accessibilityRole="header"
      accessibilityLabel={subtitle ? `${name}, ${subtitle}` : name}
    >
      <Text
        className={cn("font-bold uppercase", ink, s.title)}
        style={{ letterSpacing: s.track }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {name}
      </Text>
      {subtitle ? (
        <Text className={cn("font-semibold uppercase", inkSub, s.sub)}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
