# jmr_v2

Personal creative-practice portfolio site. This glossary defines the domain language used across the site; it is not a spec.

## Gallery

**Gallery**:
The WebGL strip in the bottom-right zone of the home page that presents projects as square planes. One project per plane. Replaces the earlier DOM placeholder strip.
_Avoid_: Carousel, slider

**Plane**:
A single square quad in the Gallery, rendered in WebGL, representing one Project. May be a flat color (placeholder) or, later, a project image.
_Avoid_: Tile, card, slide

**Active Slot**:
The fixed leftmost position in the Gallery. The Plane occupying it is the Active Plane: rendered at full size (covering the strip's full height). All other Planes are scaled down. Planes scale up as they translate into the Active Slot.
_Avoid_: Hero, focus, current (as nouns for this position)

**Active Project**:
The Project whose Plane currently occupies the Active Slot. There is always exactly one (the Gallery snaps to it). It drives the Gallery counter and the bottom-left rail meta.
_Avoid_: Selected, current project

**Project**:
A body of work shown as one Plane in the Gallery and linked to its own detail page (`/projects/[slug]`).
_Avoid_: Work item, piece

**Intro**:
The animation that plays whenever the Gallery mounts: each Plane slides in from off-screen (below and to the right of its slot) and settles into the resting layout, staggered left-to-right so the strip assembles itself — Active Plane first, then the queue. Scroll input is locked until it finishes; skipped entirely under reduced-motion.
_Avoid_: Reveal, entrance, splash

**Preloader**:
The page-level opening sequence that plays once per session before the home page is usable: a field of pulsing circles and triangles at the center collapses until only the center circle and triangle remain; those slide up into their mask and exit, the Hero Pair appears in the bottom-left corner, and the home page's text and two dividing lines animate in. Distinct from the Gallery's Intro — and it precedes it: when the Preloader finishes it triggers the Gallery Intro. Despite the name it is **not** load-gated; it runs on a fixed timeline regardless of asset readiness. Skipped under reduced-motion or when its session flag is already set; scroll is locked while it plays.
_Avoid_: Intro (reserved for the Gallery), splash, loader (implies load-gating)

**Hero Pair**:
The circle and triangle that appear in the bottom-left rail as the Preloader's center pair exits — the resting geometric primitives of the home page. A distinct pair from the center shapes: the center pair exits upward into its mask; the Hero Pair appears in place in the corner.
_Avoid_: Logo, mark

## Lab

**Lab**:
The site's experiments section (`/lab`): a full-page field a visitor pans freely toward all four corners, wrapping seamlessly — no edge, no reset. Distinct from the Gallery (the home's project strip).
_Avoid_: Playground, archive

**Piece**:
One work shown in the Lab — a plane in the field, linked to its own detail route (`/lab/[slug]`). The Lab's counterpart to the Gallery's Project.
_Avoid_: Project (reserved for Work), item, tile

**Panel**:
A Piece's detail surface: a right-hand drawer that slides in over the dimmed Lab field when a Piece opens (its own route — the field stays in place behind it). Shows the Piece's title, description, and live link where they exist.
_Avoid_: Modal, dialog, sidebar

**Cluster**:
The single hand-placed arrangement of Pieces that tiles the Lab's infinite field in both axes. Each Piece is placed once, in Cluster coordinates (design units); the layout repeats the whole Cluster, so adding a Piece is a data change, never a layout change.
_Avoid_: Grid, tile (as a noun for the arrangement), page
