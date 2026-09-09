import {
  getFileExtension,
  viewModeForExtension,
  viewModeForMime,
  type DocumentViewMode,
} from "@/lib/documents/file-types";

export function resolveDocumentViewMode(
  viewMode: DocumentViewMode,
  fileName?: string | null,
  mimeType?: string | null,
): DocumentViewMode {
  if (viewMode === "markdown" || viewMode === "iframe" || viewMode === "html" || viewMode === "spreadsheet") {
    return viewMode;
  }

  if (fileName) {
    const fromName = viewModeForExtension(getFileExtension(fileName));
    if (fromName !== "text") return fromName;
  }

  if (mimeType) {
    const fromMime = viewModeForMime(mimeType);
    if (fromMime !== "text") return fromMime;
  }

  return viewMode;
}
