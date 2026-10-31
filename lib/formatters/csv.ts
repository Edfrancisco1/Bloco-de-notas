/** CSV (RFC 4180) com BOM UTF-8, para abrir bem no Excel sem perder acentos. */
export type CsvCell = string | number | boolean | null | undefined;

function escape(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header, ...rows].map((row) => row.map(escape).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}
