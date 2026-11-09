import * as React from "react";
import { View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, Wordmark } from "../chrome/Brand";
import { Button } from "../chrome/Button";
import { Loader } from "../chrome/Loader";
import { InfoCard } from "../chrome/Status";
import { Glyph } from "../ds/Glyph";
import { CONTINUOUS, useDepthStyle } from "../ds/depth";
import { useTheme } from "../theme/ThemeProvider";
import { withAlpha } from "@osc/tokens";
import { Text } from "../components/ui/text";
import { KeyIcon, MonitorIcon, ScanIcon, WifiSlashIcon } from "../ds/icons";
import { manualPairing } from "../ds/logic";
import { TextField } from "../forms/Field";
import { Backdrop, ClientLogo } from "./Brand";

const CONNECT_COPY = {
  title: "Connect to your installation",
  subtitle: "Scan the pairing QR on the installation screen. No account needed.",
  note: "The QR appears only while pairing is on.",
  hero: "Your installation,\nin your hands.",
  heroBody:
    "A pult made by the studio for this installation. Lobby or live show — same app, no account.",
} as const;

/**
 * Pattern `Connect` (ADR-012, no client login): the first screen. Three ways in — scan the pairing
 * QR shown on the installation, enter its address and PIN (form in a sheet), or try the demo.
 * - `phone` (Figma Demo › Phone / 01 Connect 106:8): iOS onboarding — brand mark + wordmark centred
 *   at the top; a centred hero (104 pt recessed tile, radius 30, with the scan icon and a soft
 *   signal glow; title; subtitle); the actions pinned at the bottom: primary, secondary, ghost,
 *   and a centred note. No "or" divider.
 * - `tablet` (Tablet / 01 Connect 106:161): the brand story on the left, the actions on the right.
 */
export function ConnectOptions({
  onScan,
  onEnterAddress,
  onDemo,
  layout = "phone",
}: {
  onScan: () => void;
  onEnterAddress: () => void;
  onDemo: () => void;
  layout?: "phone" | "tablet";
}) {
  if (layout === "tablet")
    return <ConnectTablet onScan={onScan} onEnterAddress={onEnterAddress} onDemo={onDemo} />;
  return (
    <View className="flex-1 gap-6 p-6">
      <View className="flex-row items-center justify-center gap-3">
        <BrandMark size="sm" />
        <Wordmark size="sm" align="start" />
      </View>
      <View className="flex-1 items-center justify-center gap-5">
        <ScanTile />
        <View className="items-center gap-2.5 px-3">
          <Text
            className="text-foreground text-center text-xl font-semibold"
            accessibilityRole="header"
          >
            {CONNECT_COPY.title}
          </Text>
          <Text className="text-muted-foreground text-md text-center">{CONNECT_COPY.subtitle}</Text>
        </View>
      </View>
      <View className="gap-3">
        <Button label="Scan pairing QR" size="lg" onPress={onScan} block />
        <Button
          label="Enter address and PIN"
          variant="secondary"
          size="lg"
          onPress={onEnterAddress}
          block
        />
        <Button label="Try the demo" variant="ghost" onPress={onDemo} block />
        <Text className="text-muted-foreground text-center text-sm">{CONNECT_COPY.note}</Text>
      </View>
    </View>
  );
}

