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
