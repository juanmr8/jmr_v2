import { SiteMenuBar } from "./menu";

/** Home top bar — the shared menu in a full-bleed band with a hairline rule. */
export function HomeNav() {
  return (
    // data-home-line: measured by the Preloader's lines layer, which
    // re-draws this rule on the stage and lands it here before the cut.
    <div data-home-line="nav" style={{ borderBottom: "1px solid var(--color-line)" }}>
      <SiteMenuBar reveal />
    </div>
  );
}
