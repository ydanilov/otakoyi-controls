import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps the text colour next to token font sizes", () => {
    expect(cn("text-foreground", "text-display")).toBe("text-foreground text-display");
    expect(cn("text-muted-foreground text-md")).toBe("text-muted-foreground text-md");
  });
  it("still lets a later size or colour win", () => {
    expect(cn("text-sm", "text-md")).toBe("text-md");
    expect(cn("text-foreground", "text-destructive")).toBe("text-destructive");
  });
});
