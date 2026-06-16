// Vertex shader — bends each plane on the Z axis proportional to scroll
// velocity (uStrength), so the column "warps" while moving and relaxes flat at
// rest. Port of the Codrops infinite-gallery technique.
export const vertexShader = /* glsl */ `
  #define PI 3.1415926535897932384626433832795

  uniform float uStrength;       // smoothed scroll velocity
  uniform vec2  uViewportSizes;  // (width, height) in px

  varying vec2 vUv;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    mv.z += sin(mv.y / uViewportSizes.y * PI + PI / 2.0) * -uStrength;
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`;

// Fragment shader — maps the texture onto the uniform plane with
// `object-fit: cover` behavior, so differing image aspect ratios are cropped
// (centered) instead of stretched.
export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2 uImageSizes;  // source texture px
  uniform vec2 uPlaneSizes;  // plane px (uniform for all planes)
  uniform sampler2D uTexture;
  uniform float uOpacity;    // intro fade-in, 0 -> 1
  uniform float uStrength;   // smoothed scroll velocity (same as the warp)

  varying vec2 vUv;

  // Channel split only kicks in once the warp passes this much strength, then
  // grows with it — so gentle scrolling stays clean and only hard warps smear.
  #define ABERR_THRESHOLD 0.01
  #define ABERR_SCALE 0.172

  void main() {
    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Offset grows past the threshold; direction follows the warp (vertical),
    // so red/blue pull apart along the axis the image is moving.
    float aberr = max(abs(uStrength) - ABERR_THRESHOLD, 0.0) * ABERR_SCALE;
    vec2 dir = vec2(0.0, sign(uStrength));

    float r = texture2D(uTexture, uv + dir * aberr).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - dir * aberr).b;

    gl_FragColor = vec4(r, g, b, uOpacity);

    // The sRGB texture is hardware-decoded to linear on sample, but a custom
    // ShaderMaterial does not auto-encode the output. Without this the linear
    // values land in the sRGB framebuffer raw → darkened and over-saturated.
    #include <colorspace_fragment>
  }
`;
