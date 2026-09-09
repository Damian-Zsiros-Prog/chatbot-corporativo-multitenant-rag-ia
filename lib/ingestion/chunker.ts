export type TextChunk = {
  content: string;
  sectionRef: string | null;
  chunkIndex: number;
};

export function chunkMarkdown(
  text: string,
  maxSize = Number(process.env.RAG_CHUNK_SIZE ?? 500),
  overlap = Number(process.env.RAG_CHUNK_OVERLAP ?? 80),
): TextChunk[] {
  const sections = text.split(/(?=^#{1,3}\s+)/m);
  const chunks: TextChunk[] = [];
  let index = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)/);
    const sectionRef = headerMatch?.[1]?.trim() ?? null;

    if (trimmed.length <= maxSize) {
      chunks.push({ content: trimmed, sectionRef, chunkIndex: index++ });
      continue;
    }

    let start = 0;
    while (start < trimmed.length) {
      let end = Math.min(start + maxSize, trimmed.length);

      if (end < trimmed.length) {
        const paragraphBreak = trimmed.lastIndexOf("\n\n", end);
        if (paragraphBreak > start + maxSize / 2) {
          end = paragraphBreak;
        }
      }

      const piece = trimmed.slice(start, end).trim();
      if (piece) {
        chunks.push({ content: piece, sectionRef, chunkIndex: index++ });
      }

      if (end >= trimmed.length) break;
      start = Math.max(end - overlap, start + 1);
    }
  }

  return chunks.length > 0
    ? chunks
    : [{ content: text.trim(), sectionRef: null, chunkIndex: 0 }];
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
