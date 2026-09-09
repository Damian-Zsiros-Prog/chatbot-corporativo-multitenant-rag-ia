export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".md",
  ".txt",
  ".pdf",
  ".docx",
  ".xlsx",
  ".xls",
] as const;

export type AllowedDocumentExtension =
  (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number];

const EXTENSION_MIME: Record<AllowedDocumentExtension, string> = {
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
};

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "";
  return fileName.slice(dot).toLowerCase();
}

export function isAllowedDocumentFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ALLOWED_DOCUMENT_EXTENSIONS.includes(
    ext as AllowedDocumentExtension,
  );
}

export function mimeTypeForFileName(fileName: string): string {
  const ext = getFileExtension(fileName) as AllowedDocumentExtension;
  return EXTENSION_MIME[ext] ?? "application/octet-stream";
}

export function viewModeForMime(mimeType: string): "iframe" | "text" | "html" {
  if (mimeType === "application/pdf") return "iframe";
  if (mimeType === "text/markdown" || mimeType === "text/plain") return "text";
  return "text";
}

export const ACCEPT_UPLOAD =
  ".md,.txt,.pdf,.docx,.xlsx,.xls,text/markdown,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
