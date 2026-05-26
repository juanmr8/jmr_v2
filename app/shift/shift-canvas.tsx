'use client'

import { useEffect, useRef } from 'react'
import type GlslCanvas from 'glslCanvas'
import { shiftFragShader } from '@/lib/shift-shader'
import type { ShiftConfig } from './shift-config'

type GlslCanvasInstance = InstanceType<typeof GlslCanvas>

const IMAGE_SRC = '/posters/cirtri.png'
const BLEED = 100

export function ShiftCanvas({ config }: { config: ShiftConfig }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  // updated by the effect below; the rAF loop reads from here every frame so
  // slider changes apply without tearing down the WebGL context.
  const configRef = useRef(config)

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    const img = imgRef.current
    if (!canvas || !wrapper || !img) return

    let teardown: (() => void) | null = null
    let disposed = false

    const start = () => {
      import('glslCanvas').then(({ default: GlslCanvas }) => {
        if (disposed) return
        teardown = setup(canvas, wrapper, img, new GlslCanvas(canvas), configRef)
      })
    }

    if (img.complete && img.naturalWidth > 0) {
      start()
    } else {
      img.addEventListener('load', start, { once: true })
    }

    return () => {
      disposed = true
      img.removeEventListener('load', start)
      teardown?.()
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ width: 'min(90vw, 1200px)', aspectRatio: '1680 / 853' }}
    >
      <img
        ref={imgRef}
        src={IMAGE_SRC}
        alt=""
        className="block h-full w-full opacity-0"
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute"
        style={{ top: -BLEED, left: -BLEED }}
      />
    </div>
  )
}

function setup(
  canvas: HTMLCanvasElement,
  wrapper: HTMLDivElement,
  img: HTMLImageElement,
  sandbox: GlslCanvasInstance,
  configRef: React.RefObject<ShiftConfig>,
) {
  sandbox.load(shiftFragShader)
  sandbox.setUniform('image', img.currentSrc || img.src)
  sandbox.setUniform('shift', 0, 0)

  const sizer = () => {
    const w = wrapper.clientWidth + BLEED * 2
    const h = wrapper.clientHeight + BLEED * 2
    const dpi = window.devicePixelRatio
    canvas.width = w * dpi
    canvas.height = h * dpi
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    sandbox.setUniform('dpi', dpi)
  }
  sizer()

  const onResize = () => sizer()
  window.addEventListener('resize', onResize)

  let lastMouseX: number | null = null
  let lastMouseY: number | null = null
  let lastMoveTime = performance.now()
  let energyX = 0
  let energyY = 0
  let currentShiftX = 0
  let currentShiftY = 0

  const onMouseMove = (e: MouseEvent) => {
    const cfg = configRef.current
    const now = performance.now()
    if (lastMouseX !== null && lastMouseY !== null) {
      const dx = e.clientX - lastMouseX
      const dy = e.clientY - lastMouseY
      const dt = Math.max(now - lastMoveTime, 1)
      // signed speed² per axis — preserves direction while squaring magnitude
      energyX += ((dx * Math.abs(dx)) / dt) * cfg.energyGain
      energyY += ((dy * Math.abs(dy)) / dt) * cfg.energyGain
    }
    lastMouseX = e.clientX
    lastMouseY = e.clientY
    lastMoveTime = now
  }
  window.addEventListener('mousemove', onMouseMove)

  let rafId = 0
  const animate = () => {
    const cfg = configRef.current
    energyX *= cfg.energyDecay
    energyY *= cfg.energyDecay
    const cap = cfg.maxStrength
    const targetX = Math.max(-cap, Math.min(cap, energyX))
    const targetY = Math.max(-cap, Math.min(cap, energyY))
    currentShiftX += (targetX - currentShiftX) * cfg.smoothing
    currentShiftY += (targetY - currentShiftY) * cfg.smoothing

    sandbox.setUniform('shift', currentShiftX, currentShiftY)
    sandbox.setUniform('waveAmp', cfg.waveAmp)
    sandbox.setUniform('waveFreqX', cfg.waveFreqX)
    sandbox.setUniform('waveFreqY', cfg.waveFreqY)
    sandbox.setUniform('waveSpeed', cfg.waveSpeed)
    sandbox.setUniform('redShift', cfg.redShift)
    sandbox.setUniform('greenShift', cfg.greenShift)
    sandbox.setUniform('blueShift', cfg.blueShift)
    sandbox.setUniform('redAlpha', cfg.redAlpha)
    sandbox.setUniform('greenAlpha', cfg.greenAlpha)
    sandbox.setUniform('blueAlpha', cfg.blueAlpha)
    sandbox.setUniform('tintExp', cfg.tintExp)
    sandbox.setUniform('tintMul', cfg.tintMul)
    sandbox.setUniform('crossfadeStart', cfg.crossfadeStart)
    sandbox.setUniform('crossfadeEnd', cfg.crossfadeEnd)

    rafId = requestAnimationFrame(animate)
  }
  animate()

  return () => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mousemove', onMouseMove)
    cancelAnimationFrame(rafId)
  }
}
