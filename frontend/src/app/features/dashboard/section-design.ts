const PALETTE: [string, string][] = [
  ['#1a73e8', '#0b57d0'], // blue
  ['#0f9d8a', '#0a6f64'], // teal
  ['#188038', '#0d652d'], // green
  ['#8e24aa', '#6a1b9a'], // purple
  ['#d81b60', '#ad1457'], // pink
  ['#c4570a', '#9a4300'], // orange
  ['#3949ab', '#283593'], // indigo
  ['#00838f', '#006064'], // cyan
  ['#c62828', '#8e0000'], // red
  ['#5d4037', '#3e2723'], // brown
  ['#455a64', '#263238'], // slate
];

/** Stable "random" banner look: the same section always gets the same one. */
export function sectionDesign(id: string): { c1: string; c2: string; pattern: number } {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [c1, c2] = PALETTE[h % PALETTE.length];
  return { c1, c2, pattern: h % 5 };
}