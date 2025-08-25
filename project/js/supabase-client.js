// Supabase клиент для замены localStorage
(function() {
    'use strict';

    // Проверяем геоблокировку при загрузке
    async function checkGeoRestriction() {
        try {
            const response = await fetch(`${window.SUPABASE_URL}/functions/v1/geo-restriction`, {
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                },
            });

            const result = await response.json();
            
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
                `;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Geo-restriction check error:', error);
            return false;
        }
    }

    // Инициализация Supabase клиента
    class SupabaseClient {
        constructor() {
            this.supabase = null;
            this.currentUser = null;
            this.initializeClient();
        }

        async initializeClient() {
            // Проверяем геоблокировку
            const isBlocked = await checkGeoRestriction();
            if (isBlocked) return;

            // Инициализируем Supabase
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
                this.supabase = window.supabase.createClient(
                    window.SUPABASE_URL,
                    window.SUPABASE_ANON_KEY
                );

                // Слушаем изменения авторизации
                this.supabase.auth.onAuthStateChange((event, session) => {
                    this.handleAuthChange(event, session);
                });

                // Получаем текущего пользователя
                await this.getCurrentUser();
                
                console.log('🚀 Supabase клиент инициализирован');
            } else {
                console.error('❌ Supabase переменные окружения не найдены');
                this.fallbackToLocalStorage();
            }
        }

        // Обработка изменений авторизации
        handleAuthChange(event, session) {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.updateLegacyStorage(session.user);
                console.log('✅ Пользователь вошел:', session.user.email);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.clearLegacyStorage();
                console.log('👋 Пользователь вышел');
            }

            // Уведомляем другие системы
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { event, session, user: this.currentUser }
            }));
        }

        // Получение текущего пользователя
        async getCurrentUser() {
            try {
                const { data: { user } } = await this.supabase.auth.getUser();
                
                if (user) {
                    // Получаем профиль из базы данных
                    const { data: profile } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    this.currentUser = { ...user, profile };
                    this.updateLegacyStorage(user, profile);
                }
            } catch (error) {
                console.error('Get current user error:', error);
            }
        }

        // Обновление совместимости со старой системой
        updateLegacyStorage(user, profile = null) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: profile?.username || user.user_metadata?.username || 'Пользователь',
                username: profile?.username || user.user_metadata?.username || 'Пользователь',
                email: user.email
            }));
        }

        // Очистка совместимости
        clearLegacyStorage() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
        }

        // Fallback к localStorage если Supabase недоступен
        fallbackToLocalStorage() {
            console.log('🔄 Fallback к localStorage');
            // Здесь можно оставить старую логику как резерв
        }
    }

    // Создаем глобальный экземпляр
    window.SupabaseClient = new SupabaseClient();

    console.log('🗄️ Supabase клиент загружен');

})();