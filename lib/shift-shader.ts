export const shiftFragShader = `
#ifdef GL_ES
precision highp float;
#endif

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

uniform float u_time;
uniform vec2 u_resolution;
uniform float dpi;

uniform sampler2D image;

uniform vec2 shift;        // signed mouse velocity; .x = horizontal, .y = vertical

// wave / wobble
uniform float waveAmp;
uniform float waveFreqX;
uniform float waveFreqY;
uniform float waveSpeed;

// per-channel directional translation (in UV space, scaled by signed shift)
uniform float redShift;
uniform float greenShift;
uniform float blueShift;

// per-channel opacity (0..1+) — scales each ghost's contribution
uniform float redAlpha;
uniform float greenAlpha;
uniform float blueAlpha;

// tint
uniform float tintExp;
uniform float tintMul;

// crossfade base → ghost layer
uniform float crossfadeStart;
uniform float crossfadeEnd;

varying vec2 v_texcoord;

vec4 sampleColor(vec2 uv) {
    vec4 color = texture2D(image, uv);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        color = vec4(0.0);
    }
    return color;
}

void main(void) {
    vec2 uv = (gl_FragCoord.xy - (100.0 * dpi)) / (u_resolution.xy - (200.0 * dpi));

    vec4 base = sampleColor(uv);
    float mag = length(shift);

    // wobble vector points along the mouse-velocity direction.
    // (0.5 + 0.5*sin) is non-negative, so multiplying by signed shift keeps
    // the wave pointing in the same 2D direction as the delta, with organic
    // magnitude variation across uv and time.
    float wobScalar = waveAmp *
        (0.5 + 0.5 * sin(u_time * waveSpeed + uv.x * waveFreqX + uv.y * waveFreqY));
    wobScalar *= mix(0.9, 1.1, rand(uv));
    vec2 wave = shift * wobScalar;

    // per-channel translation along the same 2D direction as shift
    vec2 redOff   = wave + shift * redShift;
    vec2 greenOff = wave + shift * greenShift;
    vec2 blueOff  = wave + shift * blueShift;

    vec4 rS = sampleColor(uv + redOff);
    vec4 gS = sampleColor(uv + greenOff);
    vec4 bS = sampleColor(uv + blueOff);

    // luminance → primary tint, with midtone lift via tintExp, then scaled
    // by per-channel alpha so each ghost can be dialed independently
    float rB = pow(dot(rS.rgb, vec3(0.299, 0.587, 0.114)), tintExp) * redAlpha;
    float gB = pow(dot(gS.rgb, vec3(0.299, 0.587, 0.114)), tintExp) * greenAlpha;
    float bB = pow(dot(bS.rgb, vec3(0.299, 0.587, 0.114)), tintExp) * blueAlpha;
    vec3 ghosts = vec3(rB, gB, bB) * tintMul;

    // ghost layer alpha = max of channel alphas (each gated by its own alpha
    // so a muted channel doesn't contribute to the halo), then by motion
    float k = smoothstep(crossfadeStart, crossfadeEnd, mag);
    float ghostA = max(
        max(rS.a * redAlpha, gS.a * greenAlpha),
        bS.a * blueAlpha
    ) * k;

    // BASE ON TOP of ghosts: where base is opaque, base wins; where base is
    // transparent, the colored wobble shows through.
    vec3 col = mix(ghosts, base.rgb, base.a);
    float a = max(base.a, ghostA);

    col = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, a);
}
`
