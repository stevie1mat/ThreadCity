import { useEffect, useRef } from 'react';

export default function BackgroundStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let stars: any[] = [];
    let animationId: number;

    function resize() {
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      stars = Array.from({length: 220}, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height * 0.7,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random(),
        da: (Math.random()-0.5)*0.004
      }));
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!ctx || !c) return;
      ctx.clearRect(0,0,c.width,c.height);
      stars.forEach(s => {
        s.a = Math.max(0.05, Math.min(1, s.a + s.da));
        if (s.a <= 0.05 || s.a >= 1) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${s.a * 0.7})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas id="stars" ref={canvasRef} />;
}
