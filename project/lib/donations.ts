import { supabase } from './supabase'
import type { Donation } from './supabase'

export class DonationsService {
  // Создание доната
  static async createDonation(
    mangaId: string, 
    amount: number, 
    currency: string = 'RUB'
  ): Promise<{ paymentUrl: string, donationId: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      if (amount < 10) {
        throw new Error('Minimum donation amount is 10 RUB')
      }

      if (amount > 50000) {
        throw new Error('Maximum donation amount is 50,000 RUB')
      }

      // Создаем платежное намерение
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment/create-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'donation',
          amount,
          currency,
          mangaId,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const result = await response.json()
      
      return {
        paymentUrl: `/payment?intent=${result.paymentIntent.id}`,
        donationId: result.donationId
      }
    } catch (error) {
      console.error('Create donation error:', error)
      throw error
    }
  }

  // Получение истории донатов пользователя
  static async getDonationHistory(): Promise<Donation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          manga:manga(title, cover_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get donation history error:', error)
      return []
    }
  }

  // Получение топ доноров
  static async getTopDonors(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, total_donations')
        .gt('total_donations', 0)
        .order('total_donations', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get top donors error:', error)
      return []
    }
  }

  // Обновление прогресса доната (вызывается webhook)
  static async updateDonationProgress(donationId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status })
        .eq('id', donationId)

      if (error) throw error

      console.log(`💰 Donation ${donationId} updated to ${status}`)
    } catch (error) {
      console.error('Update donation progress error:', error)
      throw error
    }
  }
}