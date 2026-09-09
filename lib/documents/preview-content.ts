import { readFileSync } from "node:fs";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { extractTextFromBuffer } from "@/lib/documents/extract-text";
import {
  getFileExtension,
  viewModeForExtension,
  type DocumentViewMode,
} from "@/lib/documents/file-types";

export type { DocumentViewMode } from "@/lib/documents/file-types";

export type SpreadsheetSheetPreview = {
  name: string;
  html: string;
};

export type DocumentPreviewPayload = {
  viewMode: DocumentViewMode;
  content: string;
  htmlContent?: string;
  sheets?: SpreadsheetSheetPreview[];
};

async function docxToHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  return result.value ?? "";
}

function spreadsheetToSheets(buffer: Buffer): SpreadsheetSheetPreview[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    return {
      name,
      html: XLSX.utils.sheet_to_html(sheet, { id: `sheet-${name}` }),
    };
  });
}

export async function buildDocumentPreviewFromBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<DocumentPreviewPayload> {
  const ext = getFileExtension(fileName);
  const viewMode = viewModeForExtension(ext);
  const content = await extractTextFromBuffer(buffer, fileName);

  if (viewMode === "html") {
    const htmlContent = await docxToHtml(buffer);
    return { viewMode, content, htmlContent };
  }

  if (viewMode === "spreadsheet") {
    const sheets = spreadsheetToSheets(buffer);
    return { viewMode, content, sheets };
  }

  return { viewMode, content };
}

export async function buildDocumentPreviewFromFile(
  filePath: string,
): Promise<DocumentPreviewPayload> {
  const buffer = readFileSync(filePath);
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  return buildDocumentPreviewFromBuffer(buffer, fileName);
}
