import { analyzeBlock, createBeatDetector, type ControlValue, type MicFrame } from "@osc/controls";
import type { ImageAssetDto } from "../platform/dto";
import type { ControlOf } from "@osc/schema";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@osc/ui/components/ui/text";
import { cn } from "@osc/ui/lib/utils";
import { CameraIcon, FolderSimpleIcon, ImagesIcon, ClockCounterClockwiseIcon } from "../ds/icons";
import type { MenuItem } from "../menus/menu-types";
import { PullDownMenu } from "../menus/PullDownMenu";
import { useControlServices, type ImageSource } from "../platform/services";
import { useControlMeta } from "../pult/context";
import { ControlFrame } from "./ControlFrame";
import { Led } from "./discrete";
import type { ControlProps } from "./types";

const ASPECT: Record<ControlOf<"image">["aspect"], number | undefined> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "9:16": 9 / 16,
  free: undefined,
};

const asImage = (v: ControlValue) =>
  typeof v === "object" && v !== null && "path" in v && "image" in v ? v : null;

/**
 * Image upload (ADR-015): pick a photo → the bridge validates and stores it and sends
 * `<address> <path>`. With `library`, earlier uploads can be shown again with one tap.
 * The source is a pull-down menu (HIG): Take Photo / Photo Library / Choose File / Uploads on
 * This Installation.
 * Picking and uploading go through `useControlServices()` (platform seam, no Platform.OS here).
 */
