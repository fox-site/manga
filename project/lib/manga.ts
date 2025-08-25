import { supabase } from './supabase'
import type { Manga, Episode } from './supabase'

export class MangaService {
  // Получение всей манги
  static async getAllManga(): Promise<Manga[]> {
    try {
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get all manga error:', error)
      throw error
    }
  }

  // Получение манги по ID
  static async getMangaById(id: string): Promise<Manga | null> {
    try {
      const { data, error } = await supabase
        .from('manga')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Get manga by ID error:', error)
      return null
    }
  }

  // Добавление новой манги (только админы)
  static async addManga(manga: Partial<Manga>): Promise<Manga> {
    try {
      const { data, error } = await supabase
        .from('manga')
        .insert(manga)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Add manga error:', error)
      throw error
    }
  }

  // Обновление манги
  static async updateManga(id: string, updates: Partial<Manga>): Promise<Manga> {
    try {
      const { data, error } = await supabase
        .from('manga')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Update manga error:', error)
      throw error
    }
  }

  // Удаление манги (мягкое удаление)
  static async deleteManga(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('manga')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete manga error:', error)
      throw error
    }
  }

  // Получение серий манги
  static async getEpisodes(mangaId: string): Promise<Episode[]> {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('manga_id', mangaId)
        .eq('is_available', true)
        .order('episode_number', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get episodes error:', error)
      throw error
    }
  }

  // Добавление серии
  static async addEpisode(episode: Partial<Episode>): Promise<Episode> {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .insert(episode)
        .select()
        .single()

      if (error) throw error

      // Отправляем уведомления подписчикам
      if (episode.manga_id && episode.episode_number) {
        await this.notifySubscribers(episode.manga_id, episode.episode_number, episode.title)
      }

      return data
    } catch (error) {
      console.error('Add episode error:', error)
      throw error
    }
  }

  // Фильтрация манги
  static async filterManga(filters: {
    search?: string
    genres?: string[]
    categories?: string[]
    statuses?: string[]
    sortBy?: string
    limit?: number
    offset?: number
  }): Promise<Manga[]> {
    try {
      let query = supabase
        .from('manga')
        .select('*')
        .eq('is_active', true)

      // Поиск по названию
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      // Фильтр по жанрам
      if (filters.genres && filters.genres.length > 0) {
        query = query.overlaps('genres', filters.genres)
      }

      // Фильтр по категориям
      if (filters.categories && filters.categories.length > 0) {
        query = query.overlaps('categories', filters.categories)
      }

      // Фильтр по статусам
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
      }

      // Сортировка
      switch (filters.sortBy) {
        case 'alphabet':
          query = query.order('title', { ascending: true })
          break
        case 'rating':
          query = query.order('rating', { ascending: false })
          break
        case 'updated':
          query = query.order('updated_at', { ascending: false })
          break
        case 'popularity':
        default:
          query = query.order('current_donations', { ascending: false })
          break
      }

      // Пагинация
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Filter manga error:', error)
      throw error
    }
  }

  // Загрузка обложки манги
  static async uploadCover(file: File, mangaId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${mangaId}-${Date.now()}.${fileExt}`
      const filePath = `covers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('manga-covers')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('manga-covers')
        .getPublicUrl(filePath)

      // Обновляем мангу с новой обложкой
      await this.updateManga(mangaId, { cover_url: data.publicUrl })

      return data.publicUrl
    } catch (error) {
      console.error('Cover upload error:', error)
      throw error
    }
  }

  // Уведомление подписчиков о новой серии
  static async notifySubscribers(mangaId: string, episodeNumber: number, episodeTitle?: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mangaId,
          episodeNumber,
          episodeTitle
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send notifications')
      }

      const result = await response.json()
      console.log('Notifications sent:', result)
    } catch (error) {
      console.error('Notify subscribers error:', error)
    }
  }

  // Получение уникальных жанров
  static async getGenres(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('manga')
        .select('genres')
        .eq('is_active', true)

      if (error) throw error

      const allGenres = new Set<string>()
      data?.forEach(manga => {
        manga.genres?.forEach((genre: string) => allGenres.add(genre))
      })

      return Array.from(allGenres).sort()
    } catch (error) {
      console.error('Get genres error:', error)
      return []
    }
  }

  // Получение уникальных категорий
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('manga')
        .select('categories')
        .eq('is_active', true)

      if (error) throw error

      const allCategories = new Set<string>()
      data?.forEach(manga => {
        manga.categories?.forEach((category: string) => allCategories.add(category))
      })

      return Array.from(allCategories).sort()
    } catch (error) {
      console.error('Get categories error:', error)
      return []
    }
  }

  // Получение статистики
  static async getStats() {
    try {
      const { data: mangaStats, error: mangaError } = await supabase
        .from('manga')
        .select('id, available_episodes, current_donations')
        .eq('is_active', true)

      if (mangaError) throw mangaError

      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('id')

      if (userError) throw userError

      const totalManga = mangaStats?.length || 0
      const totalEpisodes = mangaStats?.reduce((sum, manga) => sum + (manga.available_episodes || 0), 0) || 0
      const totalDonations = mangaStats?.reduce((sum, manga) => sum + (manga.current_donations || 0), 0) || 0
      const totalUsers = userStats?.length || 0

      return {
        totalManga,
        totalEpisodes,
        totalDonations,
        totalUsers
      }
    } catch (error) {
      console.error('Get stats error:', error)
      return {
        totalManga: 0,
        totalEpisodes: 0,
        totalDonations: 0,
        totalUsers: 0
      }
    }
  }
}