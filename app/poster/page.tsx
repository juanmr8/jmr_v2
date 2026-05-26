import { PosterCanvas } from './poster-canvas'

export default function PosterPage() {
  return (
    <div id="poster-scroll-container" className="relative h-[300vh] bg-[#f7f7f7]">
      <span className="pointer-events-none fixed top-4 left-4 z-10 text-xs font-medium uppercase tracking-wider text-neutral-500">
        scroll
      </span>
      <PosterCanvas />
    </div>
  )
}
