import { notificacaoService, getTipoNotificacaoLabel, getTipoNotificacaoColor } from '@/services/notificacaoService'
import { api } from '@/lib/api'

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}))

const mockedApi = api as jest.Mocked<typeof api>

describe('notificacaoService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch notifications with pagination', async () => {
      const mockResponse = {
        data: {
          content: [
            { id: '1', tipo: 'VENCIMENTO_APOLICE', titulo: 'Test', mensagem: 'Test message', lida: false },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      }
      mockedApi.get.mockResolvedValue(mockResponse)

      const result = await notificacaoService.list({ page: 0, size: 10 })

      expect(mockedApi.get).toHaveBeenCalledWith('/notificacoes?page=0&size=10')
      expect(result.content).toHaveLength(1)
    })
  })

  describe('getNaoLidas', () => {
    it('should fetch unread notifications', async () => {
      const mockResponse = {
        data: [
          { id: '1', tipo: 'SINISTRO_ATUALIZADO', titulo: 'Test', lida: false },
        ],
      }
      mockedApi.get.mockResolvedValue(mockResponse)

      const result = await notificacaoService.getNaoLidas()

      expect(mockedApi.get).toHaveBeenCalledWith('/notificacoes/nao-lidas')
      expect(result).toHaveLength(1)
    })
  })

  describe('countNaoLidas', () => {
    it('should return count of unread notifications', async () => {
      mockedApi.get.mockResolvedValue({ data: { count: 5 } })

      const result = await notificacaoService.countNaoLidas()

      expect(mockedApi.get).toHaveBeenCalledWith('/notificacoes/count')
      expect(result).toBe(5)
    })
  })

  describe('marcarComoLida', () => {
    it('should mark notification as read', async () => {
      const notificationId = '123'
      const mockResponse = {
        data: { id: notificationId, lida: true },
      }
      mockedApi.put.mockResolvedValue(mockResponse)

      const result = await notificacaoService.marcarComoLida(notificationId)

      expect(mockedApi.put).toHaveBeenCalledWith(`/notificacoes/${notificationId}/lida`)
      expect(result.lida).toBe(true)
    })
  })

  describe('marcarTodasComoLidas', () => {
    it('should mark all notifications as read', async () => {
      mockedApi.put.mockResolvedValue({})

      await notificacaoService.marcarTodasComoLidas()

      expect(mockedApi.put).toHaveBeenCalledWith('/notificacoes/marcar-todas-lidas')
    })
  })

  describe('delete', () => {
    it('should delete notification', async () => {
      const notificationId = '123'
      mockedApi.delete.mockResolvedValue({})

      await notificacaoService.delete(notificationId)

      expect(mockedApi.delete).toHaveBeenCalledWith(`/notificacoes/${notificationId}`)
    })
  })
})

describe('helper functions', () => {
  describe('getTipoNotificacaoLabel', () => {
    it('should return correct label for VENCIMENTO_APOLICE', () => {
      expect(getTipoNotificacaoLabel('VENCIMENTO_APOLICE')).toBe('Vencimento de Apolice')
    })

    it('should return correct label for VISTORIA_AGENDADA', () => {
      expect(getTipoNotificacaoLabel('VISTORIA_AGENDADA')).toBe('Vistoria Agendada')
    })

    it('should return correct label for SINISTRO_ATUALIZADO', () => {
      expect(getTipoNotificacaoLabel('SINISTRO_ATUALIZADO')).toBe('Sinistro Atualizado')
    })

    it('should return correct label for DOCUMENTO_PROCESSADO', () => {
      expect(getTipoNotificacaoLabel('DOCUMENTO_PROCESSADO')).toBe('Documento Processado')
    })

    it('should return original value for unknown type', () => {
      expect(getTipoNotificacaoLabel('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('getTipoNotificacaoColor', () => {
    it('should return warning for VENCIMENTO_APOLICE', () => {
      expect(getTipoNotificacaoColor('VENCIMENTO_APOLICE')).toBe('warning')
    })

    it('should return info for VISTORIA_AGENDADA', () => {
      expect(getTipoNotificacaoColor('VISTORIA_AGENDADA')).toBe('info')
    })

    it('should return error for SINISTRO_ATUALIZADO', () => {
      expect(getTipoNotificacaoColor('SINISTRO_ATUALIZADO')).toBe('error')
    })

    it('should return success for DOCUMENTO_PROCESSADO', () => {
      expect(getTipoNotificacaoColor('DOCUMENTO_PROCESSADO')).toBe('success')
    })

    it('should return info for unknown type', () => {
      expect(getTipoNotificacaoColor('UNKNOWN')).toBe('info')
    })
  })
})
