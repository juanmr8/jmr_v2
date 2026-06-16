# DOM anchor overlays over the WebGL gallery

The home Gallery renders projects as planes in a WebGL canvas (OGL), but each plane's link to its project detail page (`/projects/[slug]`) is a **transparent DOM `<a>` element positioned over the plane and kept in sync with its on-screen rect** — not a click handled inside the canvas via raycasting.

We chose this because real `<a>` tags give crawlable links (SEO), keyboard focus and accessibility, hover-URL preview, and native right-click "open in new tab" — none of which a canvas click handler provides. The cost is that overlay rects must track each plane's animated position, including across the infinite-loop recycling.

## Why this is recorded

The obvious approach is to hit-test clicks inside the canvas. A future reader could mistake the DOM overlays for cruft and "simplify" them into canvas clicks — silently breaking links, SEO, and accessibility. This ADR marks the overlay approach as deliberate: do not remove it without restoring those properties another way.
