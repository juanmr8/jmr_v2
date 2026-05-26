'use client'

import { useState } from 'react'
import {
  DEFAULT_CONFIG,
  GROUPS,
  RANGES,
  type ShiftConfig,
} from './shift-config'

type Props = {
  config: ShiftConfig
  onChange: (next: ShiftConfig) => void
}

export function ShiftControls({ config, onChange }: Props) {
  const [open, setOpen] = useState(true)

  const setKey = (key: keyof ShiftConfig, value: number) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="fixed top-4 right-4 z-10 w-72 rounded-lg border border-black/10 bg-white/85 text-sm text-neutral-800 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
        <span className="font-medium tracking-wide uppercase text-xs">
          Shift controls
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onChange(DEFAULT_CONFIG)}
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            reset
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            {open ? 'hide' : 'show'}
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-[80vh] overflow-y-auto px-3 py-2">
          {GROUPS.map((group) => (
            <fieldset key={group.title} className="mb-3 last:mb-0">
              <legend className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {group.title}
              </legend>
              {group.keys.map((key) => (
                <Slider
                  key={key}
                  label={key}
                  value={config[key]}
                  min={RANGES[key][0]}
                  max={RANGES[key][1]}
                  step={RANGES[key][2]}
                  onChange={(v) => setKey(key, v)}
                />
              ))}
            </fieldset>
          ))}
        </div>
      )}
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="mb-2 block">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-neutral-700">{label}</span>
        <span className="font-mono text-[10px] text-neutral-500">
          {formatNumber(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full accent-neutral-800"
      />
    </label>
  )
}

function formatNumber(n: number) {
  if (Math.abs(n) < 0.001 && n !== 0) return n.toExponential(2)
  return n.toFixed(Math.abs(n) < 0.1 ? 4 : 3)
}
