import type { ControlType } from "@osc/schema";
import type * as React from "react";
import {
  ButtonControl,
  ButtonGrid,
  ButtonGroup,
  LabelControl,
  SceneList,
  Segmented,
  ToggleControl,
} from "./discrete";
import { ColorPicker } from "./ColorPicker";
import { Fader } from "./Fader";
import { Gyroscope } from "./Gyroscope";
import { HoldToConfirm } from "./HoldToConfirm";
import { Knob } from "./Knob";
import { ImageUpload, MicControl } from "./media";
import { PromptControl } from "./Prompt";
import { Meter } from "./Meter";
import { Thumbstick } from "./Thumbstick";
import type { ControlProps } from "./types";
import { XYPad } from "./XYPad";

/**
 * Control library: schema type → component. Adding a control = schema entry + component + story +
 * logic tests. The type check below fails if a schema type has no component. Types this app does
 * not know arrive as `unsupported` and render `UnsupportedPlaceholder` (see PultRenderer).
 */
export const controlRegistry: { [T in ControlType]: React.ComponentType<ControlProps<T>> } = {
  button: ButtonControl,
  toggle: ToggleControl,
  fader: Fader,
  knob: Knob,
  xy: XYPad,
  segmented: Segmented,
  buttonGrid: ButtonGrid,
  sceneList: SceneList,
  label: LabelControl,
  meter: Meter,
  holdToConfirm: HoldToConfirm,
  colorPicker: ColorPicker,
  buttonGroup: ButtonGroup,
  thumbstick: Thumbstick,
  gyroscope: Gyroscope,
  image: ImageUpload,
  mic: MicControl,
  prompt: PromptControl,
};
