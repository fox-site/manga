// Система уведомлений для Light Fox Manga
(function() {
    'use strict';

    class NotificationSystem {
        constructor() {
            this.notifications = this.loadNotifications();
            this.subscriptions = this.loadSubscriptions();
        }

        // Загрузка уведомлений
        loadNotifications() {
            try {
                return JSON.parse(localStorage.getItem('user_notifications') || '[]');
            } catch (e) {
                return [];
            }
        }

        // Сохранение уведомлений
        saveNotifications() {
            localStorage.setItem('user_notifications', JSON.stringify(this.notifications));
        }

        // Загрузка подписок на уведомления
        loadSubscriptions() {
            try {
                return JSON.parse(localStorage.getItem('notification_subscriptions') || '[]');
            } catch (e) {
                return [];
            }
        }

        // Сохранение подписок
        saveSubscriptions() {
            localStorage.setItem('notification_subscriptions', JSON.stringify(this.subscriptions));
        }

        // Подписка на уведомления о тайтле
        subscribeToManga(mangaId) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                throw new Error('Войдите в аккаунт для подписки на уведомления');
            }

            const manga = window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
            if (!manga) {
                throw new Error('Тайтл не найден');
            }

            const subscriptionKey = `${currentUser.id}_${mangaId}`;
            
            if (!this.subscriptions.includes(subscriptionKey)) {
                this.subscriptions.push(subscriptionKey);
                this.saveSubscriptions();
                
                // Добавляем в избранное автоматически
                this.addToFavorites(mangaId, manga);
                
                return true;
            }
            
            return false; // Уже подписан
        }

        // Отписка от уведомлений
        unsubscribeFromManga(mangaId) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return false;

            const subscriptionKey = `${currentUser.id}_${mangaId}`;
            const index = this.subscriptions.indexOf(subscriptionKey);
            
            if (index !== -1) {
                this.subscriptions.splice(index, 1);
                this.saveSubscriptions();
                return true;
            }
            
            return false;
        }

        // Проверка подписки на тайтл
        isSubscribedToManga(mangaId) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return false;

            const subscriptionKey = `${currentUser.id}_${mangaId}`;
            return this.subscriptions.includes(subscriptionKey);
        }

        // Добавление в избранное при подписке
        addToFavorites(mangaId, manga) {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const exists = favorites.find(item => item.mangaId === mangaId);
            
            if (!exists) {
                favorites.push({
                    id: Date.now(),
                    mangaId: mangaId,
                    title: manga.title,
                    image: manga.image,
                    addedAt: new Date().toISOString()
                });
                localStorage.setItem('favorites', JSON.stringify(favorites));
            }
        }

        // Создание уведомления о новой серии
        createEpisodeNotification(mangaId, episodeNumber) {
            const manga = window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
            if (!manga) return;

            // Находим всех подписанных пользователей
            const subscribedUsers = this.subscriptions
                .filter(sub => sub.endsWith(`_${mangaId}`))
                .map(sub => sub.split('_')[0]);

            subscribedUsers.forEach(userId => {
                const notification = {
                    id: Date.now() + Math.random(),
                    userId: userId,
                    mangaId: mangaId,
                    mangaTitle: manga.title,
                    mangaImage: manga.image,
                    type: 'new_episode',
                    title: 'Новая серия!',
                    message: `Вышла серия ${episodeNumber} тайтла "${manga.title}"`,
                    episodeNumber: episodeNumber,
                    createdAt: new Date().toISOString(),
                    read: false
                };

                this.notifications.push(notification);
            });

            this.saveNotifications();
            
            // Уведомляем об обновлении
            window.dispatchEvent(new CustomEvent('notificationsUpdated', {
                detail: { mangaId, episodeNumber }
            }));
        }

        // Получение уведомлений для текущего пользователя
        getUserNotifications() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return [];

            return this.notifications
                .filter(notification => notification.userId === currentUser.id)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Получение непрочитанных уведомлений
        getUnreadNotifications() {
            return this.getUserNotifications().filter(notification => !notification.read);
        }

        // Отметка уведомления как прочитанное
        markAsRead(notificationId) {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.saveNotifications();
                
                // Обновляем счетчик
                this.updateNotificationBadge();
            }
        }

        // Отметка всех как прочитанные
        markAllAsRead() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return;

            this.notifications.forEach(notification => {
                if (notification.userId === currentUser.id) {
                    notification.read = true;
                }
            });

            this.saveNotifications();
            this.updateNotificationBadge();
        }

        // Обновление счетчика уведомлений
        updateNotificationBadge() {
            const unreadCount = this.getUnreadNotifications().length;
            const badges = document.querySelectorAll('.notification-badge');
            
            badges.forEach(badge => {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            });
        }

        // Удаление уведомления
        deleteNotification(notificationId) {
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                this.notifications.splice(index, 1);
                this.saveNotifications();
                this.updateNotificationBadge();
            }
        }

        // Очистка старых уведомлений (старше 30 дней)
        cleanOldNotifications() {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            this.notifications = this.notifications.filter(notification => 
                new Date(notification.createdAt) > thirtyDaysAgo
            );

            this.saveNotifications();
        }

        // Получение всех подписок пользователя
        getUserSubscriptions() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return [];

            return this.subscriptions
                .filter(sub => sub.startsWith(`${currentUser.id}_`))
                .map(sub => sub.split('_')[1]);
        }
    }

    // Создаем глобальный экземпляр
    window.NotificationSystem = new NotificationSystem();

    // Автоочистка при загрузке
    window.NotificationSystem.cleanOldNotifications();

    console.log('🔔 Система уведомлений загружена');

})();