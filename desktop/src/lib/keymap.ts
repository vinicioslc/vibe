export function modifiersFromEvent(e: KeyboardEvent | React.KeyboardEvent): string[] {
	const mods: string[] = []
	if (e.ctrlKey && !e.metaKey) mods.push('Ctrl')
	else if (e.metaKey && !e.ctrlKey) mods.push('Cmd')
	else if (e.ctrlKey && e.metaKey) mods.push('CmdOrCtrl')
	if (e.shiftKey) mods.push('Shift')
	if (e.altKey) mods.push('Alt')
	return mods
}

export function isModifierKey(key: string): boolean {
	return ['Control', 'Shift', 'Alt', 'Meta'].includes(key)
}

export function codeToKey(code: string): string | null {
	if (code.startsWith('Key')) return code.slice(3)
	if (code.startsWith('Digit')) return code.slice(5)
	if (code.startsWith('Numpad')) return code

	const specialMap: Record<string, string> = {
		Space: 'Space',
		Enter: 'Enter',
		Tab: 'Tab',
		Escape: 'Escape',
		Backspace: 'Backspace',
		Delete: 'Delete',
		Insert: 'Insert',
		Home: 'Home',
		End: 'End',
		PageUp: 'PageUp',
		PageDown: 'PageDown',
		ArrowUp: 'Up',
		ArrowDown: 'Down',
		ArrowLeft: 'Left',
		ArrowRight: 'Right',
		CapsLock: 'CapsLock',
		NumLock: 'NumLock',
		ScrollLock: 'ScrollLock',
		PrintScreen: 'PrintScreen',
		Pause: 'Pause',
		ContextMenu: 'ContextMenu',
		Comma: 'Comma',
		Period: 'Period',
		Minus: 'Minus',
		Equal: 'Equal',
		Semicolon: 'Semicolon',
		Quote: 'Quote',
		BracketLeft: 'BracketLeft',
		BracketRight: 'BracketRight',
		Backslash: 'Backslash',
		Backquote: 'Backquote',
		IntlBackslash: 'IntlBackslash',
	}

	if (/^F\d{1,2}$/.test(code)) return code
	return specialMap[code] ?? null
}

export function formatKeyForDisplay(key: string, isMac: boolean): string {
	const displayMap: Record<string, string> = {
		CmdOrCtrl: isMac ? '⌘' : 'Ctrl',
		Cmd: '⌘',
		Ctrl: isMac ? '⌃' : 'Ctrl',
		Shift: isMac ? '⇧' : 'Shift',
		Alt: isMac ? '⌥' : 'Alt',
		Option: '⌥',
	}
	return displayMap[key] ?? key
}
