/**
 * Storybook is the one home of component documentation (Figma keeps a one-line description only).
 * Every story file describes its component with `componentDocs()`, which renders the same sections
 * in the same order on every autodocs page.
 */
export interface ComponentDocs {
  /** One or two sentences: what it is for. */
  purpose: string;
  use?: string[];
  avoid?: string[];
  do?: string[];
  dont?: string[];
  /** Parts from outside in, e.g. "Bed (inset)", "Thumb (raised)". */
  anatomy?: string[];
  /** Interaction and data behaviour. For controls: OSC messages, fine mode, reset, relative/absolute. */
  behaviour?: string[];
  /** VoiceOver label / role, hit target, reduced motion. */
  a11y?: string[];
  /** Label length limits and overflow. */
  content?: string[];
  /** Figma component set name (API for the exporter, ADR-014). */
  figma: { component: string; node?: string; variants?: Array<[figma: string, props: string]> };
}

/** Where a control's OSC output is defined; quoted in every control story's behaviour section. */
export const OSC_SOURCE =
  "see `messagesFor()` in `packages/controls/src/logic.ts` (the story prints the last message under the control)";

const FIGMA_FILE = "https://www.figma.com/design/D2HHS8lt7PxZqxibv9PlOQ/OSC";

const list = (title: string, items?: string[]) =>
  items?.length ? `### ${title}\n\n${items.map((i) => `- ${i}`).join("\n")}\n` : "";

/**
 * Docs for a React Native Reusables primitive (`components/ui/*`, shadcn API, ADR-004). These are
 * building blocks: product UI should use the design-system component named in `prefer`.
 */
export function primitiveDocs(d: {
  name: string;
  purpose: string;
  prefer: string;
  anatomy?: string[];
  behaviour?: string[];
  a11y: string[];
  content?: string[];
}): string {
  return componentDocs({
    purpose: `${d.purpose} React Native Reusables primitive (shadcn API on \`@rn-primitives\`), styled with the semantic NativeWind tokens.`,
    use: ["Building a new DS component or a one-off internal screen (dev, studio tools)."],
    avoid: [`Product UI — use ${d.prefer}.`],
    do: ["Use semantic classes (`bg-primary`, `text-muted-foreground`) only."],
    dont: ["Don't add hex colours or ad-hoc shadows; depth comes from `Surface`."],
    anatomy: d.anatomy,
    behaviour: d.behaviour ?? [
      "Behaviour from `@rn-primitives` (portals, focus, state); see reactnativereusables.com.",
    ],
    a11y: d.a11y,
    content: d.content ?? ["As short as the DS equivalent."],
    figma: { component: `(no Figma component — primitive behind ${d.prefer})` },
  });
}

/** Markdown for `parameters.docs.description.component`. Pure, so it is unit-tested. */
export function componentDocs(d: ComponentDocs): string {
  const link = d.figma.node
    ? `[${d.figma.component}](${FIGMA_FILE}?node-id=${d.figma.node.replace(":", "-")})`
    : `\`${d.figma.component}\``;
  const variants = d.figma.variants?.length
    ? `\n| Figma variant | Props |\n| --- | --- |\n${d.figma.variants
        .map(([f, p]) => `| \`${f}\` | \`${p}\` |`)
        .join("\n")}\n`
    : "";
  const doDont =
    d.do?.length || d.dont?.length
      ? `### Do / Don't\n\n${(d.do ?? []).map((i) => `- **Do:** ${i}`).join("\n")}${
          d.do?.length && d.dont?.length ? "\n" : ""
        }${(d.dont ?? []).map((i) => `- **Don't:** ${i}`).join("\n")}\n`
      : "";
  return [
    d.purpose + "\n",
    list("When to use", d.use),
    list("When not to use", d.avoid),
    doDont,
    list("Anatomy", d.anatomy),
    list("Behaviour", d.behaviour),
    list("Accessibility", d.a11y),
    list("Content", d.content),
    `### Figma\n\nComponent set ${link}. Figma component and variant names are API for the exporter (ADR-014): renaming one is a breaking change.\n${variants}`,
  ]
    .filter(Boolean)
    .join("\n");
}
