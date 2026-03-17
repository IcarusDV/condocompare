import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vistoriaService, VistoriaFilter, PaginationParams } from '@/services/vistoriaService'
import {
  VistoriaResponse,
  VistoriaListResponse,
  CreateVistoriaRequest,
  UpdateVistoriaRequest,
  VistoriaItem,
  VistoriaFoto,
  Page,
} from '@/types'

export const vistoriaKeys = {
  all: ['vistorias'] as const,
  lists: () => [...vistoriaKeys.all, 'list'] as const,
  list: (filter?: VistoriaFilter, pagination?: PaginationParams) =>
    [...vistoriaKeys.lists(), { filter, pagination }] as const,
  details: () => [...vistoriaKeys.all, 'detail'] as const,
  detail: (id: string) => [...vistoriaKeys.details(), id] as const,
  itens: (vistoriaId: string) => [...vistoriaKeys.all, 'itens', vistoriaId] as const,
  fotos: (vistoriaId: string) => [...vistoriaKeys.all, 'fotos', vistoriaId] as const,
}

export function useVistorias(filter?: VistoriaFilter, pagination?: PaginationParams) {
  return useQuery<Page<VistoriaListResponse>>({
    queryKey: vistoriaKeys.list(filter, pagination),
    queryFn: () => vistoriaService.list(filter, pagination),
  })
}

export function useVistoria(id: string) {
  return useQuery<VistoriaResponse>({
    queryKey: vistoriaKeys.detail(id),
    queryFn: () => vistoriaService.getById(id),
    enabled: !!id,
  })
}

export function useVistoriaItens(vistoriaId: string) {
  return useQuery<VistoriaItem[]>({
    queryKey: vistoriaKeys.itens(vistoriaId),
    queryFn: () => vistoriaService.getItens(vistoriaId),
    enabled: !!vistoriaId,
  })
}

export function useVistoriaFotos(vistoriaId: string) {
  return useQuery<VistoriaFoto[]>({
    queryKey: vistoriaKeys.fotos(vistoriaId),
    queryFn: () => vistoriaService.getFotos(vistoriaId),
    enabled: !!vistoriaId,
  })
}

export function useCreateVistoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVistoriaRequest) => vistoriaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vistoriaKeys.lists() })
    },
  })
}

export function useUpdateVistoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVistoriaRequest }) =>
      vistoriaService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: vistoriaKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: vistoriaKeys.lists() })
    },
  })
}

export function useDeleteVistoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vistoriaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vistoriaKeys.lists() })
    },
  })
}

export function useUpdateVistoriaItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vistoriaId, itemId, data }: { vistoriaId: string; itemId: string; data: Partial<VistoriaItem> }) =>
      vistoriaService.updateItem(vistoriaId, itemId, data),
    onSuccess: (_, { vistoriaId }) => {
      queryClient.invalidateQueries({ queryKey: vistoriaKeys.itens(vistoriaId) })
      queryClient.invalidateQueries({ queryKey: vistoriaKeys.detail(vistoriaId) })
    },
  })
}

export function useAddVistoriaFoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vistoriaId, foto }: { vistoriaId: string; foto: Partial<VistoriaFoto> }) =>
      vistoriaService.addFoto(vistoriaId, foto),
    onSuccess: (_, { vistoriaId }) => {
      queryClient.invalidateQueries({ queryKey: vistoriaKeys.fotos(vistoriaId) })
    },
  })
}
