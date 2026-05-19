export type CsvColumn = {
  csv: string;
  label: string;
  required: boolean;
  example: string;
  hint?: string;
  choices?: ReadonlyArray<string>;
};

const UTF8_BOM = "﻿";

export function downloadCsvTemplate(
  filename: string,
  columns: ReadonlyArray<CsvColumn>,
): void {
  const header = columns.map((c) => c.csv).join(",");
  const example = columns.map((c) => c.example).join(",");
  const content = `${UTF8_BOM}${header}\n${example}\n`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  triggerDownload(filename, blob);
}

export async function downloadXlsxTemplate(
  filename: string,
  columns: ReadonlyArray<CsvColumn>,
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Template");

  sheet.addRow(columns.map((c) => c.csv));
  sheet.addRow(columns.map((c) => c.example));

  sheet.getRow(1).font = { bold: true };
  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = Math.max(
      c.csv.length + 2,
      c.example.length + 2,
      c.label.length * 2,
      14,
    );
  });

  const sheetWithValidations = sheet as unknown as {
    dataValidations: {
      add: (range: string, validation: Record<string, unknown>) => void;
    };
  };
  columns.forEach((c, i) => {
    if (!c.choices || c.choices.length === 0) return;
    const colLetter = columnLetter(i + 1);
    const range = `${colLetter}2:${colLetter}1000`;
    sheetWithValidations.dataValidations.add(range, {
      type: "list",
      allowBlank: !c.required,
      formulae: [`"${c.choices.join(",")}"`],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "유효하지 않은 값",
      error: `다음 중 하나를 선택하세요: ${c.choices.join(", ")}`,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(filename, blob);
}

export async function xlsxToCsv(file: File): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return "";

  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const rowData: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      const text =
        value == null
          ? ""
          : typeof value === "object" && "text" in value
            ? String((value as { text: unknown }).text ?? "")
            : String(value);
      rowData.push(text.trim());
    });
    rows.push(rowData);
  });

  return rows
    .map((row) =>
      row
        .map((cell) =>
          /[",\n]/.test(cell)
            ? `"${cell.replace(/"/g, '""')}"`
            : cell,
        )
        .join(","),
    )
    .join("\n");
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function columnLetter(index: number): string {
  let n = index;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
