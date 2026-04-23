const sp = (n: number) => `calc(var(--vw) * ${n})`;

export default function DesignSystem() {
  return (
    <main style={{ minHeight: "100svh" }}>
      {/* ─────────────────────────────────────────────────
          NAV
      ───────────────────────────────────────────────── */}
      <header
        className="container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: sp(28),
          paddingBottom: sp(28),
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          zIndex: 10,
        }}
      >
        <span className="t-label" style={{ color: "var(--color-accent)" }}>
          JMR / Design System
        </span>
        <span className="t-label" style={{ color: "var(--color-muted)" }}>
          Canvas 1440 × 900
        </span>
      </header>

      {/* ─────────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingBottom: sp(80),
        }}
      >
        <div className="container">
          <p
            className="t-label"
            style={{ color: "var(--color-muted)", marginBottom: sp(32) }}
          >
            Scale System v1
          </p>
          <h1
            className="t-display"
            style={{ fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            Every size.
            <br />
            Every screen.
          </h1>
          <p
            className="t-body"
            style={{
              color: "var(--color-muted)",
              marginTop: sp(32),
              maxWidth: `calc(var(--col) * 6 + var(--gutter) * 5)`,
            }}
          >
            Three CSS units. One grid. One type scale. No preprocessor — just
            math that follows your design canvas to any viewport shape.
          </p>

          <div
            style={{
              display: "flex",
              gap: sp(12),
              marginTop: sp(40),
              flexWrap: "wrap",
            }}
          >
            {["--vw · width", "--vr · fit", "--vf · fixed"].map((tag) => (
              <span
                key={tag}
                className="t-label"
                style={{
                  border: "1px solid var(--color-border)",
                  padding: `${sp(8)} ${sp(16)}`,
                  borderRadius: "9999px",
                  color: "var(--color-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          THREE UNITS
      ───────────────────────────────────────────────── */}
      <section style={{ paddingBottom: sp(120) }}>
        <div className="container" style={{ marginBottom: sp(48) }}>
          <p className="t-label" style={{ color: "var(--color-muted)" }}>
            The Three Units
          </p>
        </div>

        <div className="container ds-grid">
          {/* --vw */}
          <div
            style={{
              gridColumn: "span 4",
              background: "var(--color-surface)",
              padding: sp(40),
              borderRadius: sp(12),
              display: "flex",
              flexDirection: "column",
              gap: sp(16),
            }}
          >
            <code
              className="t-label"
              style={{
                color: "var(--color-accent)",
                fontFamily: "var(--font-mono)",
              }}
            >
              --vw
            </code>
            <h3 className="t-subhead" style={{ fontWeight: 600 }}>
              Width-relative
            </h3>
            <p className="t-body" style={{ color: "var(--color-muted)" }}>
              1/1440th of viewport width. Converts design-canvas pixels into
              fluid values. Use for margins, gutters, and horizontal spacing.
            </p>
            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />
            <code
              className="t-small"
              style={{
                color: "var(--color-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              calc(var(--vw) * 80)
              <br />→ 80px @ 1440 · scales with width
            </code>
          </div>

          {/* --vr */}
          <div
            style={{
              gridColumn: "span 4",
              background: "var(--color-accent)",
              padding: sp(40),
              borderRadius: sp(12),
              display: "flex",
              flexDirection: "column",
              gap: sp(16),
              color: "var(--color-bg)",
            }}
          >
            <code
              className="t-label"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              --vr
            </code>
            <h3 className="t-subhead" style={{ fontWeight: 600 }}>
              Fit-to-screen
            </h3>
            <p className="t-body" style={{ opacity: 0.65 }}>
              Tracks whichever axis constrains the layout — like{" "}
              <em>object-fit: contain</em> for sizes. Use for display type and
              full-bleed compositions.
            </p>
            <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.15)" }} />
            <code
              className="t-small"
              style={{ fontFamily: "var(--font-mono)", opacity: 0.5 }}
            >
              calc(var(--vr) * 120)
              <br />→ fits any viewport, never overflows
            </code>
          </div>

          {/* --vf */}
          <div
            style={{
              gridColumn: "span 4",
              background: "var(--color-surface)",
              padding: sp(40),
              borderRadius: sp(12),
              display: "flex",
              flexDirection: "column",
              gap: sp(16),
            }}
          >
            <code
              className="t-label"
              style={{
                color: "var(--color-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              --vf
            </code>
            <h3 className="t-subhead" style={{ fontWeight: 600 }}>
              Fixed
            </h3>
            <p className="t-body" style={{ color: "var(--color-muted)" }}>
              Always 1px. Never scales. UI labels, body copy, captions — text
              that must stay legible regardless of how the layout stretches.
            </p>
            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />
            <code
              className="t-small"
              style={{
                color: "var(--color-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              calc(18 * var(--vf))
              <br />→ 18px always
            </code>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          TYPE SCALE
      ───────────────────────────────────────────────── */}
      <section style={{ paddingBottom: sp(120) }}>
        <div className="container" style={{ marginBottom: sp(48) }}>
          <p className="t-label" style={{ color: "var(--color-muted)" }}>
            Type Scale
          </p>
        </div>

        <div className="container">
          {[
            {
              label: "Display",
              className: "t-display",
              weight: 700,
              tracking: "-0.03em",
              token: "--vr × 120",
              kind: "fluid",
            },
            {
              label: "Heading",
              className: "t-heading",
              weight: 600,
              tracking: "-0.02em",
              token: "--vr × 56",
              kind: "fluid",
            },
            {
              label: "Subhead",
              className: "t-subhead",
              weight: 500,
              tracking: "0",
              token: "--vr × 32",
              kind: "fluid",
            },
            {
              label: "Body",
              className: "t-body",
              weight: 400,
              tracking: "0",
              token: "--vf × 18 = 18px",
              kind: "fixed",
            },
            {
              label: "Small",
              className: "t-small",
              weight: 400,
              tracking: "0",
              token: "--vf × 14 = 14px",
              kind: "fixed",
            },
            {
              label: "Label",
              className: "t-label",
              weight: 500,
              tracking: "0.1em",
              token: "--vf × 11 = 11px",
              kind: "fixed",
            },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              style={{
                borderTop: "1px solid var(--color-border)",
                borderBottom:
                  i === arr.length - 1
                    ? "1px solid var(--color-border)"
                    : "none",
                paddingTop: sp(28),
                paddingBottom: sp(28),
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: sp(24),
              }}
            >
              <span
                className={item.className}
                style={{
                  fontWeight: item.weight,
                  letterSpacing: item.tracking,
                  flex: 1,
                  color:
                    item.kind === "fixed"
                      ? "var(--color-muted)"
                      : "var(--color-ink)",
                }}
              >
                {item.label}
              </span>
              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  className="t-label"
                  style={{
                    color:
                      item.kind === "fluid"
                        ? "var(--color-accent)"
                        : "var(--color-border)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {item.token}
                </span>
                <span
                  className="t-label"
                  style={{ color: "var(--color-muted)" }}
                >
                  {item.kind}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          GRID
      ───────────────────────────────────────────────── */}
      <section style={{ paddingBottom: sp(120) }}>
        <div
          className="container"
          style={{
            marginBottom: sp(48),
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <p className="t-label" style={{ color: "var(--color-muted)" }}>
            Grid System
          </p>
          <p className="t-label" style={{ color: "var(--color-muted)" }}>
            12 col · 80px margin · 24px gutter
          </p>
        </div>

        <div className="container ds-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                padding: `${sp(20)} ${sp(12)}`,
                borderRadius: sp(6),
                display: "flex",
                flexDirection: "column",
                gap: sp(8),
              }}
            >
              <span
                className="t-label"
                style={{ color: "var(--color-muted)" }}
              >
                {i + 1}
              </span>
              <div
                style={{
                  width: "100%",
                  height: sp(60),
                  background: i === 0 ? "var(--color-accent)" : "var(--color-border)",
                  borderRadius: sp(4),
                  opacity: i === 0 ? 1 : 0.4,
                }}
              />
            </div>
          ))}
        </div>

        {/* Span examples */}
        <div
          className="container ds-grid"
          style={{ marginTop: "var(--gutter)" }}
        >
          {[
            { span: 3, label: "3 col" },
            { span: 5, label: "5 col" },
            { span: 4, label: "4 col" },
          ].map(({ span, label }) => (
            <div
              key={label}
              style={{
                gridColumn: `span ${span}`,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                padding: `${sp(20)} ${sp(20)}`,
                borderRadius: sp(6),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span className="t-label" style={{ color: "var(--color-muted)" }}>
                {label}
              </span>
              <span
                className="t-label"
                style={{
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                span {span}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          SPACING SCALE
      ───────────────────────────────────────────────── */}
      <section style={{ paddingBottom: sp(160) }}>
        <div className="container" style={{ marginBottom: sp(48) }}>
          <p className="t-label" style={{ color: "var(--color-muted)" }}>
            Spacing · calc(var(--vw) × N)
          </p>
        </div>

        <div
          className="container"
          style={{ display: "flex", flexDirection: "column", gap: sp(12) }}
        >
          {[8, 16, 24, 40, 64, 80, 120].map((n) => (
            <div
              key={n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: sp(24),
              }}
            >
              <span
                className="t-label"
                style={{
                  color: "var(--color-muted)",
                  fontFamily: "var(--font-mono)",
                  width: sp(80),
                  flexShrink: 0,
                }}
              >
                × {n}
              </span>
              <div
                style={{
                  height: "1px",
                  width: `calc(var(--vw) * ${n})`,
                  background: "var(--color-accent)",
                  flexShrink: 0,
                }}
              />
              <span
                className="t-label"
                style={{ color: "var(--color-border)", fontFamily: "var(--font-mono)" }}
              >
                {n}px @ 1440
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────── */}
      <footer
        className="container"
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: sp(32),
          paddingBottom: sp(32),
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span className="t-label" style={{ color: "var(--color-muted)" }}>
          JMR Design System
        </span>
        <span className="t-label" style={{ color: "var(--color-muted)" }}>
          Canvas 1440 × 900 · 3 units · 12 col
        </span>
      </footer>
    </main>
  );
}
