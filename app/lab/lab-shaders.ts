/* ════════════════════════════════════════════════════════════
   LAB SHADERS · the field's warp + chromatic aberration.
   The project detail gallery's language (galleryShaders.ts —
   Codrops Z-bend), generalised to the Lab's two axes: the bend
   and the channel split follow the pan velocity VECTOR, so a
   diagonal drag smears diagonally. OGL, not three — attributes
   and matrices are declared explicitly and there is no
   colorspace include: OGL samples sRGB textures raw and writes
   them raw, so in/out match without correction.
════════════════════════════════════════════════════════════ */

// Vertex — bends each plane on the Z axis proportional to pan velocity
// (uStrength, normalised per axis), so the field warps while moving and
// relaxes flat at rest. Needs a perspective camera: under an orthographic one
// the Z displacement would be invisible.
export const labVertex = /* glsl */ `
  #define PI 3.1415926535897932384626433832795

  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec2 uStrength;       // smoothed pan velocity, normalised [-1,1] per axis
  uniform float uBend;          // full-scale warp amplitude (px)
  uniform vec2 uViewportSizes;  // (width, height) in px

  varying vec2 vUv;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // 1 at the viewport centre, easing to 0 at its edges — on each axis.
    float wx = sin(mv.x / uViewportSizes.x * PI + PI / 2.0);
    float wy = sin(mv.y / uViewportSizes.y * PI + PI / 2.0);
    mv.z += (wx * -uStrength.x + wy * -uStrength.y) * uBend;
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`;

// Fragment — maps the texture with `object-fit: cover` behavior (differing
// aspect ratios crop, centered, never stretch). Pieces whose image hasn't
// loaded yet paint the flat placeholder color instead. The channel split only
// kicks in once the warp passes a threshold, then grows with it — gentle
// panning stays clean, hard flings smear along the direction of travel.
export const labFragment = /* glsl */ `
  precision highp float;

  uniform vec2 uImageSizes;  // source texture px
  uniform vec2 uPlaneSizes;  // plane box (any unit — only the ratio matters)
  uniform sampler2D uTexture;
  uniform vec3 uColor;       // flat fill while uHasTexture is 0
  uniform float uHasTexture; // 1 = sample uTexture, 0 = paint uColor
  uniform float uOpacity;    // entrance fade, 0 -> 1
  uniform vec2 uStrength;    // same normalised velocity as the warp

  varying vec2 vUv;

  #define ABERR_THRESHOLD 0.006
  #define ABERR_SCALE 0.275

  void main() {
    if (uHasTexture < 0.5) {
      gl_FragColor = vec4(uColor, uOpacity);
      return;
    }

    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Per-axis excess past the threshold, signed by the direction of travel —
    // red/blue pull apart along the axis (or diagonal) the field is moving.
    vec2 excess = max(abs(uStrength) - vec2(ABERR_THRESHOLD), 0.0);
    vec2 off = excess * sign(uStrength) * ABERR_SCALE;

    float r = texture2D(uTexture, uv + off).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - off).b;

    gl_FragColor = vec4(r, g, b, uOpacity);
  }
`;
