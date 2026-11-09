export { ThemeLayer, ThemeProvider, useTheme } from "./theme/ThemeProvider";
export { PultStore, type ControlMode, type Transport } from "./pult/store";
export {
  PultPager,
  PultProvider,
  useControlMeta,
  useControlMode,
  useControlValue,
  usePultStore,
} from "./pult/PultRenderer";
export { PultHeader, type Connection } from "./pult/PultHeader";
export { controlRegistry } from "./controls/registry";
export { ControlFrame } from "./controls/ControlFrame";
export type { ControlProps } from "./controls/types";
export { Fader } from "./controls/Fader";
export { Knob } from "./controls/Knob";
export { XYPad } from "./controls/XYPad";
export { Meter } from "./controls/Meter";
export { JogFader } from "./controls/Jog";
export { Thumbstick } from "./controls/Thumbstick";
export { Gyroscope } from "./controls/Gyroscope";
export {
  PinTouchLight,
  TouchLightSkia,
  TouchLightView,
  usePressLight,
  useTouchLight,
  useTouchLightSkia,
  InnerLight,
  useInnerLight,
} from "./controls/TouchLight";
export { ImageUpload, MicControl } from "./controls/media";
export { PromptControl } from "./controls/Prompt";
export {
  ControlServicesProvider,
  createMemoryServices,
  memoryViewPrefs,
  viewPrefKey,
  type ViewPrefs,
  stubServices,
  urlAsset,
  useControlServices,
  type AudioInput,
  type ControlServices,
  type ImagePicker,
  type ImageSource,
  type MediaLibrary,
  type MotionInput,
  type MotionPermission,
  type PickedImage,
  type PromptPresets,
} from "./platform/services";
export type { ImageAssetDto, PromptPresetDto } from "./platform/dto";
export { HoldToConfirm } from "./controls/HoldToConfirm";
export { ColorPicker } from "./controls/ColorPicker";
export {
  ButtonControl,
  ButtonGrid,
  ButtonGroup,
  Led,
  LabelControl,
  SceneList,
  Segmented,
  ToggleControl,
  UnsupportedPlaceholder,
} from "./controls/discrete";
export {
  itemsFor,
  layoutPage,
  naturalHeightFor,
  pultMetrics,
  reflowForPhone,
  PHONE_BREAKPOINT,
  type Cell,
  type ControlSizes,
  type Item,
  type PultMetrics,
  type Rect,
  type Screen,
} from "./pult/layout";
export { PultSelect } from "./pult/PultSelect";

// Design system (Figma library → code; mapping in docs/figma.md, docs in Storybook)
export {
  CONTINUOUS,
  Surface,
  useDepthStyle,
  usePressState,
  type Depth,
  type GlowLevel,
  type GlowTone,
} from "./ds/depth";
export { Glyph, toneColor, type Tone } from "./ds/Glyph";
export { StatusLed } from "./ds/Led";
export * from "./ds/icons";
export { iconByName, ICON_NAMES } from "./ds/iconByName";
export * from "./ds/logic";
export {
  Button,
  IconButton,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
} from "./chrome/Button";
export {
  Badge,
  Chip,
  ConnectionStatus,
  Divider,
  InfoCard,
  Note,
  PageDots,
  StatTile,
  StatusBanner,
  type BadgeTone,
  type BannerMode,
  type ChipTone,
} from "./chrome/Status";
export { NavItem, ScreenTab, TabBar, TopBar } from "./chrome/Navigation";
export { BrandMark, Wordmark } from "./chrome/Brand";
export { Loader } from "./chrome/Loader";
export { Scrim } from "./chrome/Scrim";
export { Toast } from "./chrome/Toast";
export { TextField, ValueInput, type FieldState } from "./forms/Field";
export { Select, type SelectOption, type SelectProps } from "./forms/Select";
export { Stepper } from "./forms/Stepper";
export { LedSwitch } from "./forms/LedSwitch";
export { MenuSwitch } from "./forms/MenuSwitch";
export { ListRow, type ListRowTrailing } from "./forms/ListRow";
export {
  ConsolePanel,
  ListCard,
  PultCard,
  ReleaseCard,
  ReleaseNote,
  Section,
} from "./containers/Cards";
export { Dialog } from "./containers/Dialog";
export { Inspector } from "./containers/Inspector";
export { Drawer, DrawerHeader } from "./containers/Drawer";
export { LAYOUT_TEST_ID, SheetScaffold, SheetSurface, SheetToolbar } from "./containers/Sheet";
export { EdgeSwipe } from "./containers/EdgeSwipe";
export { PullDownMenu } from "./menus/PullDownMenu";
export { ContextMenu } from "./menus/ContextMenu";
export type { MenuItem } from "./menus/menu-types";
export { Backdrop, ClientLogo } from "./connect/Brand";
export { BrandedLoading, ConnectForm, ConnectOptions } from "./connect/Connect";
export { Viewfinder } from "./containers/Viewfinder";
export { QuickAction } from "./media/QuickAction";
export { MasterBar } from "./media/MasterBar";
export { ActivityRow, type ActivityKind } from "./media/ActivityRow";
export { ProgressRing } from "./media/ProgressRing";
export {
  ImageTile,
  ImageUploadView,
  type ImageTileState,
  type ImageUploadState,
} from "./media/Image";
export * from "./patterns/Installation";
export * from "./patterns/System";
export { Mix, PromptMix } from "./patterns/Mix";
export {
  StatusNotificationsRow,
  type StatusNotificationsState,
} from "./patterns/StatusNotificationsRow";
export {
  DebugHud,
  DebugTag,
  useTicker,
  type DebugHudLogLine,
  type DebugHudMetric,
} from "./debug/Debug";
export { DebugRow } from "./debug/DebugRow";
export { OscLog, type OscLogLine } from "./debug/OscLog";
