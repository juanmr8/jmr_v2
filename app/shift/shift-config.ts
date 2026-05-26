export type ShiftConfig = {
  // input mapping (mouse → shift uniform)
  energyGain: number
  energyDecay: number
  maxStrength: number
  smoothing: number
  // wave / wobble
  waveAmp: number
  waveFreqX: number
  waveFreqY: number
  waveSpeed: number
  // per-channel directional translation
  redShift: number
  greenShift: number
  blueShift: number
  // per-channel opacity (0..1+) — scales each ghost's contribution
  redAlpha: number
  greenAlpha: number
  blueAlpha: number
  // tint
  tintExp: number
  tintMul: number
  // crossfade base → ghost alpha
  crossfadeStart: number
  crossfadeEnd: number
}

export const DEFAULT_CONFIG: ShiftConfig = {
  energyGain: 0.0009,
  energyDecay: 0.91,
  maxStrength: 0.45,
  smoothing: 0.2,
  waveAmp: 0.02,
  waveFreqX: 5.0,
  waveFreqY: 7.0,
  waveSpeed: 3.6,
  redShift: 0.004,
  greenShift: 0.015,
  blueShift: 0.028,
  redAlpha: 1.26,
  greenAlpha: 0.31,
  blueAlpha: 0.2,
  tintExp: 0.6,
  tintMul: 2.4,
  crossfadeStart: 0.04,
  crossfadeEnd: 0.45,
}

// [min, max, step]
export const RANGES: Record<keyof ShiftConfig, [number, number, number]> = {
  energyGain: [0.0001, 0.01, 0.0001],
  energyDecay: [0.7, 0.99, 0.005],
  maxStrength: [0.1, 3.0, 0.05],
  smoothing: [0.05, 0.5, 0.01],
  waveAmp: [0, 0.15, 0.001],
  waveFreqX: [0, 20, 0.25],
  waveFreqY: [0, 20, 0.25],
  waveSpeed: [0, 5, 0.05],
  redShift: [-0.2, 0.2, 0.002],
  greenShift: [-0.2, 0.2, 0.002],
  blueShift: [-0.2, 0.2, 0.002],
  redAlpha: [0, 2, 0.01],
  greenAlpha: [0, 2, 0.01],
  blueAlpha: [0, 2, 0.01],
  tintExp: [0.3, 1.5, 0.02],
  tintMul: [0.5, 4.0, 0.05],
  crossfadeStart: [0, 0.5, 0.01],
  crossfadeEnd: [0.05, 1.5, 0.01],
}

export const GROUPS: { title: string; keys: (keyof ShiftConfig)[] }[] = [
  { title: 'Input', keys: ['energyGain', 'energyDecay', 'maxStrength', 'smoothing'] },
  { title: 'Wave', keys: ['waveAmp', 'waveFreqX', 'waveFreqY', 'waveSpeed'] },
  {
    title: 'Channels',
    keys: [
      'redShift',
      'greenShift',
      'blueShift',
      'redAlpha',
      'greenAlpha',
      'blueAlpha',
    ],
  },
  { title: 'Tint', keys: ['tintExp', 'tintMul'] },
  { title: 'Crossfade', keys: ['crossfadeStart', 'crossfadeEnd'] },
]
