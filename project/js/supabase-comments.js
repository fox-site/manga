// Система комментариев на Supabase
(function() {
    'use strict';

    class SupabaseCommentsSystem {
        constructor() {
            this.subscriptions = new Map();
        }

        // Получение комментариев
        async getComments(mangaId, episodeNumber = 1) {
            try {
                const { data, error } = await window.supabase
                    .from('comments')
                    .select(`
                        *,
                        user:users(username, avatar_url)
                    `)
                    .eq('manga_id', mangaId)
                    .eq('episode_number', episodeNumber)
                    .eq('is_moderated', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return data || [];
            } catch (error) {
                console.error('Get comments error:', error);
                return this.getFallbackComments(mangaId);
            }
        }

        // Добавление комментария
        async addComment(mangaId, content, episodeNumber = 1) {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) throw new Error('User not authenticated');

                if (!content.trim()) {
                    throw new Error('Comment cannot be empty');
                }

                const { data, error } = await window.supabase
                    .from('comments')
                    .insert({
                        user_id: user.id,
                        manga_id: mangaId,
                        episode_number: episodeNumber,
                        content: content.trim()
                    })
                    .select(`
                        *,
                        user:users(username, avatar_url)
                    `)
                    .single();

                if (error) throw error;

                // Отправляем на модерацию
                await this.moderateComment(data.id, content, user.id, mangaId);

                return data;
            } catch (error) {
                console.error('Add comment error:', error);
                throw error;
            }
        }

        // Лайк комментария
        async likeComment(commentId) {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) throw new Error('User not authenticated');

                const { error } = await window.supabase.rpc('increment_comment_likes', {
                    comment_id: commentId
                });

                if (error) throw error;

                console.log(`👍 Liked comment: ${commentId}`);
            } catch (error) {
                console.error('Like comment error:', error);
                throw error;
            }
        }

        // Модерация комментария
        async moderateComment(commentId, content, userId, mangaId) {
            try {
                const response = await fetch(`${window.SUPABASE_URL}/functions/v1/moderate-comments`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        commentId,
                        content,
                        userId,
                        mangaId
                    })
                });

                if (!response.ok) {
                    throw new Error('Moderation failed');
                }

                const result = await response.json();
                console.log('Comment moderated:', result);
            } catch (error) {
                console.error('Comment moderation error:', error);
            }
        }

        // Подписка на real-time обновления
        subscribeToComments(mangaId, episodeNumber, callback) {
            const channelName = `comments:${mangaId}:${episodeNumber}`;
            
            if (this.subscriptions.has(channelName)) {
                this.unsubscribeFromComments(mangaId, episodeNumber);
            }

            const channel = window.supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'comments',
                        filter: `manga_id=eq.${mangaId} and episode_number=eq.${episodeNumber}`
                    },
                    async () => {
                        // Перезагружаем комментарии при изменении
                        const comments = await this.getComments(mangaId, episodeNumber);
                        callback(comments);
                    }
                )
                .subscribe();

            this.subscriptions.set(channelName, channel);

            return () => this.unsubscribeFromComments(mangaId, episodeNumber);
        }

        // Отписка от обновлений
        unsubscribeFromComments(mangaId, episodeNumber) {
            const channelName = `comments:${mangaId}:${episodeNumber}`;
            const channel = this.subscriptions.get(channelName);
            
            if (channel) {
                window.supabase.removeChannel(channel);
                this.subscriptions.delete(channelName);
            }
        }

        // Fallback комментарии
        getFallbackComments(mangaId) {
            const fallback = localStorage.getItem(`comments_${mangaId}`);
            if (fallback) {
                try {
                    return JSON.parse(fallback);
                } catch (e) {
                    return [];
                }
            }
            return [];
        }
    }

    // Ждем инициализации Supabase
    function waitForSupabase() {
        if (window.supabase) {
            window.SupabaseCommentsSystem = new SupabaseCommentsSystem();
            console.log('💬 Supabase Comments System загружена');
        } else {
            setTimeout(waitForSupabase, 100);
        }
    }

    waitForSupabase();

})();