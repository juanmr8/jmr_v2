/**
 * Shown when the viewport is the wrong shape for either home (narrow landscape,
 * or a portrait tablet). Rather than squeeze a layout that doesn't fit, ask the
 * user to rotate — which lands them on the form that does (see use-home-mode).
 */
export function RotateNotice() {
  return (
    <main
      style={{
        height: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "2rem",
        textAlign: "center",
        background: "var(--color-bg)",
        color: "var(--color-ink)",
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="7" width="12" height="14" rx="2" />
        <path d="M15 5h2a4 4 0 0 1 4 4v2" />
        <path d="M18 3l3 2-3 2" />
      </svg>
      <p className="t-ui" style={{ color: "var(--color-ink)", maxWidth: "22ch" }}>
        These proportions aren’t supported. Rotate your device to view the site.
      </p>
    </main>
  );
}
