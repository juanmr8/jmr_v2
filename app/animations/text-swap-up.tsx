"use client"

import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const DURATION = 0.88
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/**
 * One character. Each hover (playKey bump) remounts the animated subtree at its
 * start position, so the swap always runs from in-position (0%) fully upward:
 * the resting glyph rises out the top (0% -> -100%) while a duplicate rises in
 * from a bottom mask (100% -> 0%). The
 * remount on the *next* hover is the zero-second reset — instant and identical,
 * so it never resets mid-flight.
 */
function SwapChar({ char, delay, playKey }: { char: string; delay: number; playKey: number }) {
	const reduce = useReducedMotion()

	if (reduce || playKey === 0) {
		return <span className="inline-block">{char}</span>
	}

	const transition = { duration: DURATION, ease: EASE, delay }

	return (
		<span key={playKey} className="relative inline-block">
			{/* Invisible spacer reserves the char's layout box */}
			<span className="invisible">{char}</span>
			<span className="absolute inset-0 overflow-hidden">
				<motion.span
					className="block origin-bottom-left"
					initial={{ y: "0%" }}
					animate={{ y: "-100%" }}
					transition={transition}
				>
					{char}
				</motion.span>
				<motion.span
					aria-hidden
					className="absolute inset-0 block origin-bottom-left"
					initial={{ y: "100%" }}
					animate={{ y: "0%" }}
					transition={transition}
				>
					{char}
				</motion.span>
			</span>
		</span>
	)
}

export interface TextSwapUpProps {
	children: string
	className?: string
	/** Bump to replay the upward swap; 0 renders the idle state with no animation */
	playKey?: number
	/** Seconds of delay added per character — the swap stagger */
	stagger?: number
}

export function TextSwapUp({ children, className, playKey = 0, stagger = 0.012 }: TextSwapUpProps) {
	return (
		<span className={cn("inline", className)}>
			{[...children].map((char, i) =>
				char === " " ? (
					<span key={i}> </span>
				) : (
					<SwapChar key={i} char={char} delay={i * stagger} playKey={playKey} />
				),
			)}
		</span>
	)
}
