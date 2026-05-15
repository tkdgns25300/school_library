import type { LabelBook } from "./label-pdf";

export async function downloadLabelsPdf(
  books: ReadonlyArray<LabelBook>,
): Promise<void> {
  const { generateLabelsPdf } = await import("./label-pdf");
  const pdfBytes = await generateLabelsPdf(books);

  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `labels-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
