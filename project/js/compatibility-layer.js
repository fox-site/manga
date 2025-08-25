// Слой совместимости между старой и новой системой
(function() {
    'use strict';

    class CompatibilityLayer {
        constructor() {
            this.setupCompatibilityFunctions();
        }

        setupCompatibilityFunctions() {
            // Обертки для старых функций
            this.wrapOldFunctions();
            
            // Обработчики событий
            this.setupEventHandlers();
            
            // Автоматическая синхронизация
            this.setupAutoSync();
        }

        wrapOldFunctions() {
            // Сохраняем оригинальные функции
            const originalFunctions = {
                login: window.login,
                logout: window.logout,
                addToFavorites: window.addToFavorites,
                makeDonation: window.makeDonation,
                addComment: window.addComment
            };

            // Заменяем на Supabase версии с fallback
            window.login = async () => {
                try {
                    if (window.supabase && window.EnhancedAuthSystem) {
                        const email = prompt('Email:') || 'demo@example.com';
                        const password = prompt('Пароль:') || '123456';
                        
                        await window.EnhancedAuthSystem.quickLogin(email, password);
                    } else {
                        // Fallback к старой системе
                        if (originalFunctions.login) {
                            originalFunctions.login();
                        }
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    // Fallback при ошибке
                    if (originalFunctions.login) {
                        originalFunctions.login();
                    }
                }
            };

            window.logout = async () => {
                try {
                    if (window.supabase && window.EnhancedAuthSystem) {
                        await window.EnhancedAuthSystem.logout();
                    } else {
                        if (originalFunctions.logout) {
                            originalFunctions.logout();
                        }
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    if (originalFunctions.logout) {
                        originalFunctions.logout();
                    }
                }
            };

            // Обертка для добавления в избранное
            window.addToFavorites = async (mangaId) => {
                try {
                    if (window.supabase) {
                        const { data: { user } } = await window.supabase.auth.getUser();
                        
                        if (!user) {
                            throw new Error('Пользователь не авторизован');
                        }

                        const { error } = await window.supabase
                            .from('user_lists')
                            .upsert({
                                user_id: user.id,
                                manga_id: mangaId,
                                list_type: 'favorites'
                            });

                        if (error) throw error;

                        if (typeof window.showNotification === 'function') {
                            window.showNotification('Добавлено в избранное!', 'success');
                        }
                    } else {
                        // Fallback к localStorage
                        if (originalFunctions.addToFavorites) {
                            originalFunctions.addToFavorites(mangaId);
                        }
                    }
                } catch (error) {
                    console.error('Add to favorites error:', error);
                    if (originalFunctions.addToFavorites) {
                        originalFunctions.addToFavorites(mangaId);
                    }
                }
            };
        }

        setupEventHandlers() {
            // Обработчик для обновления UI при изменении авторизации
            if (window.EnhancedAuthSystem) {
                window.EnhancedAuthSystem.onAuthChange((event, user) => {
                    // Обновляем все элементы UI
                    this.updateAuthUI(event, user);
                });
            }

            // Обработчик для синхронизации данных
            window.addEventListener('storage', (e) => {
                if (e.key === 'isLoggedIn' || e.key === 'currentUser') {
                    this.syncAuthState();
                }
            });
        }

        updateAuthUI(event, user) {
            // Обновляем аватары
            const avatars = document.querySelectorAll('#userAvatar');
            avatars.forEach(avatar => {
                if (user && user.profile) {
                    if (user.profile.avatar_url) {
                        avatar.innerHTML = `<img src="${user.profile.avatar_url}" alt="Аватар" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    } else {
                        const initial = user.profile.username?.charAt(0).toUpperCase() || 'П';
                        avatar.innerHTML = `<span style="font-size: 1.5rem; font-weight: 600;">${initial}</span>`;
                    }
                }
            });

            // Обновляем имена пользователей
            const userNames = document.querySelectorAll('#userName');
            userNames.forEach(nameEl => {
                if (user && user.profile) {
                    nameEl.textContent = user.profile.username || 'Пользователь';
                }
            });

            // Обновляем email
            const userEmails = document.querySelectorAll('#userEmail');
            userEmails.forEach(emailEl => {
                if (user) {
                    emailEl.textContent = user.email || 'user@example.com';
                }
            });
        }

        async syncAuthState() {
            // Синхронизируем состояние между вкладками
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

            if (isLoggedIn && currentUser && !this.currentUser) {
                // Пользователь вошел в другой вкладке
                await this.getCurrentUser();
            } else if (!isLoggedIn && this.currentUser) {
                // Пользователь вышел в другой вкладке
                this.currentUser = null;
            }
        }

        setupAutoSync() {
            // Автоматическая синхронизация каждые 30 секунд
            setInterval(async () => {
                if (window.supabase && this.currentUser) {
                    try {
                        // Проверяем, что сессия еще активна
                        const { data: { user } } = await window.supabase.auth.getUser();
                        if (!user) {
                            this.currentUser = null;
                            this.clearLegacyStorage();
                            if (typeof window.updateAuthState === 'function') {
                                window.updateAuthState();
                            }
                        }
                    } catch (error) {
                        console.error('Auth sync error:', error);
                    }
                }
            }, 30000);
        }

        // Создание демо пользователей
        async createDemoUsers() {
            const demoUsers = [
                { username: 'TestUser1', email: 'test1@example.com', password: '123456' },
                { username: 'TestUser2', email: 'test2@example.com', password: '123456' },
                { username: 'DemoUser', email: 'demo@example.com', password: '123456' }
            ];

            for (const user of demoUsers) {
                try {
                    await this.quickRegister(user.username, user.email, user.password);
                    console.log(`👤 Демо пользователь создан: ${user.email}`);
                } catch (error) {
                    // Игнорируем ошибки если пользователь уже существует
                    if (!error.message.includes('already registered')) {
                        console.error('Demo user creation error:', error);
                    }
                }
            }
        }
    }

    // Ждем инициализации Supabase
    function waitForSupabase() {
        if (window.supabase) {
            window.CompatibilityLayer = new CompatibilityLayer();
            
            // Создаем демо пользователей
            setTimeout(() => {
                window.CompatibilityLayer.createDemoUsers();
            }, 3000);
            
            console.log('🔗 Compatibility Layer загружена');
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }

    waitForSupabase();

})();