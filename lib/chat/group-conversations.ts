export type ConversationListItem = {
  id: string;
  title: string;
  updatedAt: string | Date;
  messageCount: number;
};

export type ConversationGroup = {
  label: string;
  items: ConversationListItem[];
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function groupConversationsByDate(
  items: ConversationListItem[],
): ConversationGroup[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const groups: Record<string, ConversationListItem[]> = {
    Hoy: [],
    Ayer: [],
    "Esta semana": [],
    Anteriores: [],
  };

  for (const item of items) {
    const updated = new Date(item.updatedAt).getTime();
    if (updated >= today) {
      groups.Hoy.push(item);
    } else if (updated >= yesterday) {
      groups.Ayer.push(item);
    } else if (updated >= weekAgo) {
      groups["Esta semana"].push(item);
    } else {
      groups.Anteriores.push(item);
    }
  }

  return Object.entries(groups)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, items: list }));
}

export function filterConversations(
  items: ConversationListItem[],
  query: string,
): ConversationListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.title.toLowerCase().includes(q));
}
