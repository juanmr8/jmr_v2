"use client"

import { motion, useReducedMotion, type Transition } from "motion/react"

type MotionTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"

// One masked glyph/word: an invisible spacer reserves layout while the visible
// copy rises (and optionally rotates) up through the overflow-hidden mask.
function MaskedRise({
	text,
	start,
	settled,
	rotate,
	transition,
}: {
	text: string
	start: { y: string; rotate: number }
	settled: boolean | null
	rotate: number
	transition: Transition
}) {
	// A wide unit parked below the mask still pokes above it once rotated (the
	// raised end lifts by sin(rotate) × its width, which outruns any riseFrom
	// offset) — hold it transparent until its rise begins.
	const parkedHidden = start.y !== "0%"
	return (
		<>
			<span className="invisible">{text}</span>
			{/* Rotation pushes a glyph's ink past its advance width; bleed the mask's
			    right edge so rotated chars aren't clipped. em-relative → scales with type. */}
			<span className="absolute inset-y-0 -right-[0.3em] left-0 overflow-hidden">
				<motion.span
					className="block origin-bottom"
					initial={{ ...start, opacity: parkedHidden ? 0 : 1 }}
					animate={{
						y: settled ? "0%" : start.y,
						rotate: settled ? 0 : rotate,
						opacity: settled || !parkedHidden ? 1 : 0,
					}}
					// Un-revealing must not mirror the staggered rise: a slow delayed
					// return leaves units caught mid-mask if `active` flips back on.
					// Park fast and uniformly so a re-reveal always starts clean.
					transition={
						settled
							? {
									...transition,
									opacity: { duration: 0.25, delay: transition.delay, ease: "linear" },
								}
							: { duration: 0.2, ease: "easeIn" }
					}
				>
					{text}
				</motion.span>
			</span>
		</>
	)
}

type TransitionProp = Omit<Transition, "delay"> & {
	delay?: number
	charDelayMultiplier?: number
	wordDelayMultiplier?: number
}

function resolveTransition(transitionProp: TransitionProp | undefined) {
	const {
		charDelayMultiplier = 0.03,
		wordDelayMultiplier = 0.08,
		delay: baseDelay = 0,
		duration = 0.75,
		ease = [0.16, 1, 0.3, 1],
		...rest
	} = transitionProp ?? {}
	return { charDelayMultiplier, wordDelayMultiplier, baseDelay, duration, ease, rest }
}

// Hidden resting state for each masked unit: sunk below the mask (and rotated),
// or neutral when reduced motion is on.
function hiddenStart(reduce: boolean | null, rotate: number, riseFrom: string) {
	return reduce ? { y: "0%", rotate: 0 } : { y: riseFrom, rotate }
}

export interface TextRiseProps {
	children: string
	/** Element rendered as the container — style text on it via className */
	as?: MotionTag
	className?: string
	/** Accessible label; defaults to the text content */
	ariaLabel?: string
	/** Drives the reveal — false holds the chars below the mask */
	active?: boolean
	/** Start angle in degrees each char rotates from (settles to 0) */
	rotate?: number
	/** How far below the mask the hidden copy sits — raise past 110% when a
	 * short line-height lets glyph bottoms peek above the mask edge */
	riseFrom?: string
	/** Rise each whole word as one masked unit instead of char-by-char */
	byWord?: boolean
	transition?: TransitionProp
}

export function TextRise({
	children,
	as = "span",
	className,
	ariaLabel,
	active = true,
	rotate = 20,
	riseFrom = "110%",
	byWord = false,
	transition: transitionProp,
}: TextRiseProps) {
	const MotionTag = motion[as]
	const reduce = useReducedMotion()
	const { charDelayMultiplier, wordDelayMultiplier, baseDelay, duration, ease, rest } =
		resolveTransition(transitionProp)

	const settled = active || reduce
	const start = hiddenStart(reduce, rotate, riseFrom)
	const words = children.split(" ")

	if (byWord) {
		return (
			<MotionTag aria-label={ariaLabel ?? children} className={className}>
				{words.map((word, wordIndex) => (
					<span key={wordIndex} aria-hidden className="relative inline-block">
						<MaskedRise
							text={word}
							start={start}
							settled={settled}
							rotate={rotate}
							transition={{
								type: "tween",
								duration,
								ease,
								delay: baseDelay + wordIndex * wordDelayMultiplier,
								...rest,
							}}
						/>
						{wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
					</span>
				))}
			</MotionTag>
		)
	}

	return (
		<MotionTag aria-label={ariaLabel ?? children} className={className}>
			{words.map((word, wordIndex) => (
				<span key={wordIndex} aria-hidden className="relative inline-block whitespace-nowrap">
					{word.split("").map((char, charIndex) => (
						<span key={charIndex} className="relative inline-block">
							<MaskedRise
								text={char}
								start={start}
								settled={settled}
								rotate={rotate}
								transition={{
									type: "tween",
									duration,
									ease,
									delay: baseDelay + charIndex * charDelayMultiplier,
									...rest,
								}}
							/>
						</span>
					))}
					{wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
				</span>
			))}
		</MotionTag>
	)
}
