import * as React from "react";
import { ScrollView, View } from "react-native";
import { Text } from "../components/ui/text";
import { Surface } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import type { PhosphorIcon } from "../ds/icons";

/**
 * Figma `Dialog` (Container=Sheet | Modal): the **content** of a focused task — icon, title,
 * description, body and actions. It has no background, grabber or scrim of its own: it is rendered
 * inside the system presentation (ADR-013, HIG) — an iPhone sheet at the medium detent or the iPad
 * form sheet — which brings material, grabber and dimming. Present the route with
 * `presentationFor("dialog", width).options` (expo-router `Stack.Screen options`).
 * Actions: Cancel / secondary first (leading), one prominent action last (trailing).
 */
export function Dialog({
  title,
  description,
  icon,
  children,
  actions,
}: {
  title: string;
  description?: string;
  icon?: PhosphorIcon;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <View className="flex-1 gap-4 px-5 pb-5 pt-6" accessibilityViewIsModal>
      <ScrollView contentContainerClassName="items-center gap-3" bounces={false}>
        {icon && (
          <Surface depth="raisedSm" radius="lg" className="h-16 w-16 items-center justify-center">
            <Glyph icon={icon} tone="signal" size={32} />
          </Surface>
        )}
        <Text
          className="text-foreground text-center text-xl font-semibold"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {description ? (
          <Text className="text-muted-foreground text-center text-sm">{description}</Text>
        ) : null}
        {children}
      </ScrollView>
      {actions ? <View className="flex-row gap-3">{actions}</View> : null}
    </View>
  );
}
