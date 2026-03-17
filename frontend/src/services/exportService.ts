import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportColumn {
  header: string
  key: string
  width?: number
}

export interface ExportOptions {
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  filename: string
}

export const exportService = {
  /**
   * Export data to PDF
   */
  exportToPDF(options: ExportOptions): void {
    const { title, subtitle, columns, data, filename } = options

    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.setTextColor(59, 130, 246) // Blue
    doc.text(title, 14, 22)

    // Subtitle
    if (subtitle) {
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(subtitle, 14, 30)
    }

    // Date
    doc.setFontSize(10)
    doc.setTextColor(128)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, subtitle ? 38 : 30)

    // Table
    const tableHeaders = columns.map((col) => col.header)
    const tableData = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key]
        if (value === null || value === undefined) return '-'
        if (typeof value === 'number') {
          return value.toLocaleString('pt-BR')
        }
        return String(value)
      })
    )

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: subtitle ? 45 : 37,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128)
      doc.text(
        `CondoCompare - Pagina ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }

    doc.save(`${filename}.pdf`)
  },

  /**
   * Export data to Excel
   */
  exportToExcel(options: ExportOptions): void {
    const { title, columns, data, filename } = options

    // Prepare data with headers
    const headers = columns.map((col) => col.header)
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key]
        if (value === null || value === undefined) return ''
        return value
      })
    )

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([
      [title],
      [],
      headers,
      ...rows,
    ])

    // Style title row
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }]

    // Set column widths
    ws['!cols'] = columns.map((col) => ({ wch: col.width || 15 }))

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio')

    // Save
    XLSX.writeFile(wb, `${filename}.xlsx`)
  },

  /**
   * Export data to CSV
   */
  exportToCSV(options: ExportOptions): void {
    const { columns, data, filename } = options

    // Headers
    const headers = columns.map((col) => col.header).join(';')

    // Rows
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = row[col.key]
          if (value === null || value === undefined) return ''
          // Escape quotes and wrap in quotes if contains special chars
          const str = String(value)
          if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(';')
    )

    // Create CSV content
    const csvContent = [headers, ...rows].join('\n')

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
  },
}

export default exportService
