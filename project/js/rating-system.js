// Система рейтингов для Light Fox Manga
(function() {
    'use strict';

    class RatingSystem {
        constructor() {
            this.userRatings = this.loadUserRatings();
        }

        // Загрузка пользовательских рейтингов
        loadUserRatings() {
            try {
                return JSON.parse(localStorage.getItem('user_ratings') || '{}');
            } catch (e) {
                return {};
            }
        }

        // Сохранение пользовательских рейтингов
        saveUserRatings() {
            localStorage.setItem('user_ratings', JSON.stringify(this.userRatings));
        }

        // Получение рейтинга пользователя для тайтла
        getUserRating(mangaId) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return 0;
            
            const userKey = `${currentUser.id}_${mangaId}`;
            return this.userRatings[userKey] || 0;
        }

        // Установка рейтинга пользователем
        setUserRating(mangaId, rating) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) {
                throw new Error('Войдите в аккаунт для оценки');
            }

            if (rating < 1 || rating > 10) {
                throw new Error('Рейтинг должен быть от 1 до 10');
            }

            const userKey = `${currentUser.id}_${mangaId}`;
            const oldRating = this.userRatings[userKey] || 0;
            this.userRatings[userKey] = rating;
            this.saveUserRatings();

            // Обновляем общий рейтинг тайтла
            this.updateMangaRating(mangaId, rating, oldRating);

            return rating;
        }

        // Обновление общего рейтинга тайтла
        updateMangaRating(mangaId, newUserRating, oldUserRating) {
            if (!window.MangaAPI) return;

            const manga = window.MangaAPI.getMangaById(mangaId);
            if (!manga) return;

            // Получаем текущие данные рейтинга
            const currentRating = manga.rating || 0;
            const ratingCount = manga.ratingCount || 0;
            const ratingSum = manga.ratingSum || (currentRating * ratingCount);

            let newRatingSum = ratingSum;
            let newRatingCount = ratingCount;

            if (oldUserRating > 0) {
                // Пользователь уже оценивал - обновляем
                newRatingSum = newRatingSum - oldUserRating + newUserRating;
            } else {
                // Новая оценка
                newRatingSum += newUserRating;
                newRatingCount += 1;
            }

            const newAverageRating = newRatingCount > 0 ? newRatingSum / newRatingCount : 0;

            // Обновляем данные тайтла
            window.MangaAPI.updateManga(mangaId, {
                rating: Math.round(newAverageRating * 10) / 10, // Округляем до 1 знака
                ratingCount: newRatingCount,
                ratingSum: newRatingSum
            });

            // Уведомляем об обновлении
            window.dispatchEvent(new CustomEvent('ratingUpdated', {
                detail: { 
                    mangaId: mangaId,
                    newRating: newAverageRating,
                    userRating: newUserRating
                }
            }));
        }

        // Получение всех рейтингов пользователя
        getAllUserRatings() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!currentUser) return {};

            const userRatings = {};
            Object.keys(this.userRatings).forEach(key => {
                if (key.startsWith(`${currentUser.id}_`)) {
                    const mangaId = key.replace(`${currentUser.id}_`, '');
                    userRatings[mangaId] = this.userRatings[key];
                }
            });

            return userRatings;
        }

        // Создание звездного рейтинга (UI компонент)
        createStarRating(mangaId, currentRating = 0, isInteractive = true) {
            const userRating = this.getUserRating(mangaId);
            
            let starsHTML = '';
            for (let i = 1; i <= 10; i++) {
                const isFilled = i <= userRating;
                const isHalf = !isFilled && i <= currentRating && (currentRating % 1) >= 0.5;
                
                starsHTML += `
                    <span class="star ${isFilled ? 'filled' : ''} ${isHalf ? 'half' : ''}" 
                          data-rating="${i}" 
                          ${isInteractive ? `onclick="window.RatingSystem.setRating('${mangaId}', ${i})"` : ''}>
                        ⭐
                    </span>
                `;
            }

            return `
                <div class="star-rating ${isInteractive ? 'interactive' : ''}" data-manga-id="${mangaId}">
                    ${starsHTML}
                    <span class="rating-text">
                        ${userRating > 0 ? `Ваша оценка: ${userRating}` : 'Оцените тайтл'}
                        ${currentRating > 0 ? ` | Общий: ${currentRating}` : ''}
                    </span>
                </div>
            `;
        }

        // Публичный метод для установки рейтинга (вызывается из HTML)
        setRating(mangaId, rating) {
            try {
                const newRating = this.setUserRating(mangaId, rating);
                
                // Обновляем UI
                this.updateRatingUI(mangaId);
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification(`Вы поставили оценку ${newRating}/10`, 'success');
                }
                
                return newRating;
            } catch (error) {
                if (window.showNotification) {
                    window.showNotification(error.message, 'error');
                } else {
                    alert(error.message);
                }
            }
        }

        // Обновление UI рейтинга
        updateRatingUI(mangaId) {
            const ratingContainer = document.querySelector(`[data-manga-id="${mangaId}"]`);
            if (!ratingContainer) return;

            const manga = window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
            if (!manga) return;

            const userRating = this.getUserRating(mangaId);
            const currentRating = manga.rating || 0;

            // Обновляем звезды
            const stars = ratingContainer.querySelectorAll('.star');
            stars.forEach((star, index) => {
                const rating = index + 1;
                star.classList.toggle('filled', rating <= userRating);
            });

            // Обновляем текст
            const ratingText = ratingContainer.querySelector('.rating-text');
            if (ratingText) {
                ratingText.textContent = `${userRating > 0 ? `Ваша оценка: ${userRating}` : 'Оцените тайтл'}${currentRating > 0 ? ` | Общий: ${currentRating}` : ''}`;
            }
        }

        // Инициализация рейтингов на странице
        initializePageRatings() {
            document.querySelectorAll('.star-rating').forEach(container => {
                const mangaId = container.dataset.mangaId;
                if (mangaId) {
                    this.updateRatingUI(mangaId);
                }
            });
        }
    }

    // Создаем глобальный экземпляр
    window.RatingSystem = new RatingSystem();

    // Автоинициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.RatingSystem.initializePageRatings();
        });
    } else {
        window.RatingSystem.initializePageRatings();
    }

    console.log('⭐ Система рейтингов загружена');

})();