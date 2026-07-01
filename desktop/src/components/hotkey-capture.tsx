import { useCallback, useEffect, useRef, useState } from 'react'
import { modifiersFromEvent, isModifierKey, codeToKey, formatKeyForDisplay } from '~/lib/keymap'

interface HotkeyCaptureProps {
	value: string
	onChange: (shortcut: string) => void
}

export default function HotkeyCapture({ value, onChange }: HotkeyCaptureProps) {
	const isMac = navigator.platform.toUpperCase().includes('MAC')
	const [capturing, setCapturing] = useState(false)
	const captureRef = useRef<HTMLDivElement>(null)
	const pendingModifiers = useRef<string[]>([])

	const shortcutKeys = value
		? value.split('+').map((k) => formatKeyForDisplay(k, isMac))
		: []

	const startCapture = useCallback(() => {
		pendingModifiers.current = []
		setCapturing(true)
	}, [])

	const stopCapture = useCallback(() => {
		pendingModifiers.current = []
		setCapturing(false)
	}, [])

	const finalize = useCallback(
		(parts: string[]) => {
			if (parts.length === 0) return
			onChange(parts.join('+'))
			stopCapture()
		},
		[onChange, stopCapture],
	)

	useEffect(() => {
		if (!capturing) return

		const el = captureRef.current
		if (!el) return

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				stopCapture()
				return
			}

			e.preventDefault()
			e.stopPropagation()

			const mods = modifiersFromEvent(e)
			const mainKey = isModifierKey(e.key) ? null : codeToKey(e.code)

			pendingModifiers.current = mods

			if (mainKey) {
				finalize([...mods, mainKey])
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			e.preventDefault()
			e.stopPropagation()

			const mods = modifiersFromEvent(e)
			const pending = pendingModifiers.current

			if (pending.length > 0 && mods.length === 0) {
				finalize([...pending])
			}
		}

		el.addEventListener('keydown', handleKeyDown, true)
		el.addEventListener('keyup', handleKeyUp, true)

		return () => {
			el.removeEventListener('keydown', handleKeyDown, true)
			el.removeEventListener('keyup', handleKeyUp, true)
		}
	}, [capturing, stopCapture, finalize])

	useEffect(() => {
		if (!capturing) return

		function handleBlur() {
			stopCapture()
		}

		const el = captureRef.current
		if (!el) return

		el.addEventListener('blur', handleBlur, true)
		el.focus()

		return () => {
			el.removeEventListener('blur', handleBlur, true)
		}
	}, [capturing, stopCapture])

	return (
		<div
			ref={captureRef}
			tabIndex={0}
			role="button"
			aria-label="Click to capture keyboard shortcut"
			data-capturing={capturing}
			onClick={capturing ? undefined : startCapture}
			className={`relative flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm outline-none transition-all duration-150
				${
					capturing
						? 'border-primary/70 bg-primary/[0.04] ring-2 ring-primary/30 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
						: 'border-input/75 bg-card shadow-xs hover:border-ring/50 hover:bg-accent/30'
				}`}>
			{capturing ? (
				<span className="text-sm font-medium text-foreground/70">
					Press shortcut...
				</span>
			) : shortcutKeys.length > 0 ? (
				shortcutKeys.map((key, i) => (
					<kbd
						key={i}
						className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border/80 bg-background/70 px-1.5 font-mono text-[11px] font-medium text-foreground/80 shadow-[0_1px_0_1px_rgba(0,0,0,0.04)]">
						{key}
					</kbd>
				))
			) : (
				<span className="text-sm text-muted-foreground/60 italic">None</span>
			)}
		</div>
	)
}