export function ImageUpload({ control: c, value, onChange, disabled }: ControlProps<"image">) {
  const { imagePicker, media, pult } = useControlServices();
  const [items, setItems] = React.useState<ImageAssetDto[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showUploads, setShowUploads] = React.useState(true);
  const current = asImage(value);
  const { rev } = useControlMeta(c.id); // bumped when another pult changed the library

  const refresh = React.useCallback(() => {
    if (c.library) media.list(pult, c.id).then(setItems, () => {});
  }, [media, pult, c.id, c.library, rev]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(refresh, [refresh]);

  const showLocally = (a: ImageAssetDto) => {
    if (!media.remote) onChange({ image: a.id, path: a.path });
  };
  const pick = async (source: ImageSource) => {
    setError(null);
    const img = await imagePicker.pick({ aspect: c.aspect, formats: c.formats, source });
    if (!img) return;
    setBusy(true);
    try {
      showLocally(await media.upload(pult, c.id, img));
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const show = async (a: ImageAssetDto) => {
    setError(null);
    try {
      showLocally(media.remote ? await media.show(a.id) : a);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const sources: MenuItem[] = [
    {
      key: "camera",
      label: "Take Photo",
      icon: CameraIcon,
      systemImage: "camera",
      onSelect: () => void pick("camera"),
    },
    {
      key: "library",
      label: "Photo Library",
      icon: ImagesIcon,
      systemImage: "photo.on.rectangle",
      onSelect: () => void pick("library"),
    },
    {
      key: "files",
      label: "Choose File",
      icon: FolderSimpleIcon,
      systemImage: "folder",
      onSelect: () => void pick("files"),
    },
    {
      key: "uploads",
      label: "Uploads on This Installation",
      icon: ClockCounterClockwiseIcon,
      systemImage: "clock.arrow.circlepath",
      disabled: !c.library || items.length === 0,
      onSelect: () => {
        setShowUploads(true);
        refresh();
      },
    },
  ];
  const canPick = !disabled && !busy && imagePicker.available;

  const name = current
    ? (items.find((i) => i.id === current.image)?.name ?? current.path.split(/[\\/]/).pop())
    : null;
  return (
    <ControlFrame label={c.label} value={name ?? undefined} disabled={disabled}>
      <View className="flex-1 gap-2">
        {canPick ? (
          <View className="flex-1 items-center justify-center">
            <PullDownMenu label={`${c.label ?? c.id}: add an image`} items={sources}>
              <Pressable
                accessibilityRole="button"
                testID={`image-source-${c.id}`}
                className="bg-control-track border-border min-h-touch items-center justify-center rounded-md border border-dashed px-6 py-4"
              >
                <Text className="text-foreground text-sm font-medium">
                  {current ? "Replace image" : "Add image"}
                </Text>
                <Text className="text-muted-foreground mt-1 text-center text-xs">
                  {`${c.aspect === "free" ? "Any shape" : c.aspect} · ${c.formats.join(", ")} · ≤ ${c.maxMB} MB`}
                </Text>
              </Pressable>
            </PullDownMenu>
          </View>
        ) : (
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel={`${c.label ?? c.id}: choose a photo`}
            style={ASPECT[c.aspect] ? { aspectRatio: ASPECT[c.aspect] } : undefined}
            className={cn(
              "bg-control-track border-border min-h-touch max-h-full flex-1 items-center justify-center self-center rounded-md border border-dashed px-3",
              ASPECT[c.aspect] ? "flex-none" : "w-full",
            )}
          >
            <Text className="text-foreground text-sm font-medium">
              {busy ? "Uploading…" : current ? "Replace photo" : "Choose photo"}
            </Text>
            <Text className="text-muted-foreground mt-1 text-center text-xs">
              {imagePicker.available
                ? `${c.aspect === "free" ? "Any shape" : c.aspect} · ${c.formats.join(", ")} · ≤ ${c.maxMB} MB`
                : "Photo picking isn't available on this device yet"}
            </Text>
          </Pressable>
        )}
        {error && (
          <Text className="text-status-critical text-xs" numberOfLines={2}>
            {error}
          </Text>
        )}
        {c.library && showUploads && items.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0">
            <View className="flex-row gap-2">
              {items.map((a) => {
                const active = current?.image === a.id;
                return (
                  <Pressable
                    key={a.id}
                    disabled={disabled}
                    onPress={() => show(a)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={cn(
                      "min-h-touch justify-center rounded-md border px-3",
                      active ? "border-primary bg-primary" : "border-border bg-card",
                    )}
                  >
                    <Text
                      className={cn(
                        "max-w-32 text-xs",
                        active ? "text-primary-foreground" : "text-foreground",
                      )}
                      numberOfLines={1}
                    >
                      {a.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </ControlFrame>
  );
}

const asFrame = (v: ControlValue): MicFrame =>
  typeof v === "object" && v !== null && ("level" in v || "bands" in v || "beat" in v)
    ? (v as MicFrame)
    : {};

/**
 * Mic (ADR-015): on-device analysis; audio never leaves the device, only level / bands / beat.
 * Capture is the platform's `AudioInput`; analysis and message shapes are in @osc/controls.
 */
export function MicControl({ control: c, value, onChange, disabled }: ControlProps<"mic">) {
  const { audio } = useControlServices();
  const [listening, setListening] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [local, setLocal] = React.useState<MicFrame>({});
  const stop = React.useRef<(() => void) | null>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  React.useEffect(() => () => stop.current?.(), []);
  React.useEffect(() => {
    if (disabled && stop.current) {
      stop.current();
      stop.current = null;
      setListening(false);
    }
  }, [disabled]);

  const toggle = async () => {
    setError(null);
    if (stop.current) {
      stop.current();
      stop.current = null;
      setListening(false);
      return;
    }
    if (!(await audio.requestPermission())) return setError("Microphone access was not allowed");
    const beat = createBeatDetector();
    try {
      stop.current = await audio.start({ rateHz: c.rateHz, bands: c.bands }, (block) => {
        const frame = analyzeBlock(c, block, beat);
        setLocal(frame);
        onChangeRef.current(frame);
      });
      setListening(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // Show this device's analysis while listening, otherwise whatever another device sends.
  const frame = listening ? local : asFrame(value);
  const level = frame.level ?? 0;
  return (
    <ControlFrame
      label={c.label}
      value={listening ? `${Math.round(level * 100)}%` : undefined}
      disabled={disabled}
    >
      <View className="flex-1 flex-row gap-3">
        <Pressable
          disabled={disabled || !audio.available}
          onPress={toggle}
          accessibilityRole="switch"
          accessibilityState={{ checked: listening, disabled: disabled || !audio.available }}
          accessibilityLabel={`${c.label ?? c.id}: listen`}
          className={cn(
            "min-h-touch w-24 items-center justify-center gap-1 rounded-md border px-2",
            listening ? "border-primary bg-primary" : "border-border bg-card",
          )}
        >
          <Led on={listening} className={listening ? "bg-primary-foreground" : undefined} />
          <Text
            className={cn(
              "text-sm font-semibold",
              listening ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {listening ? "Stop" : "Listen"}
          </Text>
        </Pressable>
        <View className="bg-control-track flex-1 flex-row items-end gap-1 rounded-md p-2">
          {c.outputs.includes("level") && (
            <View className="bg-muted h-full w-3 justify-end overflow-hidden rounded-sm">
              <View className="bg-control-fill w-full" style={{ height: `${level * 100}%` }} />
            </View>
          )}
          {c.outputs.includes("bands") &&
            Array.from({ length: c.bands }, (_, i) => (
              <View
                key={i}
                className="bg-control-fill flex-1 rounded-sm"
                style={{ height: `${Math.max(2, (frame.bands?.[i] ?? 0) * 100)}%` }}
              />
            ))}
          {c.outputs.includes("beat") && <Led on={!!frame.beat} className="mb-1 h-3 w-3" />}
        </View>
      </View>
      {(error || !audio.available) && (
        <Text className="text-muted-foreground mt-1 text-xs" numberOfLines={1}>
          {error ?? "The microphone isn't available on this device yet"}
        </Text>
      )}
    </ControlFrame>
  );
}
