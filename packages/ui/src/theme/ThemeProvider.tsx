import { createTheme, themeToCssVars, type BrandInput, type Theme } from "@osc/tokens";
import { vars } from "nativewind";
import * as React from "react";
import { View, type ViewProps } from "react-native";

const ThemeContext = React.createContext<Theme>(createTheme());
const BrandContext = React.createContext<BrandInput>({});

/**
 * Applies the installation's brand on top of the base tokens.
 * - Skia controls read colours through `useTheme()`.
 * - NativeWind / Reusables components read the same values as CSS variables, overridden here with `vars()`.
 */
export function ThemeProvider({
  brand,
  children,
  style,
  className,
  transparent,
  ...props
}: ViewProps & {
  brand?: BrandInput | undefined;
  /** Skip the background fill (overlay layers re-applying the theme, see ThemeLayer). */
  transparent?: boolean;
}) {
  const b = React.useMemo(() => brand ?? {}, [brand]);
  const theme = React.useMemo(() => createTheme(b), [b]);
  const cssVars = React.useMemo(() => vars(themeToCssVars(theme)), [theme]);
  return (
    <BrandContext.Provider value={b}>
      <ThemeContext.Provider value={theme}>
        <View
          {...props}
          className={[theme.mode, "flex-1", !transparent && "bg-background", className]
            .filter(Boolean)
            .join(" ")}
          style={[cssVars, style]}
        >
          {children}
        </View>
      </ThemeContext.Provider>
    </BrandContext.Provider>
  );
}

export function useTheme(): Theme {
  return React.useContext(ThemeContext);
}

/**
 * Re-applies the current brand inside content rendered outside the tree (RN `Modal`, portals),
 * where the CSS variables of the parent ThemeProvider do not reach.
 */
export function ThemeLayer({ children, ...props }: ViewProps) {
  const brand = React.useContext(BrandContext);
  const mode = useTheme().mode;
  const b = React.useMemo(() => ({ ...brand, mode }), [brand, mode]);
  return (
    <ThemeProvider brand={b} transparent {...props}>
      {children}
    </ThemeProvider>
  );
}
