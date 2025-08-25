// Интеграция всех систем с Supabase
(function() {
    'use strict';

    class SupabaseIntegration {
        constructor() {
            this.isSupabaseReady = false;
            this.fallbackMode = false;
            this.initializeIntegration();
        }

        async initializeIntegration() {
            try {
                // Ждем инициализации Supabase
                await this.waitForSupabase();
                
                // Проверяем геоблокировку
                const isBlocked = await this.checkGeoRestriction();
                if (isBlocked) return;

                // Мигрируем данные из localStorage
                await this.migrateLocalStorageData();
                
                // Заменяем старые функции на Supabase
                this.replaceOldFunctions();
                
                // Инициализируем real-time подписки
                this.setupRealTimeSubscriptions();
                
                this.isSupabaseReady = true;
                console.log('✅ Supabase интеграция завершена');
                
            } catch (error) {
                console.error('❌ Supabase недоступен, используем fallback:', error);
                this.enableFallbackMode();
            }
        }

        async waitForSupabase() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;
                
                const check = () => {
                    if (window.supabase) {
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Supabase не инициализирован'));
                    } else {
                        attempts++;
                        setTimeout(check, 100);
                    }
                };
                
                check();
            });
        }

        async checkGeoRestriction() {
            try {
                const response = await fetch(`${window.SUPABASE_URL}/functions/v1/geo-restriction`, {
                    headers: {
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                    },
                });

                const result = await response.json();
                
                if (result.blocked) {
                    this.showGeoBlockPage(result);
                    return true;
                }

                return false;
            } catch (error) {
                console.error('Geo-restriction check failed:', error);
                return false;
            }
        }

        showGeoBlockPage(result) {
            document.body.innerHTML = `
                <div style="
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="max-width: 600px;">
                        <div style="font-size: 6rem; margin-bottom: 2rem;">🚫</div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #ff6b6b, #ee5a24); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Access Restricted
                        </h1>
                        <div style="font-size: 1.4rem; margin-bottom: 2rem; opacity: 0.9; line-height: 1.6;">
                            ${result.message}
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 2rem;">
                            <p style="font-size: 1rem; opacity: 0.8; margin: 0;">
                                🌍 Country: <strong>${result.country}</strong><br>
                                🕒 Time: ${new Date(result.timestamp).toLocaleString()}<br>
                                🛡️ Reason: Geographic restrictions
                            </p>
                        </div>
                        <div style="font-size: 0.9rem; opacity: 0.6;">
                            This content is not available in your region due to licensing restrictions.
                        </div>
                    </div>
                </div>
            `;
        }

        async migrateLocalStorageData() {
            try {
                console.log('🔄 Миграция данных из localStorage...');
                
                // Проверяем авторизацию
                const { data: { user } } = await window.supabase.auth.getUser();
                if (!user) return;

                // Мигрируем избранное
                const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                if (favorites.length > 0) {
                    await this.migrateFavorites(favorites, user.id);
                }

                // Мигрируем историю просмотров
                const watching = JSON.parse(localStorage.getItem('watching') || '[]');
                if (watching.length > 0) {
                    await this.migrateWatching(watching, user.id);
                }

                // Мигрируем рейтинги
                const ratings = JSON.parse(localStorage.getItem('user_ratings') || '{}');
                if (Object.keys(ratings).length > 0) {
                    await this.migrateRatings(ratings, user.id);
                }

                console.log('✅ Миграция данных завершена');
            } catch (error) {
                console.error('Ошибка миграции:', error);
            }
        }

        async migrateFavorites(favorites, userId) {
            const userLists = favorites.map(fav => ({
                user_id: userId,
                manga_id: fav.mangaId,
                list_type: 'favorites',
                current_episode: 1
            }));

            const { error } = await window.supabase
                .from('user_lists')
                .upsert(userLists);

            if (error) throw error;
        }

        async migrateWatching(watching, userId) {
            const userLists = watching.map(item => ({
                user_id: userId,
                manga_id: item.mangaId,
                list_type: 'watching',
                current_episode: item.currentEpisode || 1
            }));

            const { error } = await window.supabase
                .from('user_lists')
                .upsert(userLists);

            if (error) throw error;
        }

        async migrateRatings(ratings, userId) {
            const userRatings = Object.entries(ratings)
                .filter(([key]) => key.startsWith(`${userId}_`))
                .map(([key, rating]) => ({
                    user_id: userId,
                    manga_id: key.replace(`${userId}_`, ''),
                    rating: rating
                }));

            if (userRatings.length > 0) {
                const { error } = await window.supabase
                    .from('ratings')
                    .upsert(userRatings);

                if (error) throw error;
            }
        }

        replaceOldFunctions() {
            // Заменяем MangaAPI на Supabase версию
            if (window.SupabaseMangaAPI) {
                window.MangaAPI = {
                    getAllManga: () => window.SupabaseMangaAPI.getAllManga(),
                    getMangaById: (id) => window.SupabaseMangaAPI.getMangaById(id),
                    addManga: (manga) => window.SupabaseMangaAPI.addManga(manga),
                    updateManga: (id, updates) => window.SupabaseMangaAPI.updateManga(id, updates),
                    deleteManga: (id) => window.SupabaseMangaAPI.deleteManga(id),
                    getGenres: () => window.SupabaseMangaAPI.getGenres(),
                    getCategories: () => window.SupabaseMangaAPI.getCategories(),
                    getStatuses: () => window.SupabaseMangaAPI.getStatuses(),
                    filterManga: (filters) => window.SupabaseMangaAPI.filterManga(filters),
                    getStats: () => window.SupabaseMangaAPI.getStats()
                };
            }

            // Заменяем функции авторизации
            if (window.SupabaseAuthSystem) {
                window.login = async () => {
                    try {
                        const email = prompt('Email:') || 'demo@example.com';
                        const password = prompt('Пароль:') || '123456';
                        
                        await window.SupabaseAuthSystem.login(email, password);
                        
                        if (typeof window.updateAuthState === 'function') {
                            window.updateAuthState();
                        }
                    } catch (error) {
                        alert('Ошибка входа: ' + error.message);
                    }
                };

                window.logout = async () => {
                    if (confirm('Выйти из аккаунта?')) {
                        await window.SupabaseAuthSystem.logout();
                        
                        if (typeof window.updateAuthState === 'function') {
                            window.updateAuthState();
                        }
                    }
                };
            }
        }

        setupRealTimeSubscriptions() {
            if (!window.supabase) return;

            // Подписка на изменения манги
            window.supabase
                .channel('manga_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'manga' },
                    () => {
                        // Обновляем каталог при изменениях
                        if (typeof window.renderMangaGrid === 'function') {
                            window.renderMangaGrid();
                        }
                    }
                )
                .subscribe();

            // Подписка на новые уведомления
            const { data: { user } } = window.supabase.auth.getUser();
            if (user) {
                window.supabase
                    .channel(`notifications_${user.id}`)
                    .on('postgres_changes',
                        { 
                            event: 'INSERT', 
                            schema: 'public', 
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`
                        },
                        (payload) => {
                            // Показываем новое уведомление
                            if (typeof window.showNotification === 'function') {
                                window.showNotification(payload.new.message, 'info');
                            }
                        }
                    )
                    .subscribe();
            }
        }

        enableFallbackMode() {
            this.fallbackMode = true;
            console.log('🔄 Включен fallback режим (localStorage)');
            
            // Показываем предупреждение
            if (typeof window.showNotification === 'function') {
                window.showNotification('Работаем в автономном режиме', 'warning');
            }
        }

        // Проверка готовности
        isReady() {
            return this.isSupabaseReady;
        }

        isFallback() {
            return this.fallbackMode;
        }
    }

    // Создаем глобальный экземпляр
    window.SupabaseIntegration = new SupabaseIntegration();

    console.log('🔗 Supabase Integration загружена');

})();