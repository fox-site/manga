// Улучшенная система авторизации с Supabase
(function() {
    'use strict';

    class EnhancedAuthSystem {
        constructor() {
            this.currentUser = null;
            this.authListeners = [];
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

        async handleAuthChange(event, session) {
            console.log('🔐 Auth state changed:', event);

            if (event === 'SIGNED_IN' && session) {
                await this.loadUserProfile(session.user);
                this.updateLegacyStorage();
                this.notifyAuthListeners('login', this.currentUser);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.clearLegacyStorage();
                this.notifyAuthListeners('logout', null);
            }

            // Обновляем UI на всех страницах
            if (typeof window.updateAuthState === 'function') {
                window.updateAuthState();
            }
        }

        async loadUserProfile(user) {
            try {
                const { data: profile, error } = await window.supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    // Создаем профиль если его нет
                    await this.createUserProfile(user);
                    return;
                }

                this.currentUser = { ...user, profile };
            } catch (error) {
                console.error('Load user profile error:', error);
            }
        }

        async createUserProfile(user) {
            try {
                const { data, error } = await window.supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        username: user.user_metadata?.username || user.email.split('@')[0] || 'Пользователь'
                    })
                    .select()
                    .single();

                if (error) throw error;

                this.currentUser = { ...user, profile: data };
                console.log('✅ Профиль пользователя создан');
            } catch (error) {
                console.error('Create user profile error:', error);
            }
        }

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

        // Быстрая регистрация (для демо)
        async quickRegister(username, email, password) {
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

                console.log('✅ Пользователь зарегистрирован:', email);
                return data;
            } catch (error) {
                console.error('Registration error:', error);
                throw error;
            }
        }

        // Быстрый вход (для демо)
        async quickLogin(email, password) {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                console.log('✅ Пользователь вошел:', email);
                return data;
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        }

        async logout() {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) throw error;

                console.log('👋 Пользователь вышел');
            } catch (error) {
                console.error('Logout error:', error);
                throw error;
            }
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

        clearLegacyStorage() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
        }

        // Подписка на изменения авторизации
        onAuthChange(callback) {
            this.authListeners.push(callback);
        }

        notifyAuthListeners(event, user) {
            this.authListeners.forEach(callback => {
                try {
                    callback(event, user);
                } catch (error) {
                    console.error('Auth listener error:', error);
                }
            });
        }

        // Проверка авторизации
        isAuthenticated() {
            return !!this.currentUser;
        }

        getUser() {
            return this.currentUser;
        }

        // Создание демо админа
        async createDemoAdmin() {
            try {
                const { data, error } = await this.quickRegister(
                    'Admin',
                    'admin@lightfox.com',
                    'admin123'
                );

                if (error) throw error;

                // Делаем пользователя админом
                const { error: updateError } = await window.supabase
                    .from('users')
                    .update({ is_admin: true })
                    .eq('id', data.user.id);

                if (updateError) throw updateError;

                console.log('👑 Демо админ создан: admin@lightfox.com / admin123');
            } catch (error) {
                console.error('Create demo admin error:', error);
            }
        }
    }

    // Ждем инициализации Supabase
    function waitForSupabase() {
        if (window.supabase) {
            window.EnhancedAuthSystem = new EnhancedAuthSystem();
            
            // Создаем демо админа при первом запуске
            setTimeout(() => {
                window.EnhancedAuthSystem.createDemoAdmin();
            }, 2000);
            
            console.log('🔐 Enhanced Auth System загружена');
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }

    waitForSupabase();

})();