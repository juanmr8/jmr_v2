'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type GlslCanvas from 'glslCanvas'
import { buildFragShader } from '@/lib/poster-shader'

type GlslCanvasInstance = InstanceType<typeof GlslCanvas>

const POSTERS = [
  '/posters/poster-1.jpg',
  '/posters/poster-2.jpg',
  '/posters/poster-3.jpg',
]

const TRANSITION_DURATION_S = 3.5

export function PosterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    gsap.registerPlugin(ScrollTrigger)

    let teardown: (() => void) | null = null
    let disposed = false

    // glslCanvas reads `window` at module load — import lazily in the browser.
    import('glslCanvas').then(({ default: GlslCanvas }) => {
      if (disposed) return
      teardown = setup(canvas, new GlslCanvas(canvas))
    })

    function setup(canvas: HTMLCanvasElement, sandbox: GlslCanvasInstance) {
      sandbox.load(buildFragShader(POSTERS.length))

      POSTERS.forEach((src, i) => sandbox.setUniform(`textures[${i}]`, src))
      sandbox.setUniform('startIndex', 0)
      sandbox.setUniform('endIndex', 0)
      sandbox.setUniform('timeline', TRANSITION_DURATION_S + 1)

      let startIndex = 0
      let endIndex = 0
      let targetIndex = 0
      let isAnimating = false
      let transitionStart = performance.now() - 9999
      let rafId: number | null = null

      const sizer = () => {
        const s = Math.min(window.innerWidth, window.innerHeight)
        const dpi = window.devicePixelRatio
        canvas.width = s * 0.6 * dpi
        canvas.height = s * 0.9 * dpi
        canvas.style.width = `${Math.round(s * 0.6)}px`
        canvas.style.height = `${Math.round(s * 0.9)}px`
      }

      const tick = () => {
        const diff = (performance.now() - transitionStart) / 1000
        sandbox.setUniform('timeline', diff)
        if (diff < TRANSITION_DURATION_S) {
          rafId = requestAnimationFrame(tick)
          return
        }
        rafId = null
        isAnimating = false
        // Animation finished — catch up if the scroll position moved on.
        if (targetIndex !== endIndex) startTransition()
      }

      const startTransition = () => {
        if (isAnimating || targetIndex === endIndex) return
        isAnimating = true
        startIndex = endIndex
        endIndex = targetIndex
        transitionStart = performance.now()
        sandbox.setUniform('startIndex', startIndex)
        sandbox.setUniform('endIndex', endIndex)
        tick()
      }

      sizer()
      const onResize = () => sizer()
      window.addEventListener('resize', onResize)

      const trigger = ScrollTrigger.create({
        trigger: '#poster-scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          targetIndex = Math.min(
            POSTERS.length - 1,
            Math.floor(self.progress * POSTERS.length),
          )
          startTransition()
        },
      })

      return () => {
        window.removeEventListener('resize', onResize)
        trigger.kill()
        if (rafId !== null) cancelAnimationFrame(rafId)
      }
    }

    return () => {
      disposed = true
      teardown?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    />
  )
}
