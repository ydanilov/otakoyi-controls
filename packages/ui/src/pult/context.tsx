import { isEnabled, type ControlValue, type PromptAck } from "@osc/controls";
import type { AnyControl } from "@osc/schema";
import * as React from "react";
import type { ControlMode, PultStore } from "./store";

const StoreContext = React.createContext<PultStore | null>(null);

export function PultProvider({ store, children }: { store: PultStore; children: React.ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function usePultStore(): PultStore {
  const s = React.useContext(StoreContext);
  if (!s) throw new Error("usePultStore must be used inside <PultProvider>");
  return s;
}

/**
 * A control's value. `subscribe` / `getSnapshot` are stable per store and id: an inline subscribe
 * makes React unsubscribe and resubscribe after every render, i.e. after every feedback message.
 */
export function useControlValue(id: string): ControlValue {
  const store = usePultStore();
  const subscribe = React.useCallback((fn: () => void) => store.subscribe(id, fn), [store, id]);
  const get = React.useCallback(() => store.get(id), [store, id]);
  return React.useSyncExternalStore(subscribe, get);
}

const noMeta = { ack: null, rev: 0 } as const;

/**
 * Confirmation of a control's last prompt and the revision of its data on the bridge. Works
 * outside a pult too (the gallery): then there is nothing to confirm.
 */
export function useControlMeta(id: string): { ack: PromptAck | null; rev: number } {
  const store = React.useContext(StoreContext);
  const subscribe = React.useCallback(
    (fn: () => void) => store?.subscribeMeta(id, fn) ?? (() => {}),
    [store, id],
  );
  const ack = React.useSyncExternalStore(subscribe, () => store?.ack(id) ?? noMeta.ack);
  const rev = React.useSyncExternalStore(subscribe, () => store?.rev(id) ?? noMeta.rev);
  return { ack, rev };
}

export function useControlMode(): ControlMode {
  const store = usePultStore();
  const subscribe = React.useCallback((fn: () => void) => store.subscribeMode(fn), [store]);
  return React.useSyncExternalStore(subscribe, () => store.mode);
}

/**
 * A relative control's accumulated change since the session started (Figma `+12`, `+0.02`). In a
 * pult it comes from the store (it survives page swipes while the pult is open); outside one
 * (Storybook, the gallery) the control keeps it itself through `add`.
 */
export function useRelativeOffset(id: string): { value: number; add: (d: number) => void } {
  const store = React.useContext(StoreContext);
  const [local, setLocal] = React.useState(0);
  const subscribe = React.useCallback(
    (fn: () => void) => store?.subscribeMeta(id, fn) ?? (() => {}),
    [store, id],
  );
  const fromStore = React.useSyncExternalStore(subscribe, () => store?.offset(id) ?? 0);
  const add = React.useCallback(
    (d: number) => {
      if (!store) setLocal((v) => v + d);
    },
    [store],
  );
  return { value: store ? fromStore : local, add };
}

/**
 * `enabledWhen` (Figma "Depends on", ADR-014): false while any condition does not hold — the
 * control is then drawn in its Disabled state. Re-evaluated whenever a referenced control changes.
 * Outside a pult (no store) a control is always enabled.
 */
export function useControlEnabled(control: AnyControl): boolean {
  const store = React.useContext(StoreContext);
  const conditions = control.type === "unsupported" ? undefined : control.enabledWhen;
  const subscribe = React.useCallback(
    (fn: () => void) => {
      if (!store || !conditions?.length) return () => {};
      const offs = conditions.map((c) => store.subscribe(c.control, fn));
      return () => offs.forEach((off) => off());
    },
    [store, conditions],
  );
  return React.useSyncExternalStore(subscribe, () =>
    !store
      ? true
      : isEnabled(conditions, (id) => ({ control: store.control(id), value: store.get(id) })),
  );
}
