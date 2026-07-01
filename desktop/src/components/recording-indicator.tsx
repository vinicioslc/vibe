import { useEffect, useRef, useState } from 'react'

interface AudioEngine {
	ctx: AudioContext
	analyser: AnalyserNode
	stream: MediaStream
	buffer: Uint8Array<ArrayBuffer>
}

async function createAudioEngine(): Promise<AudioEngine> {
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
	})

	const ctx = new AudioContext()
	if (ctx.state === 'suspended') await ctx.resume()

	const highpass = ctx.createBiquadFilter()
	highpass.type = 'highpass'
	highpass.frequency.value = 85
	highpass.Q.value = 0.7

	const gain = ctx.createGain()
	gain.gain.value = 4

	const analyser = ctx.createAnalyser()
	analyser.fftSize = 64
	analyser.smoothingTimeConstant = 0.6

	const source = ctx.createMediaStreamSource(stream)
	source.connect(highpass)
	highpass.connect(gain)
	gain.connect(analyser)

	return { ctx, analyser, stream, buffer: new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount)) }
}

function destroyAudioEngine(engine: AudioEngine | null) {
	if (!engine) return
	engine.stream.getTracks().forEach((t) => t.stop())
	if (engine.ctx.state !== 'closed') engine.ctx.close()
}

const BAR_COUNT = 8

export default function RecordingIndicator() {
	const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(0))
	const engineRef = useRef<AudioEngine | null>(null)
	const frameRef = useRef<number>(0)

	useEffect(() => {
		document.body.style.backgroundColor = 'transparent'
		document.documentElement.style.backgroundColor = 'transparent'

		let cancelled = false

		createAudioEngine()
			.then((engine) => {
				if (cancelled) {
					destroyAudioEngine(engine)
					return
				}
				engineRef.current = engine

				const tick = () => {
					if (cancelled) return
					engine.analyser.getByteFrequencyData(engine.buffer)

					const binSize = Math.floor(engine.buffer.length / BAR_COUNT)
					const newLevels: number[] = []
					for (let i = 0; i < BAR_COUNT; i++) {
						let sum = 0
						for (let j = 0; j < binSize; j++) {
							sum += engine.buffer[i * binSize + j]
						}
						const avg = sum / (binSize * 255)
						newLevels.push(Math.min(1, Math.max(0, avg * 1.8)))
					}
					setLevels(newLevels)
					frameRef.current = requestAnimationFrame(tick)
				}
				tick()
			})
			.catch((err) => console.error('RecordingIndicator:', err))

		return () => {
			cancelled = true
			cancelAnimationFrame(frameRef.current)
			destroyAudioEngine(engineRef.current)
			engineRef.current = null
		}
	}, [])

	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-black/70 px-4 py-2.5 shadow-lg backdrop-blur-md">
				<span className="relative flex h-2 w-2">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
					<span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
				</span>

				<div className="flex h-5 items-end gap-[3px]">
					{levels.map((level, i) => (
						<div
							key={i}
							className="w-[3px] rounded-full bg-white/80 transition-all duration-75"
							style={{ height: `${Math.max(3, level * 20)}px` }}
						/>
					))}
				</div>
			</div>
		</div>
	)
}
