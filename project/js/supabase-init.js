// Инициализация Supabase клиента
(function() {
    'use strict';

    // Конфигурация Supabase (будет заменена на реальные значения)
    const SUPABASE_CONFIG = {
        url: 'https://xvwzqkxqkxqkxqkx.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3pxa3hxa3hxa3hxa3giLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjA2NzI2MCwiZXhwIjoxOTYxNjQzMjYwfQ.demo-key-replace-with-real'
    };

    // Проверяем переменные окружения
    function getSupabaseConfig() {
        // В продакшене эти значения будут из переменных окружения
        const url = window.VITE_SUPABASE_URL || SUPABASE_CONFIG.url;
        const anonKey = window.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;

        return { url, anonKey };
    }

    // Инициализация Supabase
    async function initializeSupabase() {
        try {
            const config = getSupabaseConfig();

            if (!config.url || !config.anonKey || config.url.includes('your-project')) {
                console.warn('⚠️ Supabase не настроен. Нажмите "Connect to Supabase" для настройки');
                initializeFallback();
                return;
            }

            // Загружаем Supabase SDK
            if (!window.supabase) {
                await loadSupabaseSDK();
            }

            // Создаем клиент
            window.supabase = window.supabase.createClient(config.url, config.anonKey);
            window.SUPABASE_URL = config.url;
            window.SUPABASE_ANON_KEY = config.anonKey;

            // Проверяем соединение
            const { error } = await window.supabase.auth.getSession();

            if (error) {
                console.warn('⚠️ Supabase auth not ready:', error);
                initializeFallback();
                return;
            }

            console.log('✅ Supabase успешно подключен');
            
            // Уведомляем о готовности
            window.dispatchEvent(new CustomEvent('supabaseReady', {
                detail: { client: window.supabase }
            }));

        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            initializeFallback();
        }
    }

    // Загрузка Supabase SDK
    async function loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                console.log('📦 Supabase SDK загружен');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Не удалось загрузить Supabase SDK');
                reject(new Error('Failed to load Supabase SDK'));
            };
            document.head.appendChild(script);
        });
    }

    // Fallback к localStorage
    function initializeFallback() {
        console.log('🔄 Используется fallback к localStorage');
        
        // Создаем заглушки для совместимости
        window.supabase = {
            auth: {
                getUser: () => Promise.resolve({ data: { user: null } }),
                signUp: () => Promise.reject(new Error('Supabase not available')),
                signInWithPassword: () => Promise.reject(new Error('Supabase not available')),
                signOut: () => Promise.resolve(),
                onAuthStateChange: () => ({ data: { subscription: null } })
            },
            from: () => ({
                select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
                insert: () => Promise.resolve({ data: null, error: null }),
                update: () => Promise.resolve({ data: null, error: null }),
                delete: () => Promise.resolve({ error: null })
            }),
            storage: {
                from: () => ({
                    upload: () => Promise.resolve({ error: null }),
                    getPublicUrl: () => ({ data: { publicUrl: '' } })
                })
            }
        };

        // Уведомляем о fallback режиме
        window.dispatchEvent(new CustomEvent('supabaseFallback', {
            detail: { reason: 'Configuration missing or connection failed' }
        }));
    }

    // Автоинициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSupabase);
    } else {
        initializeSupabase();
    }

    console.log('🚀 Supabase инициализация запущена...');

})();