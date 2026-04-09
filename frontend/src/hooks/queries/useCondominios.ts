import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { condominioService, PaginationParams } from '@/services/condominioService'
import {
  CondominioListResponse,
  CondominioResponse,
  CreateCondominioRequest,
  UpdateCondominioRequest,
  CondominioFilter,
  Page,
} from '@/types'

export const condominioKeys = {
  all: ['condominios'] as const,
  lists: () => [...condominioKeys.all, 'list'] as const,
  list: (filter?: CondominioFilter, pagination?: PaginationParams) =>
    [...condominioKeys.lists(), { filter, pagination }] as const,
  details: () => [...condominioKeys.all, 'detail'] as const,
  detail: (id: string) => [...condominioKeys.details(), id] as const,
}

export function useCondominios(filter?: CondominioFilter, pagination?: PaginationParams, enabled: boolean = true) {
  return useQuery<Page<CondominioListResponse>>({
    queryKey: condominioKeys.list(filter, pagination),
    queryFn: () => condominioService.list(filter, pagination),
    enabled,
  })
}

export function useCondominio(id: string) {
  return useQuery<CondominioResponse>({
    queryKey: condominioKeys.detail(id),
    queryFn: () => condominioService.getById(id),
    enabled: !!id,
  })
}

export function useCreateCondominio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCondominioRequest) => condominioService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condominioKeys.lists() })
    },
  })
}

export function useUpdateCondominio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCondominioRequest }) =>
      condominioService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: condominioKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: condominioKeys.lists() })
    },
  })
}

export function useDeleteCondominio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => condominioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: condominioKeys.lists() })
    },
  })
}
