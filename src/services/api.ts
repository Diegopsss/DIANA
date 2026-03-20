import { supabase } from '../utils/supabase'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types'

export class ApiService {
  // Método genérico para obtener datos
  static async get<T>(table: string, id?: string): Promise<ApiResponse<T | T[]>> {
    try {
      if (id) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return { data: data as T }
      } else {
        const { data, error } = await supabase
          .from(table)
          .select('*')

        if (error) throw error
        return { data: data as T[] }
      }
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Método para obtener datos con paginación
  static async getPaginated<T>(
    table: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    try {
      const { page, limit } = params
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .range(from, to)

      if (error) throw error

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
    }
  }

  // Método para crear datos
  static async create<T>(table: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()

      if (error) throw error

      return { data: result }
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Método para actualizar datos
  static async update<T>(table: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data: result }
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Método para eliminar datos
  static async delete(table: string, id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)

      if (error) throw error

      return { data: true }
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
