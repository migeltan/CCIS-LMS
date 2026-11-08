const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChunk(length: number): string {
  let chunk = '';
  for (let i = 0; i < length; i += 1) {
    chunk += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return chunk;
}

/** Builds a join code like "A1B2-C3D4". Replace with a server-side value once the backend issues codes. */
export function generateSectionCode(): string {
  return `${randomChunk(4)}-${randomChunk(4)}`;
}
