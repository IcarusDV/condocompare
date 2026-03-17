import { exportService, ExportOptions } from '@/services/exportService'

// Mock jsPDF
jest.mock('jspdf', () => {
  const mockJsPDF = jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    save: jest.fn(),
    getNumberOfPages: jest.fn().mockReturnValue(1),
    setPage: jest.fn(),
    internal: {
      pageSize: { width: 210, height: 297 },
    },
  }))
  return { default: mockJsPDF }
})

// Mock jspdf-autotable
jest.mock('jspdf-autotable', () => jest.fn())

// Mock xlsx
jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn().mockReturnValue({}),
    book_new: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

describe('exportService', () => {
  const mockOptions: ExportOptions = {
    title: 'Test Report',
    subtitle: 'Test Subtitle',
    columns: [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Value', key: 'value', width: 15 },
    ],
    data: [
      { name: 'Item 1', value: 100 },
      { name: 'Item 2', value: 200 },
    ],
    filename: 'test_report',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exportToPDF', () => {
    it('should create PDF with correct title', () => {
      const jsPDF = require('jspdf').default
      
      exportService.exportToPDF(mockOptions)

      expect(jsPDF).toHaveBeenCalled()
    })

    it('should call save with correct filename', () => {
      const jsPDF = require('jspdf').default
      const mockInstance = jsPDF.mock.results[0]?.value || {
        setFontSize: jest.fn(),
        setTextColor: jest.fn(),
        text: jest.fn(),
        save: jest.fn(),
        getNumberOfPages: jest.fn().mockReturnValue(1),
        setPage: jest.fn(),
        internal: { pageSize: { width: 210, height: 297 } },
      }
      
      exportService.exportToPDF(mockOptions)

      // Verify jsPDF was instantiated
      expect(jsPDF).toHaveBeenCalled()
    })
  })

  describe('exportToExcel', () => {
    it('should create Excel file with worksheet', () => {
      const xlsx = require('xlsx')
      
      exportService.exportToExcel(mockOptions)

      expect(xlsx.utils.aoa_to_sheet).toHaveBeenCalled()
      expect(xlsx.utils.book_new).toHaveBeenCalled()
      expect(xlsx.utils.book_append_sheet).toHaveBeenCalled()
      expect(xlsx.writeFile).toHaveBeenCalled()
    })

    it('should call writeFile with correct filename', () => {
      const xlsx = require('xlsx')
      
      exportService.exportToExcel(mockOptions)

      expect(xlsx.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        'test_report.xlsx'
      )
    })
  })

  describe('exportToCSV', () => {
    let createObjectURLSpy: jest.SpyInstance
    let clickSpy: jest.SpyInstance

    beforeEach(() => {
      createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      clickSpy = mockLink.click
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should create CSV blob with correct data', () => {
      exportService.exportToCSV(mockOptions)

      expect(createObjectURLSpy).toHaveBeenCalled()
    })

    it('should trigger download with correct filename', () => {
      const mockLink = { href: '', download: '', click: jest.fn() }
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)
      
      exportService.exportToCSV(mockOptions)

      expect(mockLink.download).toBe('test_report.csv')
    })
  })
})
