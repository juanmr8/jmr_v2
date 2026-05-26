'use client'

import { useState } from 'react'
import { ShiftCanvas } from './shift-canvas'
import { ShiftControls } from './shift-controls'
import { DEFAULT_CONFIG, type ShiftConfig } from './shift-config'

export function ShiftPlayground() {
  const [config, setConfig] = useState<ShiftConfig>(DEFAULT_CONFIG)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f7]">
      <span className="pointer-events-none fixed top-4 left-4 z-10 text-xs font-medium uppercase tracking-wider text-neutral-500">
        move mouse
      </span>
      <ShiftCanvas config={config} />
      <ShiftControls config={config} onChange={setConfig} />
    </div>
  )
}
