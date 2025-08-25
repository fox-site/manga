import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для TypeScript
export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  bio?: string
  subscription_tier: 'free' | 'basic' | 'premium' | 'vip'
  subscription_expires_at?: string
  total_donations: number
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Manga {
  id: string
  title: string
  description: string
  cover_url?: string
  type: 'Аниме' | 'Манга' | 'Маньхуа' | 'Манхва'
  status: 'Выходит' | 'Завершён' | 'Заморожен' | 'Анонс'
  year: number
  rating: number
  rating_count: number
  genres: string[]
  categories: string[]
  available_episodes: number
  total_episodes: number
  current_donations: number
  donation_goal: number
  subscription_tier: 'free' | 'basic' | 'premium' | 'vip'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Episode {
  id: string
  manga_id: string
  episode_number: number
  title: string
  video_url?: string
  duration: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  user_id: string
  manga_id: string
  episode_number: number
  content: string
  likes: number
  is_moderated: boolean
  created_at: string
  updated_at: string
  user?: {
    username: string
    avatar_url?: string
  }
}

export interface Rating {
  id: string
  user_id: string
  manga_id: string
  rating: number
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  user_id: string
  manga_id: string
  amount: number
  currency: string
  payment_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  manga_id?: string
  type: 'new_episode' | 'system' | 'donation' | 'subscription'
  title: string
  message: string
  episode_number?: number
  is_read: boolean
  created_at: string
}

export interface MangaSubscription {
  id: string
  user_id: string
  manga_id: string
  created_at: string
}

export interface UserList {
  id: string
  user_id: string
  manga_id: string
  list_type: 'favorites' | 'watching' | 'want_to_watch' | 'completed'
  current_episode: number
  created_at: string
  updated_at: string
}