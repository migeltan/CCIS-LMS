const COLORS = ['#1a73e8', '#d81b60', '#188038', '#f9ab00', '#8e24aa', '#00acc1', '#e8710a'];

/** Small confetti burst with no libraries. Skipped if the user prefers reduced motion. */
export function launchConfetti(durationMs = 2400): void {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '2000',
  });

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const pieces = Array.from({ length: 160 }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 120,
    y: h * 0.65,
    vx: (Math.random() - 0.5) * 16,
    vy: -(9 + Math.random() * 11),
    size: 6 + Math.random() * 7,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    round: Math.random() < 0.35,
  }));

  const start = performance.now();

  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = t > durationMs - 600 ? Math.max(0, (durationMs - t) / 600) : 1;

    for (const p of pieces) {
      p.vy += 0.38; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }

    if (t < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  };

  requestAnimationFrame(frame);
}