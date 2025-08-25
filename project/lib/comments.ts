import { supabase } from './supabase'
import type { Comment } from './supabase'

export class CommentsService {
  // Получение комментариев для манги
  static async getComments(mangaId: string, episodeNumber?: number): Promise<Comment[]> {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:users(username, avatar_url)
        `)
        .eq('manga_id', mangaId)
        .eq('is_moderated', true)
        .order('created_at', { ascending: false })

      if (episodeNumber) {
        query = query.eq('episode_number', episodeNumber)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get comments error:', error)
      throw error
    }
  }

  // Добавление комментария
  static async addComment(
    mangaId: string, 
    content: string, 
    episodeNumber: number = 1
  ): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          manga_id: mangaId,
          episode_number: episodeNumber,
          content: content.trim()
        })
        .select(`
          *,
          user:users(username, avatar_url)
        `)
        .single()

      if (error) throw error

      // Отправляем на модерацию
      await this.moderateComment(data.id, content, user.id, mangaId)

      return data
    } catch (error) {
      console.error('Add comment error:', error)
      throw error
    }
  }

  // Лайк комментария
  static async likeComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('comments')
        .update({ 
          likes: supabase.sql`likes + 1` 
        })
        .eq('id', commentId)

      if (error) throw error
    } catch (error) {
      console.error('Like comment error:', error)
      throw error
    }
  }

  // Модерация комментария
  static async moderateComment(
    commentId: string, 
    content: string, 
    userId: string, 
    mangaId: string
  ): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          content,
          userId,
          mangaId
        })
      })

      if (!response.ok) {
        throw new Error('Moderation failed')
      }

      const result = await response.json()
      console.log('Comment moderated:', result)
    } catch (error) {
      console.error('Comment moderation error:', error)
    }
  }

  // Подписка на real-time обновления комментариев
  static subscribeToComments(
    mangaId: string, 
    episodeNumber: number,
    callback: (comments: Comment[]) => void
  ) {
    const channel = supabase
      .channel(`comments:${mangaId}:${episodeNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `manga_id=eq.${mangaId} and episode_number=eq.${episodeNumber}`
        },
        async () => {
          // Перезагружаем комментарии при изменении
          const comments = await this.getComments(mangaId, episodeNumber)
          callback(comments)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}