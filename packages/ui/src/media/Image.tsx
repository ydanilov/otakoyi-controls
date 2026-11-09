import * as React from "react";
import { Image, Pressable, View, type ImageSourcePropType } from "react-native";
import { Button } from "../chrome/Button";
import { Text } from "../components/ui/text";
import { Surface, useDepthStyle } from "../ds/depth";
import { Glyph } from "../ds/Glyph";
import { ArrowClockwiseIcon, CloudArrowUpIcon, CropIcon, PlusIcon } from "../ds/icons";
import { StatusLed } from "../ds/Led";
import { uploadLabel } from "../ds/logic";
import { cn } from "../lib/utils";
import { useTheme } from "../theme/ThemeProvider";
import { ProgressRing } from "./ProgressRing";

/** Status capsule laid over an image (LIVE, NOT SENT YET, UPLOADING 64%…). */
function OverlayChip({
  tone,
  label,
}: {
  tone: "signal" | "warning" | "critical" | "offline";
  label: string;
}) {
  return (
    <View className="bg-background/80 absolute left-2 top-2 flex-row items-center gap-1.5 rounded-full px-2 py-0.5">
      <StatusLed tone={tone} size={6} />
      <Text className="text-foreground font-mono text-xs uppercase" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export type ImageTileState = "default" | "selected" | "live" | "uploading" | "failed" | "add";

/**
 * Figma `Image Tile`: one image in the uploads library grid. UI only — uploading and choosing
 * images is the image control's job (feat/new-controls); this component only shows state.
 */
export function ImageTile({
  state = "default",
  source,
  progress = 0,
  onPress,
  label,
  size = 104,
}: {
  state?: ImageTileState;
  source?: ImageSourcePropType;
  /** 0…1 while uploading. */
  progress?: number;
  onPress?: () => void;
  /** VoiceOver name of the image, e.g. its file name. */
  label?: string;
  size?: number;
}) {
  const t = useTheme();
  const glow = useDepthStyle(
    state === "live" ? "raised" : state === "add" ? "flat" : "raisedSm",
    state === "live" ? "signal" : false,
  );
  const a11y =
    state === "add"
      ? "Upload an image"
      : `${label ?? "Image"}${state === "live" ? ", live on screen" : state === "selected" ? ", selected" : state === "uploading" ? `, uploading ${uploadLabel(progress)}` : state === "failed" ? ", upload failed, tap to retry" : ""}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      aria-selected={state === "selected" || state === "live"}
      className={cn(
        "items-center justify-center overflow-hidden rounded-lg",
        state === "add" ? "border-2 border-dashed border-border" : "bg-card",
        (state === "selected" || state === "live") && "border-2 border-control-fill",
        state === "failed" && "border-2 border-destructive",
      )}
      style={[{ width: size, height: size }, glow]}
    >
      {state === "add" ? (
        <View className="items-center gap-1">
          <Glyph icon={PlusIcon} tone="muted" size={24} />
          <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
            Upload
          </Text>
        </View>
      ) : (
        <>
          {source ? (
            <Image
              source={source}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: state === "uploading" || state === "failed" ? 0.45 : 1,
              }}
              resizeMode="cover"
            />
          ) : null}
          {state === "live" && <OverlayChip tone="signal" label="Live" />}
          {state === "uploading" && (
            <View className="items-center justify-center">
              <ProgressRing progress={progress} size={size * 0.42} />
              <Text className="text-foreground absolute font-mono text-xs">
                {uploadLabel(progress)}
              </Text>
            </View>
          )}
          {state === "failed" && (
            <View className="items-center gap-1">
              <Glyph icon={ArrowClockwiseIcon} tone="critical" size={22} />
              <Text className="text-destructive text-xs font-medium uppercase tracking-overline">
                Retry
              </Text>
            </View>
          )}
          {!source && state !== "uploading" && state !== "failed" && (
            <View className="absolute inset-0" style={{ backgroundColor: t.control.track }} />
          )}
        </>
      )}
    </Pressable>
  );
}

export type ImageUploadState =
  "empty" | "selected" | "uploading" | "processing" | "live" | "error" | "disabled";

const STATUS: Partial<
  Record<ImageUploadState, { tone: "signal" | "warning" | "critical" | "offline"; label: string }>
> = {
  selected: { tone: "offline", label: "Not sent yet" },
  uploading: { tone: "signal", label: "Uploading" },
  processing: { tone: "warning", label: "Preparing on the installation…" },
  live: { tone: "signal", label: "Live on screen" },
  error: { tone: "critical", label: "Upload failed" },
};

/**
 * Figma `Image Upload`: the client's own image on an installation screen, through its states
 * (Empty → Selected → Uploading → Processing → Live, or Error; Disabled while view-only).
 * UI only: every action is a callback; the upload itself lives with the image control.
 */
export function ImageUploadView({
  state,
  source,
  title = "Wall image",
  spec = "16:9 · JPG PNG HEIC · ≤ 10 MB",
  progress = 0,
  totalBytes,
  liveSince,
  error = "Connection to the installation was lost. Your image is kept — try again.",
  onChoose,
  onCrop,
  onSend,
  onCancel,
  onReplace,
  onRemove,
  onRetry,
  onDiscard,
}: {
  state: ImageUploadState;
  source?: ImageSourcePropType;
  title?: string;
  /** Accepted format line, shown in mono. */
  spec?: string;
  progress?: number;
  totalBytes?: number;
  /** e.g. "Shown on Lobby wall since 18:42." */
  liveSince?: string;
  error?: string;
  onChoose?: () => void;
  onCrop?: () => void;
  onSend?: () => void;
  onCancel?: () => void;
  onReplace?: () => void;
  onRemove?: () => void;
  onRetry?: () => void;
  onDiscard?: () => void;
}) {
  const t = useTheme();
  const disabled = state === "disabled";
  const empty = state === "empty" || disabled;
  const status = STATUS[state];
  const frameGlow = useDepthStyle(
    state === "live" ? "raised" : "raisedSm",
    state === "live" ? "signal" : false,
  );
  const caption =
    state === "empty"
      ? undefined
      : state === "selected"
        ? "Crop if needed, then send it to the screen."
        : state === "uploading"
          ? "Keep the app open until the upload finishes."
          : state === "processing"
            ? "The installation is fitting the image to the screen."
            : state === "live"
              ? (liveSince ?? "Shown on the installation screen.")
              : state === "error"
                ? error
                : "View only — take control to change the image.";
  return (
    <View
      className="gap-3 self-stretch"
      style={disabled ? { opacity: t.control.disabledOpacity } : undefined}
    >
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="text-muted-foreground text-xs font-medium uppercase tracking-overline">
          {title}
        </Text>
        <Text className="text-muted-foreground font-mono text-xs" numberOfLines={1}>
          {spec}
        </Text>
      </View>
      {empty ? (
        <Pressable
          onPress={onChoose}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Tap to upload an image"
          className="aspect-video items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-control-track px-6"
        >
          <Surface depth="raisedSm" radius="full" className="h-11 w-11 items-center justify-center">
            <Glyph icon={CloudArrowUpIcon} tone="foreground" size={22} />
          </Surface>
          <Text className="text-foreground text-sm font-semibold">Tap to upload an image</Text>
          <Text className="text-muted-foreground text-center text-xs">
            It appears on the installation screen after you send it
          </Text>
        </Pressable>
      ) : (
        <View
          className={cn(
            "aspect-video overflow-hidden rounded-lg bg-card",
            state === "live" && "border-2 border-control-fill",
            state === "error" && "border-2 border-destructive",
          )}
          style={frameGlow}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${title}: ${status?.label ?? ""}`}
        >
          {source ? (
            <Image
              source={source}
              resizeMode="cover"
              style={{
                width: "100%",
                height: "100%",
                opacity:
                  state === "uploading" || state === "processing" || state === "error" ? 0.55 : 1,
              }}
            />
          ) : null}
          {status && (
            <OverlayChip
              tone={status.tone}
              label={
                state === "uploading"
                  ? `${status.label} ${uploadLabel(progress, totalBytes)}`
                  : status.label
              }
            />
          )}
          {state === "selected" && onCrop && (
            <Pressable
              onPress={onCrop}
              accessibilityRole="button"
              accessibilityLabel="Crop"
              className="bg-background/80 absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-md"
            >
              <Glyph icon={CropIcon} size={18} />
            </Pressable>
          )}
          {state === "uploading" && (
            <View className="absolute bottom-3 left-3 right-3">
              <Surface depth="inset" radius="full" style={{ height: 4 }}>
                <Surface
                  depth="flat"
                  glow="signal"
                  radius="full"
                  fill={false}
                  style={{
                    height: 4,
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: t.control.fill,
                  }}
                />
              </Surface>
            </View>
          )}
        </View>
      )}
      {caption ? (
        <Text
          className={cn(
            "text-xs",
            state === "error" ? "text-destructive" : "text-muted-foreground",
          )}
          accessibilityLiveRegion="polite"
        >
          {caption}
        </Text>
      ) : null}
      <View className="flex-row gap-3">
        {state === "empty" && (
          <Button
            label="Choose from library"
            variant="secondary"
            onPress={onChoose}
            className="flex-1"
          />
        )}
        {state === "selected" && (
          <>
            <Button
              label="Choose another"
              variant="secondary"
              onPress={onChoose}
              className="flex-1"
            />
            <Button label="Send to screen" onPress={onSend} className="flex-1" />
          </>
        )}
        {state === "uploading" && (
          <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
        )}
        {state === "live" && (
          <>
            <Button label="Replace" variant="secondary" onPress={onReplace} className="flex-1" />
            <Button
              label="Remove from screen"
              variant="ghost"
              onPress={onRemove}
              className="flex-1"
            />
          </>
        )}
        {state === "error" && (
          <>
            <Button label="Discard" variant="ghost" onPress={onDiscard} className="flex-1" />
            <Button label="Retry" onPress={onRetry} className="flex-1" />
          </>
        )}
      </View>
    </View>
  );
}
