import { useEffect, useRef } from 'react';

export default function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes for dynamic 3D depth effect
    const particles: { x: number; y: number; z: number; vx: number; vy: number; size: number }[] = [];
    const count = 60;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2 + 1,
      });
    }

    let angle = 0;

    const render = () => {
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, height);

      angle += 0.002;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Draw gradient orbs
      const orb1X = width / 2 + cos * 200;
      const orb1Y = height / 2 + sin * 150;
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 400);
      grad1.addColorStop(0, 'rgba(6, 182, 212, 0.15)'); // cyan-500
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const orb2X = width / 2 - cos * 250;
      const orb2Y = height / 2 - sin * 200;
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 500);
      grad2.addColorStop(0, 'rgba(59, 130, 246, 0.12)'); // blue-500
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Render 3D particles & lines
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = 'rgba(34, 211, 238, 0.6)'; // cyan-400
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
