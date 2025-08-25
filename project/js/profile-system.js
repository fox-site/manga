// Система профилей пользователей для Light Fox Manga
(function() {
    'use strict';

    class ProfileSystem {
        constructor() {
            this.profiles = this.loadProfiles();
        }

        // Загрузка профилей
        loadProfiles() {
            try {
                return JSON.parse(localStorage.getItem('user_profiles') || '{}');
            } catch (e) {
                return {};
            }
        }

        // Сохранение профилей
        saveProfiles() {
            localStorage.setItem('user_profiles', JSON.stringify(this.profiles));
        }

        // Получение профиля текущего пользователя
        getCurrentUserProfile() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return null;

            return this.profiles[currentUser.id] || this.createDefaultProfile(currentUser);
        }

        // Создание профиля по умолчанию
        createDefaultProfile(user) {
            const defaultProfile = {
                id: user.id,
                username: user.name || user.username || 'Пользователь',
                email: user.email || 'user@example.com',
                avatar: null, // base64 изображение
                bio: '',
                joinedAt: new Date().toISOString(),
                settings: {
                    theme: 'light',
                    language: 'ru',
                    notifications: true,
                    emailNotifications: false
                },
                stats: {
                    totalWatched: 0,
                    totalRatings: 0,
                    totalComments: 0,
                    totalDonations: 0
                }
            };

            this.profiles[user.id] = defaultProfile;
            this.saveProfiles();
            return defaultProfile;
        }

        // Обновление профиля
        updateProfile(updates) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                throw new Error('Пользователь не авторизован');
            }

            const profile = this.getCurrentUserProfile();
            if (!profile) {
                throw new Error('Профиль не найден');
            }

            // Обновляем профиль
            Object.assign(profile, updates);
            this.profiles[currentUser.id] = profile;
            this.saveProfiles();

            // Обновляем данные пользователя в currentUser
            if (updates.username) {
                currentUser.name = updates.username;
                currentUser.username = updates.username;
            }
            if (updates.email) {
                currentUser.email = updates.email;
            }
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            return profile;
        }

        // Загрузка аватара
        uploadAvatar(file) {
            return new Promise((resolve, reject) => {
                if (!file) {
                    reject(new Error('Файл не выбран'));
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    reject(new Error('Выберите изображение'));
                    return;
                }

                if (file.size > 2 * 1024 * 1024) { // 2MB
                    reject(new Error('Размер файла не должен превышать 2MB'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const avatar = e.target.result;
                        this.updateProfile({ avatar });
                        resolve(avatar);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('Ошибка чтения файла'));
                reader.readAsDataURL(file);
            });
        }

        // Удаление аватара
        removeAvatar() {
            this.updateProfile({ avatar: null });
        }

        // Получение аватара пользователя
        getUserAvatar(userId = null) {
            const targetUserId = userId || JSON.parse(localStorage.getItem('currentUser') || 'null')?.id;
            if (!targetUserId) return null;

            const profile = this.profiles[targetUserId];
            return profile?.avatar || null;
        }

        // Получение отображаемого имени
        getDisplayName(userId = null) {
            const targetUserId = userId || JSON.parse(localStorage.getItem('currentUser') || 'null')?.id;
            if (!targetUserId) return 'Гость';

            const profile = this.profiles[targetUserId];
            return profile?.username || 'Пользователь';
        }

        // Обновление статистики
        updateStats(statType, increment = 1) {
            const profile = this.getCurrentUserProfile();
            if (!profile) return;

            if (!profile.stats[statType]) {
                profile.stats[statType] = 0;
            }

            profile.stats[statType] += increment;
            this.saveProfiles();
        }

        // Создание аватара по умолчанию
        generateDefaultAvatar(username) {
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');

            // Фон
            const colors = ['#ff8a50', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const bgColor = colors[username.length % colors.length];
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, 120, 120);

            // Текст
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const initials = username.charAt(0).toUpperCase();
            ctx.fillText(initials, 60, 60);

            return canvas.toDataURL();
        }
    }

    // Создаем глобальный экземпляр
    window.ProfileSystem = new ProfileSystem();

    console.log('👤 Система профилей загружена');

})();