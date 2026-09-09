import { QUICK_PROMPTS } from "@/lib/constants";
import type { Citation } from "@/lib/db/schema";

export function getFollowUpSuggestions(
  lastQuestion: string,
  citations?: Citation[],
): string[] {
  const normalized = lastQuestion.trim().toLowerCase();
  const pool = QUICK_PROMPTS.filter(
    (prompt) => prompt.toLowerCase() !== normalized,
  );

  const suggestions: string[] = [];

  if (citations?.[0]?.documentTitle) {
    const docName = citations[0].documentTitle.split("(")[0]?.trim();
    if (docName) {
      suggestions.push(`¿Qué más establece ${docName}?`);
    }
  }

  for (const prompt of pool) {
    if (suggestions.length >= 3) break;
    if (!suggestions.includes(prompt)) {
      suggestions.push(prompt);
    }
  }

  return suggestions.slice(0, 3);
}
