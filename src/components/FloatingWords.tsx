import { useEffect, useRef } from 'react';

const WORDS = [
  'BI', 'Automação', 'Hermes Agent', 'Sites', 'Lojas Virtuais',
  'Dashboard', 'Power BI', 'QlikSense', 'IA', 'Prospecção',
  'Stripe', 'WhatsApp', 'ETL', 'Supabase', 'Vercel', 'Dados',
];

interface Particle {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  rot: number;
  rotSpeed: number;
  drift: number;
  amp: number;
  phase: number;
  hue: number;
}

// Nuvem de palavras flutuantes com "campo de força" reativo ao mouse:
// as palavras flutuam suavemente, giram levemente e são repelidas/atraídas
// pelo cursor (física com requestAnimationFrame, sem dependências externas).
export default function FloatingWords() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mouse = { x: -9999, y: -9999, active: false, time: 0 };
    const particles: Particle[] = [];
    let raf = 0;
    let last = performance.now();

    const styles = [
      { color: '#fabd00', glow: 'rgba(250,189,0,0.45)', size: 0.9 },
      { color: '#cdbdff', glow: 'rgba(205,189,255,0.4)', size: 0.7 },
      { color: '#ffe4af', glow: 'rgba(255,228,175,0.35)', size: 0.8 },
      { color: '#60a5fa', glow: 'rgba(96,165,250,0.35)', size: 0.65 },
      { color: '#4ade80', glow: 'rgba(74,222,128,0.3)', size: 0.6 },
    ];

    WORDS.forEach((word, i) => {
      const el = document.createElement('span');
      el.textContent = word;
      const s = styles[i % styles.length];
      el.style.cssText = `
        position: absolute;
        left: 0; top: 0;
        white-space: nowrap;
        font-family: var(--font-display);
        font-weight: 700;
        letter-spacing: 0.02em;
        font-size: ${16 + Math.random() * 18}px;
        color: ${s.color};
        opacity: ${0.25 + Math.random() * 0.35};
        text-shadow: 0 0 18px ${s.glow}, 0 0 42px ${s.glow};
        user-select: none;
        pointer-events: none;
        will-change: transform;
        z-index: 2;
      `;
      container.appendChild(el);
      particles.push({
        el,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: 0,
        vy: 0,
        baseX: Math.random() * 100,
        baseY: Math.random() * 100,
        size: 0,
        rot: (Math.random() - 0.5) * 24,
        rotSpeed: (Math.random() - 0.5) * 0.9,
        drift: 0.15 + Math.random() * 0.5,
        amp: 0.8 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        hue: i,
      });
    });

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 100;
      mouse.y = ((e.clientY - rect.top) / rect.height) * 100;
      mouse.active = true;
    };

    const onMouseLeave = () => {
      mouse.active = false;
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      mouse.time += dt;

      for (const p of particles) {
        // Deriva flutuante suave (Lissajous)
        p.phase += dt * p.drift;
        const targetX = p.baseX + Math.sin(p.phase * 1.3) * p.amp;
        const targetY = p.baseY + Math.cos(p.phase * 0.9) * p.amp;
        p.x += (targetX - p.x) * Math.min(dt * 1.2, 1);
        p.y += (targetY - p.y) * Math.min(dt * 1.2, 1);

        // Campo de força do mouse: repulsão quando ativo, atração suave quando não
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (mouse.active && dist < 22) {
          const force = ((22 - dist) / 22) * 60;
          p.vx += (dx / (dist || 1)) * force * dt;
          p.vy += (dy / (dist || 1)) * force * dt;
        } else {
          // Leve atração de volta ao centro de flutuação
          p.vx += (targetX - p.x) * 0.4 * dt;
          p.vy += (targetY - p.y) * 0.4 * dt;
        }
        p.vx *= Math.max(0, 1 - dt * 3.2);
        p.vy *= Math.max(0, 1 - dt * 3.2);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.x = Math.max(-5, Math.min(105, p.x));
        p.y = Math.max(-5, Math.min(105, p.y));
        p.rot += p.rotSpeed * dt;

        p.el.style.transform = `translate(${p.x}%, ${p.y}%) translate(-50%, -50%) rotate(${p.rot}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      particles.forEach((p) => p.el.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
    />
  );
}
