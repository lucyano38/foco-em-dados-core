import { useState, useEffect } from 'react'

const VIDEOS = [
  { src: '/media/video1.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Do caos à decisão em segundos', orientation: 'landscape' },
  { src: '/media/video2.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Automação que trabalha por você', orientation: 'landscape' },
  { src: '/media/video3.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Pipeline de prospecção inteligente', orientation: 'portrait' },
  { src: '/media/video4.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Sites de alta conversão', orientation: 'portrait' },
]

export default function VideoShowcase() {
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleError = () => setError('Não foi possível carregar o vídeo.')
  const clearError = () => setError(null)

  const prev = () => {
    clearError()
    setIndex((i) => (i === 0 ? VIDEOS.length - 1 : i - 1))
  }
  const next = () => {
    clearError()
    setIndex((i) => (i === VIDEOS.length - 1 ? 0 : i + 1))
  }

  const current = VIDEOS[index]
  const isPortrait = current.orientation === 'portrait'

  return (
    <section className="relative py-20 px-4 bg-[#0B1220]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FFFBEB]">
            {current.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#d4c5ab]">{current.sub}</p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_40px_rgba(250,189,0,0.08)]">
            {!error ? (
              <div className={`relative w-full ${isPortrait ? 'max-w-xs sm:max-w-sm' : 'max-w-3xl'} mx-auto`}>
                <video
                  key={current.src}
                  className="w-full h-auto rounded-3xl"
                  autoPlay={!reducedMotion}
                  loop
                  muted
                  playsInline
                  onError={handleError}
                >
                  <source src={current.src} type="video/mp4" />
                </video>
              </div>
            ) : (
              <div className="flex min-h-[260px] w-full items-center justify-center rounded-3xl bg-slate-900/90 p-6 text-center text-slate-200">
                <div>
                  <p className="text-sm font-medium">{error}</p>
                  <button
                    type="button"
                    onClick={clearError}
                    className="mt-3 inline-flex h-9 px-4 rounded-full bg-[#D97706] hover:bg-[#F59E0B] text-[#0B1220] text-xs font-bold cursor-pointer"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-xs font-mono text-[#ffe4af]/80">
                {index + 1} / {VIDEOS.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  className="pointer-events-auto h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc107] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="pointer-events-auto h-9 px-3 rounded-full bg-[#ffc107] hover:bg-[#ffca28] text-[#121414] text-xs font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc107] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
