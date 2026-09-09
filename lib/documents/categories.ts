export const DOCUMENT_CATEGORIES = [
  "reglamento",
  "politica",
  "procedimiento",
  "manual",
  "codigo_conducta",
  "norma",
  "talento_humano",
  "seguridad",
  "otro",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  reglamento: "Reglamento interno",
  politica: "Política corporativa",
  procedimiento: "Procedimiento operativo",
  manual: "Manual / guía",
  codigo_conducta: "Código de conducta",
  norma: "Norma / vestimenta",
  talento_humano: "Talento humano / RH",
  seguridad: "Seguridad y salud (SST)",
  otro: "Otro",
};

const CATEGORY_KEYWORDS: Record<DocumentCategory, string[]> = {
  reglamento: [
    "horario",
    "jornada",
    "vacaciones",
    "teletrabajo",
    "ingreso",
    "tolerancia",
    "turno",
    "extra",
  ],
  politica: ["politica", "política", "beneficio", "bono", "compensacion"],
  procedimiento: ["procedimiento", "check-in", "checkin", "paso", "proceso"],
  manual: ["manual", "bodega", "operacion", "inventario", "conteo"],
  codigo_conducta: ["conducta", "conflicto", "presentacion", "propina"],
  norma: ["uniforme", "vestimenta", "calzado", "presentacion"],
  talento_humano: [
    "desvinculacion",
    "justa causa",
    "rh",
    "talento humano",
    "permiso",
    "paternidad",
  ],
  seguridad: ["sst", "epp", "simulacro", "evacuacion", "seguridad", "casco"],
  otro: [],
};

export function categoryBoost(query: string, category: DocumentCategory | null): number {
  if (!category || category === "otro") return 0;

  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const keywords = CATEGORY_KEYWORDS[category];
  const hits = keywords.filter((keyword) =>
    normalized.includes(
      keyword.normalize("NFD").replace(/\p{Diacritic}/gu, ""),
    ),
  ).length;

  return Math.min(hits * 0.05, 0.15);
}
