// Замена MangaAPI на Supabase
(function() {
    'use strict';

    class SupabaseMangaAPI {
        constructor() {
            this.cache = new Map();
            this.cacheTimeout = 5 * 60 * 1000; // 5 минут
        }

        // Получение всей манги
        async getAllManga() {
            try {
                const cacheKey = 'all_manga';
                const cached = this.getFromCache(cacheKey);
                if (cached) return cached;

                const { data, error } = await window.supabase
                    .from('manga')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const result = data || [];
                this.setCache(cacheKey, result);
                return result;
            } catch (error) {
                console.error('Get all manga error:', error);
                return this.getFallbackData();
            }
        }

        // Получение манги по ID
        async getMangaById(id) {
            try {
                const cacheKey = `manga_${id}`;
                const cached = this.getFromCache(cacheKey);
                if (cached) return cached;

                const { data, error } = await window.supabase
                    .from('manga')
                    .select('*')
                    .eq('id', id)
                    .eq('is_active', true)
                    .single();

                if (error) throw error;

                this.setCache(cacheKey, data);
                return data;
            } catch (error) {
                console.error('Get manga by ID error:', error);
                return this.getFallbackManga(id);
            }
        }

        // Добавление новой манги (только админы)
        async addManga(manga) {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) throw new Error('User not authenticated');

                const { data, error } = await window.supabase
                    .from('manga')
                    .insert(manga)
                    .select()
                    .single();

                if (error) throw error;

                this.clearCache();
                return data;
            } catch (error) {
                console.error('Add manga error:', error);
                throw error;
            }
        }

        // Обновление манги
        async updateManga(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('manga')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                this.clearCache();
                return data;
            } catch (error) {
                console.error('Update manga error:', error);
                throw error;
            }
        }

        // Удаление манги (мягкое удаление)
        async deleteManga(id) {
            try {
                const { error } = await window.supabase
                    .from('manga')
                    .update({ is_active: false })
                    .eq('id', id);

                if (error) throw error;

                this.clearCache();
                return true;
            } catch (error) {
                console.error('Delete manga error:', error);
                throw error;
            }
        }

        // Получение жанров
        async getGenres() {
            try {
                const cacheKey = 'genres';
                const cached = this.getFromCache(cacheKey);
                if (cached) return cached;

                const { data, error } = await window.supabase
                    .from('manga')
                    .select('genres')
                    .eq('is_active', true);

                if (error) throw error;

                const allGenres = new Set();
                data?.forEach(manga => {
                    manga.genres?.forEach(genre => allGenres.add(genre));
                });

                const result = Array.from(allGenres).sort();
                this.setCache(cacheKey, result);
                return result;
            } catch (error) {
                console.error('Get genres error:', error);
                return ['Экшен', 'Драма', 'Комедия', 'Романтика', 'Фэнтези'];
            }
        }

        // Получение категорий
        async getCategories() {
            try {
                const cacheKey = 'categories';
                const cached = this.getFromCache(cacheKey);
                if (cached) return cached;

                const { data, error } = await window.supabase
                    .from('manga')
                    .select('categories')
                    .eq('is_active', true);

                if (error) throw error;

                const allCategories = new Set();
                data?.forEach(manga => {
                    manga.categories?.forEach(category => allCategories.add(category));
                });

                const result = Array.from(allCategories).sort();
                this.setCache(cacheKey, result);
                return result;
            } catch (error) {
                console.error('Get categories error:', error);
                return ['Сёнен', 'Сэйнэн', 'Сёдзё', 'Дзёсэй'];
            }
        }

        // Получение статусов
        async getStatuses() {
            return ['Выходит', 'Завершён', 'Заморожен', 'Анонс'];
        }

        // Фильтрация манги
        async filterManga(filters = {}) {
            try {
                let query = window.supabase
                    .from('manga')
                    .select('*')
                    .eq('is_active', true);

                // Поиск по названию
                if (filters.search) {
                    query = query.ilike('title', `%${filters.search}%`);
                }

                // Фильтр по жанрам
                if (filters.genres && filters.genres.length > 0) {
                    query = query.overlaps('genres', filters.genres);
                }

                // Фильтр по категориям
                if (filters.categories && filters.categories.length > 0) {
                    query = query.overlaps('categories', filters.categories);
                }

                // Фильтр по статусам
                if (filters.statuses && filters.statuses.length > 0) {
                    query = query.in('status', filters.statuses);
                }

                // Сортировка
                switch (filters.sortBy) {
                    case 'alphabet':
                        query = query.order('title', { ascending: true });
                        break;
                    case 'rating':
                        query = query.order('rating', { ascending: false });
                        break;
                    case 'updated':
                        query = query.order('updated_at', { ascending: false });
                        break;
                    case 'popularity':
                    default:
                        query = query.order('current_donations', { ascending: false });
                        break;
                }

                const { data, error } = await query;

                if (error) throw error;

                return data || [];
            } catch (error) {
                console.error('Filter manga error:', error);
                return this.getFallbackData();
            }
        }

        // Получение серий манги
        async getEpisodes(mangaId) {
            try {
                const { data, error } = await window.supabase
                    .from('episodes')
                    .select('*')
                    .eq('manga_id', mangaId)
                    .eq('is_available', true)
                    .order('episode_number', { ascending: true });

                if (error) throw error;

                return data || [];
            } catch (error) {
                console.error('Get episodes error:', error);
                return [];
            }
        }

        // Кэширование
        getFromCache(key) {
            const cached = this.cache.get(key);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                return cached.data;
            }
            return null;
        }

        setCache(key, data) {
            this.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
        }

        clearCache() {
            this.cache.clear();
        }

        // Fallback данные если Supabase недоступен
        getFallbackData() {
            const fallback = localStorage.getItem('lightfox_manga_data');
            if (fallback) {
                try {
                    return JSON.parse(fallback);
                } catch (e) {
                    return [];
                }
            }
            return [];
        }

        getFallbackManga(id) {
            const allManga = this.getFallbackData();
            return allManga.find(manga => manga.id === id) || null;
        }

        // Статистика
        async getStats() {
            try {
                const { data: mangaStats, error: mangaError } = await window.supabase
                    .from('manga')
                    .select('id, available_episodes, current_donations')
                    .eq('is_active', true);

                if (mangaError) throw mangaError;

                const { data: userStats, error: userError } = await window.supabase
                    .from('users')
                    .select('id');

                if (userError) throw userError;

                const totalManga = mangaStats?.length || 0;
                const totalEpisodes = mangaStats?.reduce((sum, manga) => sum + (manga.available_episodes || 0), 0) || 0;
                const totalDonations = mangaStats?.reduce((sum, manga) => sum + (manga.current_donations || 0), 0) || 0;
                const totalUsers = userStats?.length || 0;

                return {
                    totalManga,
                    totalEpisodes,
                    totalDonations,
                    totalUsers
                };
            } catch (error) {
                console.error('Get stats error:', error);
                return {
                    totalManga: 0,
                    totalEpisodes: 0,
                    totalDonations: 0,
                    totalUsers: 0
                };
            }
        }
    }

    // Создаем глобальный экземпляр
    window.SupabaseMangaAPI = new SupabaseMangaAPI();

    // Заменяем старый MangaAPI на новый
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
        getStats: () => window.SupabaseMangaAPI.getStats(),
        getEpisodes: (mangaId) => window.SupabaseMangaAPI.getEpisodes(mangaId)
    };

    console.log('🗄️ Supabase Manga API загружен');

})();