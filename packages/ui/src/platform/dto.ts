/**
 * Shapes of media and prompt presets as the installation's bridge returns them. In the full
 * Otakoyi Control product they come from `@osc/protocol`; the design system only needs the types.
 */
export interface ImageAssetDto {
  id: string;
  pultId: string;
  controlId: string;
  name: string;
  format: string;
  bytes: number;
  path: string;
  createdAt: string;
}

export interface PromptPresetDto {
  id: string;
  pultId: string;
  controlId: string;
  label: string;
  text: string;
  on: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
