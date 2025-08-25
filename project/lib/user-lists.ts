import { supabase } from './supabase'
import type { UserList, Manga } from './supabase'

export class UserListsService {
  // Добавление в список пользователя
  static async addToList(
    mangaId: string, 
    listType: 'favorites' | 'watching' | 'want_to_watch' | 'completed',
    currentEpisode: number = 1
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_lists')
        .upsert({
          user_id: user.id,
          manga_id: mangaId,
          list_type: listType,
          current_episode: currentEpisode
        })

      if (error) throw error

      console.log(`📚 Added to ${listType}: ${mangaId}`)
    } catch (error) {
      console.error('Add to list error:', error)
      throw error
    }
  }

  // Удаление из списка
  static async removeFromList(
    mangaId: string, 
    listType: 'favorites' | 'watching' | 'want_to_watch' | 'completed'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .eq('list_type', listType)

      if (error) throw error

      console.log(`🗑️ Removed from ${listType}: ${mangaId}`)
    } catch (error) {
      console.error('Remove from list error:', error)
      throw error
    }
  }

  // Получение списка пользователя
  static async getUserList(
    listType: 'favorites' | 'watching' | 'want_to_watch' | 'completed'
  ): Promise<(UserList & { manga: Manga })[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      const { data, error } = await supabase
        .from('user_lists')
        .select(`
          *,
          manga:manga(*)
        `)
        .eq('user_id', user.id)
        .eq('list_type', listType)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get user list error:', error)
      return []
    }
  }

  // Получение всех списков пользователя
  static async getAllUserLists(): Promise<{
    favorites: (UserList & { manga: Manga })[]
    watching: (UserList & { manga: Manga })[]
    want_to_watch: (UserList & { manga: Manga })[]
    completed: (UserList & { manga: Manga })[]
  }> {
    try {
      const [favorites, watching, wantToWatch, completed] = await Promise.all([
        this.getUserList('favorites'),
        this.getUserList('watching'),
        this.getUserList('want_to_watch'),
        this.getUserList('completed')
      ])

      return {
        favorites,
        watching,
        want_to_watch: wantToWatch,
        completed
      }
    } catch (error) {
      console.error('Get all user lists error:', error)
      return {
        favorites: [],
        watching: [],
        want_to_watch: [],
        completed: []
      }
    }
  }

  // Обновление текущей серии
  static async updateCurrentEpisode(mangaId: string, episodeNumber: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_lists')
        .update({ current_episode: episodeNumber })
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .eq('list_type', 'watching')

      if (error) throw error

      console.log(`📺 Updated current episode: ${episodeNumber} for manga ${mangaId}`)
    } catch (error) {
      console.error('Update current episode error:', error)
      throw error
    }
  }

  // Проверка, есть ли манга в списке
  static async isInList(
    mangaId: string, 
    listType: 'favorites' | 'watching' | 'want_to_watch' | 'completed'
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data, error } = await supabase
        .from('user_lists')
        .select('id')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .eq('list_type', listType)
        .single()

      if (error) return false

      return !!data
    } catch (error) {
      console.error('Check list error:', error)
      return false
    }
  }
}