/** The hero's 104 pt recessed tile (radius 30) with the scan icon and a soft signal glow. */
function ScanTile() {
  const t = useTheme();
  const inset = useDepthStyle("inset");
  const glow = boxShadowGlow(t.control.fill);
  return (
    <View
      className="bg-control-track items-center justify-center"
      style={[
        CONTINUOUS,
        { width: 104, height: 104, borderRadius: 30 },
        { boxShadow: `${inset.boxShadow}, ${glow}` },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Glyph icon={ScanIcon} size={48} color={t.control.fill} />
    </View>
  );
}

/** Figma Scan Tile glow: the signal colour at 18 %, 40 pt blur. */
const boxShadowGlow = (color: string) => `0px 0px 40px 0px ${withAlpha(color, 0.18)}`;

function ConnectTablet({
  onScan,
  onEnterAddress,
  onDemo,
}: {
  onScan: () => void;
  onEnterAddress: () => void;
  onDemo: () => void;
}) {
  return (
    // Figma Tablet / 01 Connect: two equal halves, each 72 pt in, content centred vertically.
    <View className="flex-1 flex-row">
      <View className="flex-1 justify-center gap-7 px-[72px]">
        <BrandMark size="md" />
        <Text className="text-foreground text-display font-bold">{CONNECT_COPY.hero}</Text>
        <Text className="text-muted-foreground text-md max-w-[420px]">{CONNECT_COPY.heroBody}</Text>
      </View>
      <View className="flex-1 justify-center gap-6 px-[72px]">
        <Text className="text-foreground text-xl font-semibold" accessibilityRole="header">
          {CONNECT_COPY.title}
        </Text>
        <Text className="text-muted-foreground text-md">{CONNECT_COPY.subtitle}</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button label="Scan pairing QR" size="lg" onPress={onScan} block />
          </View>
          <View className="flex-1">
            <Button
              label="Enter address and PIN"
              variant="secondary"
              size="lg"
              onPress={onEnterAddress}
              block
            />
          </View>
        </View>
        <Button label="Try the demo" variant="ghost" onPress={onDemo} block />
        <Text className="text-muted-foreground text-center text-sm">{CONNECT_COPY.note}</Text>
      </View>
    </View>
  );
}

/**
 * Content of the "Enter address and PIN" sheet. Validates with `manualPairing()` (unit-tested) and
 * returns the same pairing the QR deep link carries; connecting is the screen's job.
 */
export function ConnectForm({
  onSubmit,
  onCancel,
  busy,
  error,
  initialAddress = "",
}: {
  onSubmit: (pairing: { bridge: string; pin: string }) => void;
  onCancel?: () => void;
  busy?: boolean;
  /** Connection error from the screen (e.g. wrong PIN), shown under the PIN. */
  error?: string;
  initialAddress?: string;
}) {
  const [address, setAddress] = React.useState(initialAddress);
  const [pin, setPin] = React.useState("");
  const [fieldError, setFieldError] = React.useState<{
    field: "address" | "pin";
    message: string;
  } | null>(null);
  const submit = () => {
    const r = manualPairing(address, pin);
    if (!r.ok) return setFieldError({ field: r.field, message: r.message });
    setFieldError(null);
    onSubmit(r.pairing);
  };
  return (
    <View className="gap-4 px-5 pb-5 pt-6">
      <Text className="text-foreground text-xl font-semibold" accessibilityRole="header">
        Enter address and PIN
      </Text>
      <Text className="text-muted-foreground text-sm">
        Both are printed under the pairing QR on the installation screen.
      </Text>
      <TextField
        label="Address"
        icon={MonitorIcon}
        value={address}
        onChangeText={setAddress}
        placeholder="192.168.1.20"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        error={fieldError?.field === "address" ? fieldError.message : undefined}
      />
      <TextField
        label="PIN"
        icon={KeyIcon}
        value={pin}
        onChangeText={setPin}
        placeholder="4–8 digits"
        keyboardType="number-pad"
        secureTextEntry
        textContentType="oneTimeCode"
        onSubmitEditing={submit}
        error={fieldError?.field === "pin" ? fieldError.message : error}
      />
      <View className="flex-row gap-3 pt-2">
        {onCancel && (
          <Button label="Cancel" variant="secondary" onPress={onCancel} className="flex-1" />
        )}
        <Button
          label={busy ? "Connecting…" : "Connect"}
          onPress={submit}
          disabled={busy}
          className="flex-1"
        />
      </View>
    </View>
  );
}

/**
 * Pattern `Client loading`: the client-branded screen shown after launch while the app connects
 * (ADR-013 launch). Backdrop + Client Logo + Loader; a connection problem is shown inline with
 * Retry, never as an alert at startup.
 */
export function BrandedLoading({
  name,
  subtitle,
  logo,
  backdrop,
  status = "connecting",
  message,
  onRetry,
  onForget,
}: {
  name: string;
  subtitle?: string;
  logo?: ImageSourcePropType;
  backdrop?: ImageSourcePropType;
  status?: "connecting" | "error";
  /** Error explanation, e.g. "Can't reach Aurora Hall. Check that you are on its Wi-Fi." */
  message?: string;
  onRetry?: () => void;
  /** "Forget this installation" → back to Connect. */
  onForget?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Backdrop source={backdrop}>
      <View
        className="flex-1 items-center justify-between px-6"
        style={{ paddingTop: insets.top + 96, paddingBottom: insets.bottom + 40 }}
      >
        <ClientLogo name={name} subtitle={subtitle} source={logo} />
        {status === "connecting" ? (
          <Loader label={`Connecting to ${name}…`} />
        ) : (
          <View className="gap-3 self-stretch">
            <InfoCard icon={WifiSlashIcon}>{message ?? `Can't reach ${name}.`}</InfoCard>
            <View className="flex-row gap-3">
              {onForget && (
                <Button label="Forget" variant="ghost" onPress={onForget} className="flex-1" />
              )}
              {onRetry && <Button label="Retry" onPress={onRetry} className="flex-1" />}
            </View>
          </View>
        )}
      </View>
    </Backdrop>
  );
}
