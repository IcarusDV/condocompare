import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sinistroService, SinistroFilter, PaginationParams } from '@/services/sinistroService'
import {
  SinistroResponse,
  SinistroListResponse,
  SinistroStatsResponse,
  CreateSinistroRequest,
  UpdateSinistroRequest,
  Page,
} from '@/types'

export const sinistroKeys = {
  all: ['sinistros'] as const,
  lists: () => [...sinistroKeys.all, 'list'] as const,
  list: (filter?: SinistroFilter, pagination?: PaginationParams) =>
    [...sinistroKeys.lists(), { filter, pagination }] as const,
  details: () => [...sinistroKeys.all, 'detail'] as const,
  detail: (id: string) => [...sinistroKeys.details(), id] as const,
  stats: () => [...sinistroKeys.all, 'stats'] as const,
}

export function useSinistros(filter?: SinistroFilter, pagination?: PaginationParams) {
  return useQuery<Page<SinistroListResponse>>({
    queryKey: sinistroKeys.list(filter, pagination),
    queryFn: () => sinistroService.list(filter, pagination),
  })
}

export function useSinistro(id: string) {
  return useQuery<SinistroResponse>({
    queryKey: sinistroKeys.detail(id),
    queryFn: () => sinistroService.getById(id),
    enabled: !!id,
  })
}

export function useCreateSinistro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSinistroRequest) => sinistroService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sinistroKeys.lists() })
    },
  })
}

export function useUpdateSinistro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSinistroRequest }) =>
      sinistroService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: sinistroKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: sinistroKeys.lists() })
    },
  })
}

export function useDeleteSinistro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sinistroService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sinistroKeys.lists() })
    },
  })
}

export function useSinistroStats() {
  return useQuery<SinistroStatsResponse>({
    queryKey: sinistroKeys.stats(),
    queryFn: () => sinistroService.getStats(),
  })
}

export function useAddSinistroHistorico() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, descricao }: { id: string; descricao: string }) =>
      sinistroService.addHistorico(id, descricao),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: sinistroKeys.detail(id) })
    },
  })
}
