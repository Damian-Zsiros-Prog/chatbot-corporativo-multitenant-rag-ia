import { readFileSync } from "node:fs";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { getFileExtension } from "@/lib/documents/file-types";

async function extractPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

function extractSpreadsheet(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    return `# Hoja: ${sheetName}\n${rows}`;
  }).join("\n\n");
}

function extractPlainText(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const ext = getFileExtension(fileName);

  let text = "";
  switch (ext) {
    case ".pdf":
      text = await extractPdf(buffer);
      break;
    case ".docx":
      text = await extractDocx(buffer);
      break;
    case ".xlsx":
    case ".xls":
      text = extractSpreadsheet(buffer);
      break;
    case ".md":
    case ".txt":
      text = extractPlainText(buffer);
      break;
    default:
      throw new Error(`Formato no soportado: ${ext || fileName}`);
  }

  return text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
}

export async function extractTextFromFile(filePath: string): Promise<string> {
  const buffer = readFileSync(filePath);
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  return extractTextFromBuffer(buffer, fileName);
}
