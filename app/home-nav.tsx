import { SiteMenuBar } from "./menu";

/** Home top bar — the shared menu in a full-bleed band with a hairline rule. */
export function HomeNav() {
  return (
    <div style={{ borderBottom: "1px solid var(--color-line)" }}>
      <SiteMenuBar />
    </div>
  );
}
