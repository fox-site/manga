import { supabase } from './supabase'
import type { User } from './supabase'

export class AuthService {
  // Регистрация пользователя
  static async register(email: string, password: string, username: string) {
    try {
      // Регистрируем в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Создаем профиль пользователя
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            username: username
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Не бросаем ошибку, так как пользователь уже создан в Auth
        }
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Вход пользователя
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Выход пользователя
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  // Получение текущего пользователя
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Обновление профиля
  static async updateProfile(updates: Partial<User>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  // Загрузка аватара
  static async uploadAvatar(file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Обновляем профиль с новым аватаром
      await this.updateProfile({ avatar_url: data.publicUrl })

      return data.publicUrl
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw error
    }
  }

  // Проверка геоблокировки
  static async checkGeoRestriction(): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geo-restriction`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      })

      const result = await response.json()
      
      if (result.blocked) {
        // Показываем сообщение о блокировке
        document.body.innerHTML = `
          <div style="
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1a1a;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 20px;
          ">
            <div style="max-width: 500px;">
              <div style="font-size: 4rem; margin-bottom: 2rem;">🚫</div>
              <h1 style="font-size: 2rem; margin-bottom: 1rem;">Access Restricted</h1>
              <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.8;">
                ${result.message}
              </p>
              <p style="font-size: 0.9rem; opacity: 0.6;">
                Country: ${result.country} | Time: ${new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        `
        return true
      }

      return false
    } catch (error) {
      console.error('Geo-restriction check error:', error)
      return false
    }
  }
}