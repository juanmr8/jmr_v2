"use client"

import { motion, useInView, type UseInViewOptions } from "motion/react"
import { useCallback, useEffect, useRef, useState, type Ref } from "react"

import { cn } from "@/lib/utils"

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface Token {
	text: string
	spaceAfter: boolean
}

/**
 * Splits text into tokens the browser can independently wrap.
 * Hyphenated words like "self-sovereignty" become ["self-", "sovereignty"]
 * so each part gets its own span and can be measured on whichever line
 * the browser places it.
 */
function tokenize(input: string): Token[] {
	const words = input.split(/\s+/).filter(Boolean)
	const tokens: Token[] = []

	words.forEach((word, i) => {
		const isLastWord = i === words.length - 1
		const parts = word.split(/(?<=[—-])/).filter(Boolean)
		parts.forEach((text, j) => {
			tokens.push({ text, spaceAfter: j === parts.length - 1 && !isLastWord })
		})
	})

	return tokens
}

function groupTokensByLine(spans: HTMLSpanElement[]): Token[][] {
	const lineMap = new Map<number, Token[]>()

	for (const span of spans) {
		const top = Math.round(span.getBoundingClientRect().top)
		if (!lineMap.has(top)) lineMap.set(top, [])
		lineMap.get(top)!.push({
			text: span.dataset.word ?? "",
			spaceAfter: span.dataset.spaceAfter === "1",
		})
	}

	return Array.from(lineMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([, tokens]) => tokens)
}

function joinLineTokens(tokens: Token[]): string {
	return tokens
		.map((t, i) => (i < tokens.length - 1 && t.spaceAfter ? t.text + " " : t.text))
		.join("")
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ContainerTag = "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export interface ParagraphRevealProps {
	children: string
	className?: string
	/** HTML element to render as the container */
	as?: ContainerTag
	/** Seconds between each line's animation start */
	stagger?: number
	/** Duration of each line's animation */
	duration?: number
	/** Initial delay before the first line starts */
	delay?: number
	/** When true, only animates once (even if scrolled out and back) */
	once?: boolean
	/** rootMargin passed to useInView — e.g. '0px 0px -100px 0px' to trigger 100px before the element enters */
	viewOffset?: UseInViewOptions["margin"]
	/** External animate override — bypasses the inView trigger when provided */
	animate?: boolean
	/** Easing curve for the slide animation */
	ease?: number[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ParagraphReveal({
	children,
	className,
	as: Tag = "div",
	stagger = 0.08,
	duration = 0.75,
	delay = 0,
	once = true,
	viewOffset = "0px 0px -5% 0px",
	animate: externalAnimate,
	ease = [0.16, 1, 0.3, 1],
}: ParagraphRevealProps) {
	const containerRef = useRef<HTMLElement>(null)
	const ghostRef = useRef<HTMLSpanElement>(null)
	const [lines, setLines] = useState<Token[][]>([])
	const inView = useInView(containerRef, { once, margin: viewOffset })
	const shouldAnimate = externalAnimate !== undefined ? externalAnimate : inView
	const tokens = tokenize(children)
	const measure = useCallback(() => {
		if (!ghostRef.current) return
		const spans = Array.from(ghostRef.current.querySelectorAll<HTMLSpanElement>("[data-word]"))
		if (spans.length === 0) return
		setLines(groupTokensByLine(spans))
	}, [])

	useEffect(() => {
		measure()
		const ro = new ResizeObserver(measure)
		if (containerRef.current) ro.observe(containerRef.current)
		return () => ro.disconnect()
	}, [measure])

	return (
		<Tag ref={containerRef as Ref<HTMLDivElement>} className={cn("relative block", className)}>
			{/* Screen-reader accessible text */}
			<span className="sr-only">{children}</span>

			{/* Ghost layer: invisible but drives height + provides measurement targets. span (not div) so it's valid inside p, h1, etc. */}
			<span ref={ghostRef} aria-hidden className="invisible block select-none">
				{tokens.map((token, i) => (
					<span key={i} data-word={token.text} data-space-after={token.spaceAfter ? "1" : "0"}>
						{token.text}
						{token.spaceAfter ? " " : ""}
					</span>
				))}
			</span>

			{/* Animated layer: overlaid on the ghost. Each line is overflow-hidden to mask the slide-up. span (not div) so it's valid inside p, h1, etc. */}
			{lines.length > 0 && (
				<span className="absolute inset-0 block" aria-hidden>
					{lines.map((lineTokens, lineIdx) => (
						<span key={lineIdx} className="-mb-[0.15em] block overflow-hidden pb-[0.15em]">
							<motion.span
								className="block"
								initial={{ y: "110%" }}
								animate={{ y: shouldAnimate ? "0%" : "120%" }}
								transition={{
									type: "tween",
									duration,
									delay: delay + lineIdx * stagger,
									ease: ease as [number, number, number, number],
								}}
							>
								{joinLineTokens(lineTokens)}
							</motion.span>
						</span>
					))}
				</span>
			)}
		</Tag>
	)
}
