// Замена системы авторизации на Supabase Auth
(function() {
    'use strict';

    class SupabaseAuthSystem {
        constructor() {
            this.currentUser = null;
            this.initializeAuth();
        }

        async initializeAuth() {
            if (!window.supabase) {
                console.error('❌ Supabase не инициализирован');
                return;
            }

            // Слушаем изменения авторизации
            window.supabase.auth.onAuthStateChange((event, session) => {
                this.handleAuthChange(event, session);
            });

            // Получаем текущего пользователя
            await this.getCurrentUser();
        }

        // Обработка изменений авторизации
        async handleAuthChange(event, session) {
            if (event === 'SIGNED_IN' && session) {
                await this.loadUserProfile(session.user);
                this.updateLegacyStorage();
                
                // Уведомляем страницы об изменении
                if (typeof window.updateAuthState === 'function') {
                    window.updateAuthState();
                }
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.clearLegacyStorage();
                
                if (typeof window.updateAuthState === 'function') {
                    window.updateAuthState();
                }
            }
        }

        // Загрузка профиля пользователя
        async loadUserProfile(user) {
            try {
                const { data: profile, error } = await window.supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Profile load error:', error);
                    // Создаем профиль если его нет
                    await this.createUserProfile(user);
                    return;
                }

                this.currentUser = { ...user, profile };
            } catch (error) {
                console.error('Load user profile error:', error);
            }
        }

        // Создание профиля пользователя
        async createUserProfile(user) {
            try {
                const { data, error } = await window.supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        username: user.user_metadata?.username || 'Пользователь'
                    })
                    .select()
                    .single();

                if (error) throw error;

                this.currentUser = { ...user, profile: data };
            } catch (error) {
                console.error('Create user profile error:', error);
            }
        }

        // Получение текущего пользователя
        async getCurrentUser() {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (user) {
                    await this.loadUserProfile(user);
                }
            } catch (error) {
                console.error('Get current user error:', error);
            }
        }

        // Регистрация
        async register(email, password, username) {
            try {
                const { data, error } = await window.supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username
                        }
                    }
                });

                if (error) throw error;

                return data;
            } catch (error) {
                console.error('Registration error:', error);
                throw error;
            }
        }

        // Вход
        async login(email, password) {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                return data;
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        }

        // Выход
        async logout() {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) throw error;
            } catch (error) {
                console.error('Logout error:', error);
                throw error;
            }
        }

        // Обновление профиля
        async updateProfile(updates) {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) throw new Error('User not authenticated');

                const { data, error } = await window.supabase
                    .from('users')
                    .update(updates)
                    .eq('id', user.id)
                    .select()
                    .single();

                if (error) throw error;

                // Обновляем локальные данные
                if (this.currentUser) {
                    this.currentUser.profile = data;
                }

                this.updateLegacyStorage();
                return data;
            } catch (error) {
                console.error('Update profile error:', error);
                throw error;
            }
        }

        // Загрузка аватара
        async uploadAvatar(file) {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) throw new Error('User not authenticated');

                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await window.supabase.storage
                    .from('avatars')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = window.supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                // Обновляем профиль с новым аватаром
                await this.updateProfile({ avatar_url: data.publicUrl });

                return data.publicUrl;
            } catch (error) {
                console.error('Avatar upload error:', error);
                throw error;
            }
        }

        // Проверка авторизации
        isAuthenticated() {
            return !!this.currentUser;
        }

        // Получение пользователя
        getUser() {
            return this.currentUser;
        }

        // Обновление совместимости со старой системой
        updateLegacyStorage() {
            if (this.currentUser) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify({
                    id: this.currentUser.id,
                    name: this.currentUser.profile?.username || 'Пользователь',
                    username: this.currentUser.profile?.username || 'Пользователь',
                    email: this.currentUser.email
                }));
            }
        }

        // Очистка совместимости
        clearLegacyStorage() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
        }
    }

    // Ждем инициализации Supabase
    function waitForSupabase() {
        if (window.supabase) {
            window.SupabaseAuthSystem = new SupabaseAuthSystem();
            console.log('🔐 Supabase Auth System загружена');
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }

    waitForSupabase();

})();