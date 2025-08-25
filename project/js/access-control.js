// Система контроля доступа для Light Fox Manga
(function() {
    'use strict';

    // Конфигурация доступа
    const ACCESS_CONFIG = {
        // Страницы, требующие авторизации
        authRequiredPages: ['catalog.html', 'player.html', 'cabinet.html'],
        
        // Контент по подпискам
        subscriptionContent: {
            free: [], // Бесплатный контент (доступен всем авторизованным)
            basic: [], // Требует Basic подписку или выше
            premium: [], // Требует Premium подписку или выше  
            vip: [] // Требует VIP подписку
        },
        
        // Иерархия подписок (каждый уровень включает предыдущие)
        subscriptionHierarchy: {
            free: 0,
            basic: 1,
            premium: 2,
            vip: 3
        }
    };

    class AccessControl {
        constructor() {
            this.loadSubscriptionContent();
        }

        // Загрузка контента по подпискам из админки
        loadSubscriptionContent() {
            const saved = localStorage.getItem('lightfox_subscription_content');
            if (saved) {
                try {
                    ACCESS_CONFIG.subscriptionContent = JSON.parse(saved);
                } catch (e) {
                    console.error('Ошибка загрузки контента подписок:', e);
                }
            }
        }

        // Проверка авторизации
        isAuthenticated() {
            return localStorage.getItem('isLoggedIn') === 'true';
        }

        // Получение текущего пользователя
        getCurrentUser() {
            if (!this.isAuthenticated()) return null;
            
            try {
                return JSON.parse(localStorage.getItem('currentUser') || 'null');
            } catch (e) {
                return null;
            }
        }

        // Получение активной подписки пользователя
        getUserSubscription() {
            if (!this.isAuthenticated()) return null;
            
            try {
                const subscription = JSON.parse(localStorage.getItem('userSubscription') || 'null');
                
                // Проверяем, не истекла ли подписка
                if (subscription && new Date(subscription.expiresAt) > new Date()) {
                    return subscription;
                }
                
                return null;
            } catch (e) {
                return null;
            }
        }

        // Получение уровня подписки пользователя
        getUserSubscriptionLevel() {
            const subscription = this.getUserSubscription();
            
            if (!subscription) {
                return this.isAuthenticated() ? 'free' : null;
            }
            
            return subscription.planType || 'free';
        }

        // Проверка доступа к странице
        checkPageAccess(pageName) {
            const currentPage = pageName || this.getCurrentPageName();
            
            // Если страница требует авторизации
            if (ACCESS_CONFIG.authRequiredPages.includes(currentPage)) {
                if (!this.isAuthenticated()) {
                    return {
                        allowed: false,
                        reason: 'auth_required',
                        message: 'Для доступа к этой странице необходимо войти в аккаунт'
                    };
                }
            }
            
            return { allowed: true };
        }

        // Проверка доступа к тайтлу
        checkMangaAccess(mangaId) {
            // Сначала проверяем авторизацию
            if (!this.isAuthenticated()) {
                return {
                    allowed: false,
                    reason: 'auth_required',
                    message: 'Войдите в аккаунт для просмотра тайтлов'
                };
            }

            // Получаем информацию о тайтле
            const manga = window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
            if (!manga) {
                return {
                    allowed: false,
                    reason: 'not_found',
                    message: 'Тайтл не найден'
                };
            }

            // Проверяем требования подписки
            const requiredTier = this.getMangaRequiredTier(mangaId);
            const userTier = this.getUserSubscriptionLevel();
            
            if (!this.hasSubscriptionAccess(userTier, requiredTier)) {
                return {
                    allowed: false,
                    reason: 'subscription_required',
                    message: `Для просмотра этого тайтла требуется подписка "${this.getTierDisplayName(requiredTier)}" или выше`,
                    requiredTier: requiredTier,
                    userTier: userTier,
                    manga: manga
                };
            }

            return { allowed: true, manga: manga };
        }

        // Определение требуемого уровня подписки для тайтла
        getMangaRequiredTier(mangaId) {
            const content = ACCESS_CONFIG.subscriptionContent;
            
            if (content.vip && content.vip.includes(mangaId)) return 'vip';
            if (content.premium && content.premium.includes(mangaId)) return 'premium';
            if (content.basic && content.basic.includes(mangaId)) return 'basic';
            
            return 'free'; // По умолчанию бесплатный доступ
        }

        // Проверка уровня подписки
        hasSubscriptionAccess(userTier, requiredTier) {
            if (!userTier) return false;
            
            const userLevel = ACCESS_CONFIG.subscriptionHierarchy[userTier] || 0;
            const requiredLevel = ACCESS_CONFIG.subscriptionHierarchy[requiredTier] || 0;
            
            return userLevel >= requiredLevel;
        }

        // Получение отображаемого имени уровня подписки
        getTierDisplayName(tier) {
            const names = {
                free: 'Любители Манги (Free)',
                basic: 'Любители Пика (Basic)',
                premium: 'Орден Шейхов (Premium)',
                vip: 'Лисямбы (VIP)'
            };
            
            return names[tier] || tier;
        }

        // Получение текущей страницы
        getCurrentPageName() {
            return window.location.pathname.split('/').pop() || 'index.html';
        }

        // Редирект на страницу авторизации
        redirectToAuth(returnUrl = null) {
            const currentUrl = returnUrl || window.location.href;
            const encodedUrl = encodeURIComponent(currentUrl);
            window.location.href = `registr.html?redirect=${encodedUrl}`;
        }

        // Показ popup подписки
        showSubscriptionPopup(requiredTier, mangaTitle) {
            const tierName = this.getTierDisplayName(requiredTier);
            
            if (confirm(`Для просмотра "${mangaTitle}" требуется подписка "${tierName}". Перейти к выбору подписки?`)) {
                window.location.href = 'subscriptions.html';
            }
        }

        // Проверка доступа при загрузке страницы
        enforcePageAccess() {
            const access = this.checkPageAccess();
            
            if (!access.allowed) {
                if (access.reason === 'auth_required') {
                    this.showAuthRequiredMessage();
                    return false;
                }
            }
            
            return true;
        }

        // Показ сообщения о необходимости авторизации
        showAuthRequiredMessage() {
            const currentPage = this.getCurrentPageName();
            
            if (currentPage === 'catalog.html') {
                this.showCatalogAuthRequired();
            } else if (currentPage === 'cabinet.html') {
                this.showCabinetAuthRequired();
            } else {
                this.redirectToAuth();
            }
        }

        // Сообщение для каталога
        showCatalogAuthRequired() {
            const authRequired = document.getElementById('authRequiredCatalog');
            const mangaGrid = document.getElementById('mangaGrid');
            const loadingState = document.getElementById('loadingState');
            
            if (authRequired) authRequired.style.display = 'block';
            if (mangaGrid) mangaGrid.style.display = 'none';
            if (loadingState) loadingState.style.display = 'none';
        }

        // Сообщение для кабинета
        showCabinetAuthRequired() {
            document.body.innerHTML = `
                <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-color); padding: 20px;">
                    <div style="text-align: center; background: var(--card-bg); padding: 40px; border-radius: 12px; box-shadow: var(--shadow); max-width: 400px;">
                        <span style="font-size: 4rem; margin-bottom: 1rem; display: block;">🔒</span>
                        <h2 style="color: var(--text-color); margin-bottom: 1rem;">Требуется авторизация</h2>
                        <p style="color: var(--secondary-color); margin-bottom: 2rem;">Войдите в аккаунт для доступа к личному кабинету</p>
                        <a href="registr.html?redirect=${encodeURIComponent(window.location.href)}" 
                           style="background: var(--primary-color); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                            Войти в аккаунт
                        </a>
                    </div>
                </div>
            `;
        }

        // Проверка доступа к тайтлу с обработкой
        checkAndEnforceMangaAccess(mangaId) {
            const access = this.checkMangaAccess(mangaId);
            
            if (!access.allowed) {
                if (access.reason === 'auth_required') {
                    if (confirm('Для просмотра тайтлов необходимо войти в аккаунт. Перейти к регистрации?')) {
                        this.redirectToAuth();
                    }
                    return false;
                } else if (access.reason === 'subscription_required') {
                    this.showSubscriptionPopup(access.requiredTier, access.manga.title);
                    return false;
                }
            }
            
            return access.allowed;
        }
    }

    // Создаем глобальный экземпляр
    window.AccessControl = new AccessControl();

    // Автоматическая проверка доступа при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        // Небольшая задержка для загрузки других систем
        setTimeout(() => {
            window.AccessControl.enforcePageAccess();
        }, 100);
    });

    console.log('🔐 Система контроля доступа загружена');

})();