import { api } from '@/lib/api'
import {
  UserResponse,
  UserListResponse,
  UserFilter,
  CreateUserRequest,
  UpdateUserRequest,
  Role,
  Page,
} from '@/types'

const BASE_URL = '/users'

export interface UserPaginationParams {
  page?: number
  size?: number
  sort?: string
}

export const userService = {
  async list(
    filter?: UserFilter,
    pagination?: UserPaginationParams
  ): Promise<Page<UserListResponse>> {
    const params = new URLSearchParams()

    if (pagination?.page !== undefined) params.append('page', String(pagination.page))
    if (pagination?.size !== undefined) params.append('size', String(pagination.size))
    if (pagination?.sort) params.append('sort', pagination.sort)

    if (filter?.search) params.append('search', filter.search)
    if (filter?.role) params.append('role', filter.role)
    if (filter?.emailVerified !== undefined) params.append('emailVerified', String(filter.emailVerified))
    if (filter?.active !== undefined) params.append('active', String(filter.active))

    const response = await api.get<Page<UserListResponse>>(
      `${BASE_URL}?${params.toString()}`
    )
    return response.data
  },

  async getById(id: string): Promise<UserResponse> {
    const response = await api.get<UserResponse>(`${BASE_URL}/${id}`)
    return response.data
  },

  async create(data: CreateUserRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>(BASE_URL, data)
    return response.data
  },

  async update(id: string, data: UpdateUserRequest): Promise<UserResponse> {
    const response = await api.put<UserResponse>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`)
  },

  async activate(id: string): Promise<UserResponse> {
    const response = await api.post<UserResponse>(`${BASE_URL}/${id}/activate`)
    return response.data
  },

  async listByRole(role: Role): Promise<UserListResponse[]> {
    const response = await api.get<UserListResponse[]>(`${BASE_URL}/role/${role}`)
    return response.data
  },
}

export const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    ADMIN: 'Administrador',
    CORRETORA: 'Corretora',
    ADMINISTRADORA: 'Administradora',
    SINDICO: 'Sindico',
  }
  return labels[role] || role
}

export const getRoleColor = (role: Role): 'primary' | 'secondary' | 'success' | 'warning' => {
  const colors: Record<Role, 'primary' | 'secondary' | 'success' | 'warning'> = {
    ADMIN: 'primary',
    CORRETORA: 'secondary',
    ADMINISTRADORA: 'success',
    SINDICO: 'warning',
  }
  return colors[role] || 'primary'
}
