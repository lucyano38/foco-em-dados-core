import { useState } from 'react'

const VIDEOS = [
  { src: '/media/video1.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Do caos à decisão em segundos' },
  { src: '/media/video2.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Automação que trabalha por você' },
  { src: '/media/video3.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Pipeline de prospecção inteligente' },
  { src: '/media/video4.mp4', title: 'SEUS DADOS TÊM UMA HISTÓRIA', sub: 'Sites de alta conversão' },
]

export default function VideoShowcase() {
  const [index, setIndex] = useState(0)

  const prev = () => setIndex((i) => (i === 0 ? VIDEOS.length - 1 : i - 1))
  const next = () => setIndex((i) => (i === VIDEOS.length - 1 ? 0 : i + 1))

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold tracking-tight text-glow">
            {VIDEOS[index].title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#d4c5ab]">{VIDEOS[index].sub}</p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_40px_rgba(250,189,0,0.08)]">
            <video
              key={VIDEOS[index].src}
              className="w-full h-auto"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={VIDEOS[index].src} type="video/mp4" />
            </video>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-xs font-mono text-[#ffe4af]/80">
                {index + 1} / {VIDEOS.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  className="pointer-events-auto h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold backdrop-blur-md transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="pointer-events-auto h-9 px-3 rounded-full bg-[#ffc107] hover:bg-[#ffca28] text-[#121414] text-xs font-bold transition-colors"
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
