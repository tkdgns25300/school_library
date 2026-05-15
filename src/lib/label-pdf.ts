import { PDFDocument, StandardFonts } from "pdf-lib";

import { generateBarcodePng } from "./barcode";

// A4 297mm × 210mm을 PDF point로 환산 (1mm = 2.83465pt).
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 14.17; // 5mm 안전 여백
const COLS = 3;
const ROWS = 8;
const CELL_PADDING = 6;

export type LabelBook = {
  id: string;
};

export async function generateLabelsPdf(
  books: ReadonlyArray<LabelBook>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const usableWidth = A4_WIDTH - MARGIN * 2;
  const usableHeight = A4_HEIGHT - MARGIN * 2;
  const cellWidth = usableWidth / COLS;
  const cellHeight = usableHeight / ROWS;

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let position = 0;

  for (const book of books) {
    if (position >= COLS * ROWS) {
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      position = 0;
    }

    const col = position % COLS;
    const row = Math.floor(position / COLS);
    const cellX = MARGIN + col * cellWidth;
    const cellY = A4_HEIGHT - MARGIN - (row + 1) * cellHeight;

    const pngBytes = await generateBarcodePng(book.id);
    const pngImage = await pdfDoc.embedPng(pngBytes);

    const barcodeWidth = cellWidth - CELL_PADDING * 2;
    const barcodeHeight = cellHeight * 0.55;
    const barcodeX = cellX + CELL_PADDING;
    const barcodeY = cellY + cellHeight - CELL_PADDING - barcodeHeight;

    page.drawImage(pngImage, {
      x: barcodeX,
      y: barcodeY,
      width: barcodeWidth,
      height: barcodeHeight,
    });

    const fontSize = 11;
    const idWidth = font.widthOfTextAtSize(book.id, fontSize);
    page.drawText(book.id, {
      x: cellX + (cellWidth - idWidth) / 2,
      y: cellY + CELL_PADDING + 6,
      size: fontSize,
      font,
    });

    position++;
  }

  return await pdfDoc.save();
}
