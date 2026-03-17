/**
 * Generic CSV export utility for CondoCompare.
 *
 * Features:
 *  - Proper CSV escaping (commas, quotes, newlines)
 *  - pt-BR date formatting
 *  - BOM prefix for correct encoding in Excel
 *  - Blob + anchor-based download
 */

export interface CsvColumn {
  key: string
  label: string
}

/**
 * Format a value that looks like an ISO date string to pt-BR locale.
 * Returns the original value unchanged when it is not a recognisable date.
 */
function formatDateValue(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '')
  // Match ISO-like patterns: "2024-03-16", "2024-03-16T14:30:00"
  if (/^\d{4}-\d{2}-\d{2}(T|\s)/.test(value)) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
  }
  return value
}

/**
 * Escape a single CSV cell value.
 * Uses semicolon (;) as separator, which is the Brazilian/European convention
 * and avoids problems when commas appear inside monetary values.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = formatDateValue(value)
  // Wrap in double-quotes when the value contains the separator, quotes, or newlines
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Export an array of records to a CSV file and trigger a browser download.
 *
 * @param data    - Array of objects to export
 * @param filename - Desired file name (without .csv extension)
 * @param columns  - Column definitions (key = property path, label = header)
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  filename: string,
  columns: CsvColumn[],
): void {
  if (!data.length) return

  // Build header row
  const headerRow = columns.map((col) => escapeCsvCell(col.label)).join(';')

  // Build data rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key]
        return escapeCsvCell(value)
      })
      .join(';'),
  )

  const csvContent = [headerRow, ...dataRows].join('\n')

  // BOM (\uFEFF) ensures Excel opens the file with correct UTF-8 encoding
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
