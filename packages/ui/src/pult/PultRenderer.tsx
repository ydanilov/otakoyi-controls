import type { Page } from "@osc/schema";
import * as React from "react";
import { ScrollView, View, type ScrollViewInstance } from "react-native";
import { ScreenTab } from "../chrome/Navigation";
import { PageDots } from "../chrome/Status";
import { Surface } from "../ds/depth";
import { useLayout } from "../controls/useLayout";
import { useTheme } from "../theme/ThemeProvider";
import { ConnectedControl } from "./ConnectedControl";
import {
  PHONE_BREAKPOINT,
  itemsFor,
  layoutPage,
  pultMetrics,
  type Cell,
  type Screen,
} from "./layout";
import { PanelView } from "./Panels";

export {
  PultProvider,
  useControlEnabled,
  useControlMeta,
  useControlMode,
  useControlValue,
  usePultStore,
  useRelativeOffset,
} from "./context";

interface PagerScreen {
  key: string;
  label: string;
  page: Page;
  screen: Screen;
}

/**
 * The pult body. Pages never scroll vertically (ADR-006): controls are packed from the top with
 * the form factor's gaps at their Figma heights (stretchable ones share the free height; on a
 * tablet each column's last item reaches the bottom), and a page that does not fit is split into
 * several screens. All screens of all pages sit in one horizontal pager; tabs above jump to a
 * screen and follow the swipe.
 */
export function PultPager({ pages, studio = false }: { pages: Page[]; studio?: boolean }) {
  const t = useTheme();
  const { size, onLayout } = useLayout();
  const W = size.width;
  const H = size.height;
  const phone = W > 0 && W < PHONE_BREAKPOINT;

  const screens = React.useMemo<PagerScreen[]>(() => {
    if (!H || !W) return [];
    const m = pultMetrics(phone ? "phone" : "tablet", t.size);
    return pages.flatMap((page) => {
      // Schema v2: each page carries its own phone and tablet layout (ADR-014).
      const cells = new Map<string, Cell>(Object.entries(page.layout[phone ? "phone" : "tablet"]));
      const items = itemsFor(page.controls, page.panels, t.size);
      const split = layoutPage(cells, items, W, H, m, page.columns);
      return split.map((screen, i) => ({
        key: `${page.id}:${i}`,
        label: split.length > 1 ? `${page.title} ${i + 1}` : page.title,
        page,
        screen,
      }));
    });
  }, [pages, phone, W, H, t.size]);
  const scroller = React.useRef<ScrollViewInstance>(null);
  const [index, setIndex] = React.useState(0);
  const go = (i: number) => {
    setIndex(i);
    scroller.current?.scrollTo({ x: i * W, animated: true });
  };
  // Keep the visible screen when the layout changes (rotation, split view).
  React.useEffect(() => {
    if (index >= screens.length && screens.length) setIndex(screens.length - 1);
    scroller.current?.scrollTo({
      x: Math.min(index, Math.max(0, screens.length - 1)) * W,
      animated: false,
    });
  }, [W, screens.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View className="flex-1">
      {screens.length > 1 && (
        <ScreenTabs labels={screens.map((s) => s.label)} index={index} onSelect={go} fill={phone} />
      )}
      <View className="flex-1" onLayout={onLayout}>
        {W > 0 && (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
            onScroll={(e) => {
              // Web has no momentum event; keep tabs in sync while scrolling.
              const i = Math.round(e.nativeEvent.contentOffset.x / W);
              if (i !== index) setIndex(i);
            }}
            scrollEventThrottle={64}
          >
            {screens.map((s, i) => (
              <View key={s.key} style={{ width: W, height: H }}>
                {/* Only the screen on show and its neighbours are mounted: every continuous
                    control is a canvas, and browsers cap live WebGL contexts (~16). */}
                {Math.abs(i - index) <= 1 && <ScreenGrid screen={s} studio={studio} />}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      {screens.length > 1 && (
        <View className="items-center" pointerEvents="none">
          <PageDots count={screens.length} active={Math.min(index, screens.length - 1)} />
        </View>
      )}
    </View>
  );
}

function ScreenGrid({ screen, studio }: { screen: PagerScreen; studio: boolean }) {
  const byId = new Map(screen.page.controls.map((c) => [c.id, c]));
  const panels = new Map(screen.page.panels.map((p) => [p.id, p]));
  return (
    <View style={{ flex: 1 }}>
      {screen.screen.ids.map((id) => {
        const c = byId.get(id);
        const panel = panels.get(id);
        const r = screen.screen.rects.get(id);
        if ((!c && !panel) || !r) return null;
        return (
          <View
            key={id}
            style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h }}
          >
            {panel ? (
              <PanelView panel={panel} controls={byId} studio={studio} />
            ) : (
              <ConnectedControl control={c!} studio={studio} />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Tablet tab width (Figma Tab Bar: four tabs in 460 pt). */
const TAB_MIN = 110;

/**
 * Screen tabs: the DS Tab Bar — a recessed capsule track with an inset capsule thumb. Phone: the
 * tabs share the full width; tablet: the bar hugs its tabs. Scrolls sideways when there are many.
 */
function ScreenTabs({
  labels,
  index,
  onSelect,
  fill,
}: {
  labels: string[];
  index: number;
  onSelect: (i: number) => void;
  fill: boolean;
}) {
  const many = labels.length > (fill ? 4 : 8);
  const tabs = labels.map((label, i) => (
    <View key={label + i} style={fill && !many ? { flex: 1, minWidth: 0 } : { minWidth: TAB_MIN }}>
      <ScreenTab
        label={label}
        active={i === index}
        onPress={() => onSelect(i)}
        fill={fill && !many}
      />
    </View>
  ));
  return (
    <View className={fill ? "px-4 py-2" : "px-5 py-1.5"}>
      <Surface
        depth="inset"
        radius="full"
        className={fill ? "self-stretch" : "self-start"}
        accessibilityRole="tablist"
      >
        {many ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1 p-1"
          >
            {tabs}
          </ScrollView>
        ) : (
          <View className="flex-row gap-1 p-1">{tabs}</View>
        )}
      </Surface>
    </View>
  );
}
