const includes = `
#define NUM_OCTAVES 5

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
        mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
        mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
    return res*res;
}

float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}
`

export function buildFragShader(count: number): string {
  const ifLoop = Array.from({ length: count }, (_, index) => {
    return `if (index == ${index}) { return texture2D(textures[${index}], uv); }`
  }).join(' else ')

  return `
#ifdef GL_ES
precision highp float;
#endif

#define MAX ${count}

uniform float u_time;
uniform vec2 u_resolution;

uniform float timeline;

uniform sampler2D textures[MAX];

uniform float startIndex;
uniform float endIndex;

varying vec3 v_normal;
varying vec2 v_texcoord;

${includes}

vec4 sampleColor(int index, vec2 uv) {
    ${ifLoop}
    return vec4(1.0, 1.0, 1.0, 1.0);
}

void main(void) {
    vec2 uv = v_texcoord;
    uv -= 0.5;

    float wave = fbm(3.5 * uv + 0.2 * u_time);
    float strength = smoothstep(0.0, 1.0, timeline) - smoothstep(2.0, 3.0, timeline);
    float distortion = mix(1.0, 1.0 + strength, wave);

    uv *= distortion;
    uv += 0.5;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        discard;
    }

    vec4 startTexture = sampleColor(int(startIndex), uv);
    vec4 endTexture = sampleColor(int(endIndex), uv);

    float changeTimeline = smoothstep(0.5, 2.0, timeline);
    float mixer = 1.0 - step(changeTimeline, wave);

    vec4 color = mix(startTexture, endTexture, mixer);

    gl_FragColor = color;
}
`
}
