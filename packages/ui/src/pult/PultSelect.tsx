import type { Pult } from "@osc/schema";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@osc/ui/components/ui/select";

/**
 * Pult switcher: one installation login can hold several pults (lobby, conference hall…).
 * Shown at the top of the screen; hidden when the installation has a single pult.
 */
export function PultSelect({
  pults,
  value,
  onChange,
}: {
  pults: Pult[];
  value: string;
  onChange: (id: string) => void;
}) {
  const current = pults.find((p) => p.id === value) ?? pults[0];
  if (!current || pults.length < 2) return null;
  return (
    <Select
      value={{ value: current.id, label: current.name }}
      onValueChange={(o) => o && onChange(o.value)}
    >
      <SelectTrigger className="min-w-48" accessibilityLabel="Choose pult">
        <SelectValue placeholder="Choose pult" />
      </SelectTrigger>
      <SelectContent>
        {pults.map((p) => (
          <SelectItem key={p.id} value={p.id} label={p.name}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
