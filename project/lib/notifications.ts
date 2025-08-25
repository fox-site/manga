import { supabase } from './supabase'
import type { Notification, MangaSubscription } from './supabase'

export class NotificationsService {
  // Подписка на уведомления о манге
  static async subscribeToManga(mangaId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('manga_subscriptions')
        .insert({
          user_id: user.id,
          manga_id: mangaId
        })

      if (error) {
        // Если уже подписан, игнорируем ошибку
        if (error.code === '23505') {
          console.log('Already subscribed')
          return
        }
        throw error
      }

      console.log(`🔔 Subscribed to manga ${mangaId}`)
    } catch (error) {
      console.error('Subscribe to manga error:', error)
      throw error
    }
  }

  // Отписка от уведомлений
  static async unsubscribeFromManga(mangaId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('manga_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)

      if (error) throw error

      console.log(`🔕 Unsubscribed from manga ${mangaId}`)
    } catch (error) {
      console.error('Unsubscribe from manga error:', error)
      throw error
    }
  }

  // Проверка подписки на мангу
  static async isSubscribedToManga(mangaId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data, error } = await supabase
        .from('manga_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .single()

      if (error) return false

      return !!data
    } catch (error) {
      console.error('Check subscription error:', error)
      return false
    }
  }

  // Получение уведомлений пользователя
  static async getUserNotifications(): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          manga:manga(title, cover_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get user notifications error:', error)
      return []
    }
  }

  // Отметка уведомления как прочитанное
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Mark as read error:', error)
      throw error
    }
  }

  // Отметка всех как прочитанные
  static async markAllAsRead(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('Mark all as read error:', error)
      throw error
    }
  }

  // Получение количества непрочитанных
  static async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error('Get unread count error:', error)
      return 0
    }
  }

  // Подписка на real-time уведомления
  static subscribeToNotifications(callback: (notification: Notification) => void) {
    const { data: { user } } = supabase.auth.getUser()
    
    if (!user) return () => {}

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}