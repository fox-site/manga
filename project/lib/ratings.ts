import { supabase } from './supabase'
import type { Rating } from './supabase'

export class RatingsService {
  // Получение рейтинга пользователя для манги
  static async getUserRating(mangaId: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return 0

      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .single()

      if (error) return 0

      return data?.rating || 0
    } catch (error) {
      console.error('Get user rating error:', error)
      return 0
    }
  }

  // Установка рейтинга
  static async setRating(mangaId: string, rating: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      if (rating < 1 || rating > 10) {
        throw new Error('Rating must be between 1 and 10')
      }

      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          manga_id: mangaId,
          rating: rating
        })

      if (error) throw error

      console.log(`⭐ Rating set: ${rating}/10 for manga ${mangaId}`)
    } catch (error) {
      console.error('Set rating error:', error)
      throw error
    }
  }

  // Получение всех рейтингов пользователя
  static async getUserRatings(): Promise<Rating[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get user ratings error:', error)
      return []
    }
  }

  // Создание интерактивного рейтинга (HTML)
  static createStarRating(mangaId: string, currentRating: number = 0, userRating: number = 0): string {
    let starsHTML = ''
    
    for (let i = 1; i <= 10; i++) {
      const isFilled = i <= userRating
      const isHalf = !isFilled && i <= currentRating && (currentRating % 1) >= 0.5
      
      starsHTML += `
        <span class="star ${isFilled ? 'filled' : ''} ${isHalf ? 'half' : ''}" 
              data-rating="${i}" 
              onclick="RatingsService.setRating('${mangaId}', ${i})">
          ⭐
        </span>
      `
    }

    return `
      <div class="star-rating interactive" data-manga-id="${mangaId}">
        ${starsHTML}
        <span class="rating-text">
          ${userRating > 0 ? `Ваша оценка: ${userRating}` : 'Оцените тайтл'}
          ${currentRating > 0 ? ` | Общий: ${currentRating}` : ''}
        </span>
      </div>
    `
  }
}